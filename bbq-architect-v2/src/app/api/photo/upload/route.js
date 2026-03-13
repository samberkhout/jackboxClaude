/**
 * Foto Upload API — /api/photo/upload
 *
 * Flow:
 *  1. Ontvang afbeelding (multipart form-data)
 *  2. Upload origineel naar Supabase Storage (bucket: photo-logbook)
 *  3. Upload naar Cloudinary met auto-edit transformaties (optioneel)
 *  4. Sla op in photo_logbook — categorie/tags/beschrijving komen van de client
 *     (lokaal gegenereerd via CLIP in de browser, geen betaalde AI)
 *
 * Vereiste omgevingsvariabelen:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY         (of SUPABASE_SERVICE_ROLE_KEY voor storage)
 *   CLOUDINARY_CLOUD_NAME                 (optioneel — voor auto-edit)
 *   CLOUDINARY_API_KEY                    (optioneel)
 *   CLOUDINARY_API_SECRET                 (optioneel)
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

var supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

var CLOUDINARY_CLOUD = process.env.CLOUDINARY_CLOUD_NAME || '';
var CLOUDINARY_KEY   = process.env.CLOUDINARY_API_KEY || '';
var CLOUDINARY_SECRET = process.env.CLOUDINARY_API_SECRET || '';
var BUCKET = 'photo-logbook';

// ── Cloudinary upload via signed REST API ──────────────────────────────────
async function uploadToCloudinary(buffer, mimeType, applyEdits) {
    if (!CLOUDINARY_CLOUD || !CLOUDINARY_KEY || !CLOUDINARY_SECRET) {
        return null; // Cloudinary niet geconfigureerd — sla editstap over
    }

    var timestamp = Math.floor(Date.now() / 1000).toString();
    var folder = 'hop-bites-foto-archief';

    // Transformaties voor professionele BBQ-vibe:
    //  a_auto          — automatisch rechttrekken (horizon detectie)
    //  c_fill,ar_4:3   — smart crop naar 4:3
    //  g_auto          — onderwerp als focal point
    //  e_improve       — algemene kleurverbetering
    //  e_viesus_correct — Cloudinary AI kleurcorrectie
    var transformation = applyEdits
        ? 'a_auto/c_fill,ar_4:3,g_auto/e_improve/e_viesus_correct'
        : '';

    var paramsToSign = 'folder=' + folder + '&timestamp=' + timestamp;
    if (transformation) paramsToSign += '&transformation=' + transformation;

    var signature = crypto
        .createHash('sha1')
        .update(paramsToSign + CLOUDINARY_SECRET)
        .digest('hex');

    var form = new FormData();
    form.append('file', new Blob([buffer], { type: mimeType }));
    form.append('api_key', CLOUDINARY_KEY);
    form.append('timestamp', timestamp);
    form.append('folder', folder);
    form.append('signature', signature);
    if (transformation) form.append('transformation', transformation);

    var url = 'https://api.cloudinary.com/v1_1/' + CLOUDINARY_CLOUD + '/image/upload';
    var res = await fetch(url, { method: 'POST', body: form });
    if (!res.ok) {
        var err = await res.text();
        throw new Error('Cloudinary upload mislukt: ' + err);
    }
    var data = await res.json();
    return data.secure_url;
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

        var { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(bestandsnaam);
        var originalUrl = publicUrl;

        // 2. Cloudinary auto-edit (parallel uploadbaar, AI komt van client)
        var editedUrl = await uploadToCloudinary(buffer, mimeType, applyEdits).catch(function(e) {
            console.warn('[photo-upload] Cloudinary fout (niet fataal):', e.message);
            return null;
        });

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
            cloudinary: !!editedUrl,
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
