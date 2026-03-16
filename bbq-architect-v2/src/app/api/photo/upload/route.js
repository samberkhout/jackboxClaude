/**
 * Foto Upload API — /api/photo/upload
 *
 * Flow:
 *  1. Ontvang afbeelding (multipart form-data)
 *  2. Bewerk lokaal met Sharp: EXIF-rotatie, 4:3 crop, normalize, saturation
 *  3. Upload origineel + bewerkte versie naar Supabase Storage
 *  4. Sla op in photo_logbook — categorie/tags/beschrijving komen van de client
 *     (lokaal gegenereerd via CLIP in de browser, geen betaalde AI)
 *
 * Vereiste omgevingsvariabelen:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  (of SUPABASE_SERVICE_ROLE_KEY voor storage)
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

var supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

var BUCKET = 'photo-logbook';

// ── Lokale bewerking met Sharp ─────────────────────────────────────────────
async function bewerkFoto(buffer) {
    return sharp(buffer)
        .rotate()                                  // EXIF auto-rotate
        .resize(1200, 900, {                       // 4:3, center crop
            fit: 'cover',
            position: 'centre',
        })
        .normalize()                               // auto contrast/brightness
        .modulate({ saturation: 1.15 })            // lichte saturation boost
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
}

// ── POST handler ───────────────────────────────────────────────────────────
export async function POST(request) {
    try {
        var formData = await request.formData();
        var file = formData.get('photo');
        var eventId = formData.get('event_id') || null;
        var applyEdits = formData.get('auto_edit') !== 'false';
        // AI-resultaten worden lokaal in de browser bepaald via CLIP (geen betaalde API)
        var predictedCategory    = formData.get('predicted_category')    || 'Admin';
        var predictedDescription = formData.get('predicted_description') || '';
        var predictedTagsRaw     = formData.get('predicted_tags')        || '[]';
        var predictedTags;
        try { predictedTags = JSON.parse(predictedTagsRaw); } catch(e) { predictedTags = []; }

        if (!file || typeof file === 'string') {
            return Response.json({ error: 'Geen foto ontvangen (veld: photo)' }, { status: 400 });
        }

        var mimeType = file.type || 'image/jpeg';
        var allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
        if (!allowedTypes.includes(mimeType)) {
            return Response.json({ error: 'Ongeldig bestandstype. Gebruik JPEG, PNG, WebP of HEIC.' }, { status: 400 });
        }

        var arrayBuffer = await file.arrayBuffer();
        var buffer = Buffer.from(arrayBuffer);
        var ext = mimeType.split('/')[1].replace('jpeg', 'jpg');
        var bestandsnaam = 'foto_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;

        // 1. Upload origineel naar Supabase Storage
        var { error: storageError } = await supabase.storage
            .from(BUCKET)
            .upload(bestandsnaam, buffer, { contentType: mimeType, upsert: false });

        if (storageError) throw new Error('Supabase Storage: ' + storageError.message);

        var { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(bestandsnaam);
        var originalUrl = urlData?.publicUrl;
        if (!originalUrl) throw new Error('Kon geen publieke URL ophalen voor het geüploade bestand');

        // 2. Lokale bewerking met Sharp (optioneel)
        var editedUrl = originalUrl;
        if (applyEdits) {
            try {
                var editedBuffer = await bewerkFoto(buffer);
                var editedNaam = 'edited_' + bestandsnaam.replace(/\.\w+$/, '.jpg');
                var { error: editError } = await supabase.storage
                    .from(BUCKET)
                    .upload(editedNaam, editedBuffer, { contentType: 'image/jpeg', upsert: false });
                if (!editError) {
                    var { data: editedUrlData } = supabase.storage.from(BUCKET).getPublicUrl(editedNaam);
                    if (editedUrlData?.publicUrl) editedUrl = editedUrlData.publicUrl;
                }
            } catch(e) {
                console.warn('[photo-upload] Sharp bewerking mislukt (niet fataal):', e.message);
            }
        }

        // 3. Sla op in photo_logbook
        var { data: foto, error: dbError } = await supabase
            .from('photo_logbook')
            .insert({
                original_url:   originalUrl,
                edited_url:     editedUrl || originalUrl,
                category:       predictedCategory,
                ai_tags:        predictedTags,
                ai_description: predictedDescription,
                event_id:       eventId || null,
            })
            .select()
            .single();

        if (dbError) throw new Error('Database: ' + dbError.message);

        return Response.json({
            success: true,
            foto: foto,
            edited: editedUrl !== originalUrl,
        });
    } catch (err) {
        console.error('[photo-upload]', err);
        return Response.json({ error: err.message || 'Upload mislukt' }, { status: 500 });
    }
}

// ── GET — haal foto's op (optioneel gefilterd op categorie) ─────────────────
export async function GET(request) {
    try {
        var { searchParams } = new URL(request.url);
        var category = searchParams.get('category');
        var limit = parseInt(searchParams.get('limit') || '100', 10);
        var offset = parseInt(searchParams.get('offset') || '0', 10);

        var query = supabase
            .from('photo_logbook')
            .select('*')
            .order('uploaded_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (category && category !== 'Alles') {
            query = query.eq('category', category);
        }

        var { data, error, count } = await query;
        if (error) throw error;

        return Response.json({ fotos: data || [], total: count });
    } catch (err) {
        console.error('[photo-upload GET]', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

// ── DELETE — verwijder een foto ────────────────────────────────────────────
export async function DELETE(request) {
    try {
        var { searchParams } = new URL(request.url);
        var id = searchParams.get('id');
        if (!id) return Response.json({ error: 'id is verplicht' }, { status: 400 });

        var { data: foto } = await supabase
            .from('photo_logbook')
            .select('original_url')
            .eq('id', id)
            .single();

        // Verwijder uit Supabase Storage
        if (foto?.original_url) {
            var bestandsnaam = foto.original_url.split('/').pop();
            await supabase.storage.from(BUCKET).remove([bestandsnaam]);
        }

        var { error } = await supabase.from('photo_logbook').delete().eq('id', id);
        if (error) throw error;

        return Response.json({ success: true });
    } catch (err) {
        console.error('[photo-upload DELETE]', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
