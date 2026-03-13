import { createClient } from '@supabase/supabase-js';

var supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * GET /api/widget/mep-list
 *
 * Geeft de 5 belangrijkste mise-en-place taken voor vandaag terug.
 *
 * Prioriteitslogica:
 *   1. Te laat (prep-datum < vandaag, niet afgerond)
 *   2. Vandaag gepland
 *   3. Morgen of overmorgen (urgent)
 *   4. Rest (komende week)
 *
 * De prep-datum wordt berekend als: event.date + task.dagen (negatief = X dagen vóór)
 *
 * CORS: toestaan voor Android-widgets
 */
export async function GET() {
    try {
        var todayStr = new Date().toISOString().split('T')[0];
        var todayMs = new Date(todayStr + 'T00:00:00').getTime();

        // Haal alle open prep-taken + actieve events parallel op
        var [tasksRes, eventsRes] = await Promise.all([
            supabase.from('prep_tasks').select('*').eq('done', false),
            supabase.from('events').select('id, name, date, location, guests, status').neq('status', 'completed'),
        ]);

        if (tasksRes.error) throw tasksRes.error;
        if (eventsRes.error) throw eventsRes.error;

        var tasks = tasksRes.data || [];
        var events = eventsRes.data || [];

        // Verrijkt elke prep-taak met datum en prioriteit
        var enriched = tasks
            .map(function (task) {
                var event = events.find(function (e) { return e.id === task.event_id; });
                if (!event || !event.date) return null;

                var evDate = new Date(event.date + 'T00:00:00');
                var prepDate = new Date(evDate);
                prepDate.setDate(prepDate.getDate() + (task.dagen || 0));
                var prepDateStr = prepDate.getFullYear() + '-'
                    + String(prepDate.getMonth() + 1).padStart(2, '0') + '-'
                    + String(prepDate.getDate()).padStart(2, '0');

                var daysUntil = Math.ceil((prepDate.getTime() - todayMs) / 86400000);

                var prioriteit;
                var prioriteitSort;
                if (daysUntil < 0) { prioriteit = 'te_laat'; prioriteitSort = 0; }
                else if (daysUntil === 0) { prioriteit = 'vandaag'; prioriteitSort = 1; }
                else if (daysUntil <= 2) { prioriteit = 'urgent'; prioriteitSort = 2; }
                else if (daysUntil <= 7) { prioriteit = 'deze_week'; prioriteitSort = 3; }
                else { prioriteit = 'later'; prioriteitSort = 4; }

                return {
                    id: task.id,
                    tekst: task.text,
                    prep_datum: prepDateStr,
                    dagen_tot_prep: daysUntil,
                    prioriteit: prioriteit,
                    prioriteit_sort: prioriteitSort,
                    event: {
                        id: event.id,
                        naam: event.name,
                        datum: event.date,
                        locatie: event.location || '',
                        gasten: event.guests,
                    },
                };
            })
            .filter(Boolean)
            // Alleen taken tot en met komende 7 dagen tonen in de widget
            .filter(function (t) { return t.prioriteit_sort <= 3; })
            .sort(function (a, b) {
                var diff = a.prioriteit_sort - b.prioriteit_sort;
                if (diff !== 0) return diff;
                return a.prep_datum < b.prep_datum ? -1 : 1;
            })
            .slice(0, 5);

        // Verwijder interne sort-key uit respons
        enriched.forEach(function (t) { delete t.prioriteit_sort; });

        return Response.json({
            datum: todayStr,
            taken: enriched,
            totaal_open: tasks.length,
            samenvatting: buildSamenvatting(enriched),
        }, { headers: corsHeaders() });

    } catch (err) {
        console.error('[widget/mep-list]', err);
        return Response.json({ error: err.message }, { status: 500, headers: corsHeaders() });
    }
}

function buildSamenvatting(taken) {
    var teLaat = taken.filter(function (t) { return t.prioriteit === 'te_laat'; }).length;
    var vandaag = taken.filter(function (t) { return t.prioriteit === 'vandaag'; }).length;
    var urgent = taken.filter(function (t) { return t.prioriteit === 'urgent'; }).length;

    if (teLaat > 0) return teLaat + ' taak(taken) te laat — direct actie vereist!';
    if (vandaag > 0) return vandaag + ' taak(taken) voor vandaag';
    if (urgent > 0) return urgent + ' urgente taak(taken) de komende 2 dagen';
    return 'Alles op schema';
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
