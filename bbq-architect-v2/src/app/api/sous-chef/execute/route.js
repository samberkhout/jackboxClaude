/**
 * Sous-Chef Execute API — /api/sous-chef/execute
 *
 * Voert bevestigde database-acties uit die de Sous-Chef heeft voorgesteld.
 * Wordt alleen aangeroepen na expliciete gebruikersbevestiging in de UI.
 *
 * Ondersteunde acties:
 *   upsert_recipe   — Recept aanmaken of bijwerken
 *   upsert_event    — Event aanmaken of bijwerken
 *   update_price    — Leveranciersprijs bijwerken
 *   save_quote      — Offerte opslaan
 */

import { createClient } from '@supabase/supabase-js';

var supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request) {
    try {
        var { action, payload } = await request.json();

        if (!action || !payload) {
            return Response.json({ error: 'action en payload zijn verplicht' }, { status: 400 });
        }

        switch (action) {

            case 'upsert_recipe': {
                var recept = {
                    naam:        payload.naam,
                    categorie:   payload.categorie || null,
                    porties:     payload.porties || null,
                    preptime:    payload.preptime || null,
                    instructies: payload.instructies || null,
                    ingredienten: payload.ingredienten || [],
                };
                var query;
                if (payload.id) {
                    query = supabase.from('recepten').update(recept).eq('id', payload.id).select().single();
                } else {
                    query = supabase.from('recepten').insert(recept).select().single();
                }
                var { data, error } = await query;
                if (error) throw new Error('Recept opslaan: ' + error.message);
                return Response.json({ success: true, message: 'Recept "' + recept.naam + '" opgeslagen.', data: data });
            }

            case 'upsert_event': {
                var event = {
                    name:     payload.name,
                    date:     payload.date || null,
                    guests:   payload.guests || null,
                    location: payload.location || null,
                    status:   payload.status || 'concept',
                    notes:    payload.notes || null,
                };
                var query;
                if (payload.id) {
                    query = supabase.from('events').update(event).eq('id', payload.id).select().single();
                } else {
                    query = supabase.from('events').insert(event).select().single();
                }
                var { data, error } = await query;
                if (error) throw new Error('Event opslaan: ' + error.message);
                return Response.json({ success: true, message: 'Event "' + event.name + '" opgeslagen.', data: data });
            }

            case 'update_price': {
                // Haal huidige prijs op om previous_price te bewaren
                var { data: bestaand } = await supabase
                    .from('supplier_prices')
                    .select('price_per_unit')
                    .ilike('product_name', '%' + payload.product_naam + '%')
                    .eq('supplier_name', payload.leverancier)
                    .limit(1)
                    .single();

                var update = {
                    price_per_unit:  payload.nieuwe_prijs,
                    previous_price:  bestaand ? bestaand.price_per_unit : null,
                    updated_at:      new Date().toISOString(),
                };
                if (payload.eenheid) update.unit_type = payload.eenheid;

                var { error } = await supabase
                    .from('supplier_prices')
                    .update(update)
                    .ilike('product_name', '%' + payload.product_naam + '%')
                    .eq('supplier_name', payload.leverancier);

                if (error) throw new Error('Prijs bijwerken: ' + error.message);
                return Response.json({ success: true, message: payload.leverancier + ' — "' + payload.product_naam + '" bijgewerkt naar €' + Number(payload.nieuwe_prijs).toFixed(2) });
            }

            case 'save_quote': {
                var offerte = {
                    klant_naam:        payload.klant_naam,
                    event_naam:        payload.event_naam,
                    datum:             payload.datum || null,
                    gasten:            payload.gasten,
                    menu:              payload.menu || [],
                    prijs_per_persoon: payload.prijs_per_persoon,
                    totaal_excl:       payload.totaal_excl,
                    btw:               payload.btw,
                    totaal_incl:       payload.totaal_incl,
                    notities:          payload.notities || null,
                    status:            'concept',
                };
                var { data, error } = await supabase.from('offertes').insert(offerte).select().single();
                if (error) throw new Error('Offerte opslaan: ' + error.message);
                return Response.json({ success: true, message: 'Offerte voor "' + offerte.klant_naam + '" opgeslagen (€' + Number(offerte.totaal_incl).toFixed(2) + ' incl. BTW).', data: data });
            }

            default:
                return Response.json({ error: 'Onbekende actie: ' + action }, { status: 400 });
        }

    } catch (err) {
        console.error('[sous-chef/execute]', err);
        return Response.json({ error: err.message || 'Uitvoering mislukt' }, { status: 500 });
    }
}
