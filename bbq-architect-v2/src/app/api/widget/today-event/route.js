import { createClient } from '@supabase/supabase-js';

var supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * GET /api/widget/today-event
 *
 * Geeft het eerstvolgende event terug (datum >= vandaag, status != completed)
 * inclusief menu-details (recepten) en vega-aantallen.
 *
 * Vega-aantallen worden uitgelezen uit het veld `vegan_count` (als dat bestaat)
 * of als fallback uit de notitie via het patroon "vega: 5" / "vegan: 5".
 *
 * Respons:
 *   { event: { ... } | null, message?: string }
 *
 * CORS: toestaan voor Android-widgets (alle origins)
 */
export async function GET(request) {
    try {
        var todayStr = new Date().toISOString().split('T')[0];

        // Haal het eerst komende event op
        var { data: event, error } = await supabase
            .from('events')
            .select('*')
            .gte('date', todayStr)
            .neq('status', 'completed')
            .order('date', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (!event) {
            return Response.json(
                { event: null, message: 'Geen aankomende events gevonden' },
                { headers: corsHeaders() }
            );
        }

        // Haal recepten op die in het menu staan
        var menuIds = event.menu || [];
        var menuDetails = [];

        if (menuIds.length > 0) {
            var { data: recepten } = await supabase
                .from('recepten')
                .select('id, naam, categorie, porties, preptime, ingredienten')
                .in('id', menuIds);
            menuDetails = recepten || [];
        }

        // Vega-aantallen: eigen kolom of extractie uit notitie
        var vegaAantallen = event.vegan_count || 0;
        if (!vegaAantallen) {
            var vegaMatch = (event.notitie || '').match(/veg[ae](?:a|an)?[:\s]+(\d+)/i);
            if (vegaMatch) vegaAantallen = parseInt(vegaMatch[1]);
        }

        // Dagen tot het event
        var eventDate = new Date(event.date + 'T00:00:00');
        var now = new Date();
        now.setHours(0, 0, 0, 0);
        var dagenTot = Math.ceil((eventDate - now) / 86400000);

        // Bereken totaal ingrediënten over alle menu-items
        var totalIngredients = menuDetails.reduce(function (sum, r) {
            return sum + (Array.isArray(r.ingredienten) ? r.ingredienten.length : 0);
        }, 0);

        return Response.json({
            event: {
                id: event.id,
                naam: event.name,
                datum: event.date,
                locatie: event.location || '',
                gasten: event.guests,
                ppp: event.ppp,
                omzet: Math.round((event.guests || 0) * (event.ppp || 0) * 100) / 100,
                status: event.status,
                type: event.type || 'Particulier',
                client: event.client_naam || '',
                dagen_tot_event: dagenTot,
                vega_aantallen: vegaAantallen,
                notitie: event.notitie || '',
                menu: menuDetails.map(function (r) {
                    return {
                        id: r.id,
                        naam: r.naam,
                        categorie: r.categorie,
                        porties: r.porties,
                        preptime: r.preptime,
                        ingredienten_count: Array.isArray(r.ingredienten) ? r.ingredienten.length : 0,
                    };
                }),
                menu_items_count: menuDetails.length,
                totaal_ingredienten: totalIngredients,
            },
        }, { headers: corsHeaders() });

    } catch (err) {
        console.error('[widget/today-event]', err);
        return Response.json({ error: err.message }, { status: 500, headers: corsHeaders() });
    }
}

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
    };
}

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: corsHeaders() });
}
