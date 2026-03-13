/**
 * Digital Sous-Chef API — /api/sous-chef
 *
 * AI-agent met function-calling toegang tot Supabase.
 * Reageert als SSE stream zodat de UI realtime tool-executie en tekst toont.
 *
 * Vereiste omgevingsvariabelen (.env.local):
 *   ANTHROPIC_API_KEY=sk-ant-...    ← Anthropic direct (aanbevolen, ondersteunt tools)
 *   -- OF --
 *   POE_API_KEY=...                 ← Poe API (geen tool-calling, alleen tekst)
 *   POE_BOT_NAME=Claude-3.5-Sonnet  ← Naam van de bot op Poe
 *
 * SSE event formaat:
 *   data: {"type":"tool_start","tool":"...","input":{...}}
 *   data: {"type":"tool_done","tool":"...","label":"..."}
 *   data: {"type":"text","delta":"..."}
 *   data: {"type":"done"}
 *   data: {"type":"error","message":"..."}
 */

import { createClient } from '@supabase/supabase-js';

var supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ── System prompt ───────────────────────────────────────────────────────────
var SYSTEM_PROMPT = `Jij bent de Digital Sous-Chef van Hop & Bites — een professioneel BBQ-cateringbedrijf in Drenthe, opgericht door Sam Berkhout. Je werkt op een Yoder YS1500 pellet smoker en een Flat Top grill.

GEDRAG:
- Wees proactief: als je een goedkopere leverancier ziet, meld dat direct.
- Wees kort en krachtig — geen lange inleidingen.
- Gebruik culinaire vakkennis: je kent de Maillard-reactie, low-and-slow BBQ, sous-vide temperaturen.
- Schrijf in het Nederlands. Gebruik **vet** voor belangrijke getallen en namen.

FINANCIEEL KADER:
- Standaard menuprijs: **€38,50** per persoon
- Doelstelling foodcost: maximaal **30%** (= €11,55 per portie)
- Leveranciers: Sligro, Hanos, Bidfood — altijd goedkoopste aanbevelen

TOOLS:
Je hebt directe toegang tot de live database via functie-aanroepen. Gebruik ze altijd bij vragen over prijzen, recepten of events — nooit raden, altijd data ophalen.

TOON: Direct. Culinair. Gedreven door kwaliteit én marge.`;

// ── Tool definities ──────────────────────────────────────────────────────────
var TOOLS = [
    {
        name: 'get_supplier_prices',
        description: 'Zoek actuele leveranciersprijs voor een product in Sligro, Hanos of Bidfood. Gebruik dit bij vragen over inkoop, prijsvergelijking of Smart Sourcing.',
        input_schema: {
            type: 'object',
            properties: {
                product_naam: { type: 'string', description: 'Naam of deel van de productnaam (bijv. "ribben", "kip", "aardappel")' },
                leverancier: { type: 'string', description: 'Filter op leverancier: Sligro, Hanos of Bidfood (optioneel)' },
            },
            required: ['product_naam'],
        },
    },
    {
        name: 'get_recipe',
        description: 'Haal recept(en) op met ingrediënten en bereidingswijze uit de database.',
        input_schema: {
            type: 'object',
            properties: {
                recept_naam: { type: 'string', description: 'Naam of deel van de receptnaam' },
                recept_id: { type: 'number', description: 'Exact recept-ID (indien bekend)' },
            },
        },
    },
    {
        name: 'get_event',
        description: 'Haal aankomende event(s) op met klantgegevens, aantal gasten en vega-aantallen.',
        input_schema: {
            type: 'object',
            properties: {
                event_naam: { type: 'string', description: 'Naam of deel van de eventnaam' },
                event_id: { type: 'number', description: 'Exact event-ID (indien bekend)' },
                eerstvolgende: { type: 'boolean', description: 'true = haal het eerstvolgende event op' },
            },
        },
    },
    {
        name: 'calculate_foodcost',
        description: 'Bereken de foodcost en marge van een recept op basis van de meest recente leveranciersprijs. Geeft breakdown per ingredient.',
        input_schema: {
            type: 'object',
            properties: {
                recept_id: { type: 'number', description: 'ID van het recept' },
                recept_naam: { type: 'string', description: 'Naam van het recept (als id onbekend is)' },
                menu_prijs: { type: 'number', description: 'Verkoopprijs per persoon in euro (standaard 38.50)' },
            },
        },
    },
    {
        name: 'generate_shopping_list',
        description: 'Genereer een complete inkooplijst voor een event met de scherpste leveranciersprijs per product.',
        input_schema: {
            type: 'object',
            properties: {
                event_id: { type: 'number', description: 'ID van het event' },
                event_naam: { type: 'string', description: 'Naam van het event (als id onbekend is)' },
            },
        },
    },
    {
        name: 'suggest_vegan_alternatives',
        description: 'Zoek vega/vegan alternatieven voor ingrediënten, inclusief beschikbaarheid en prijs bij leveranciers.',
        input_schema: {
            type: 'object',
            properties: {
                ingredienten: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Lijst van ingrediënten waarvoor je vega-alternatieven wilt',
                },
                aantal_gasten: { type: 'number', description: 'Aantal vega-gasten (voor hoeveelheidsberekening)' },
            },
            required: ['ingredienten'],
        },
    },
    {
        name: 'check_price_changes',
        description: 'Controleer recente prijswijzigingen bij leveranciers (stijgingen en dalingen). Gebruik dit voor proactieve alerts.',
        input_schema: {
            type: 'object',
            properties: {
                drempel_pct: { type: 'number', description: 'Minimale wijziging in % om te melden (standaard 3)' },
                leverancier: { type: 'string', description: 'Filter op leverancier (optioneel)' },
            },
        },
    },
];

// ── Tool executie ────────────────────────────────────────────────────────────
async function executeTool(name, input) {
    switch (name) {

        case 'get_supplier_prices': {
            var query = supabase
                .from('supplier_prices')
                .select('supplier_name, article_number, product_name, price_per_unit, unit_type, previous_price, updated_at')
                .ilike('product_name', '%' + input.product_naam + '%')
                .order('price_per_unit');
            if (input.leverancier) query = query.eq('supplier_name', input.leverancier);
            var { data } = await query.limit(15);
            if (!data || data.length === 0) return { resultaat: 'Geen producten gevonden voor "' + input.product_naam + '"' };
            var goedkoopste = data[0];
            return {
                producten: data,
                goedkoopste: goedkoopste,
                samenvatting: data.length + ' resultaten. Goedkoopste: ' + goedkoopste.supplier_name + ' — €' + Number(goedkoopste.price_per_unit).toFixed(2) + ' per ' + goedkoopste.unit_type,
            };
        }

        case 'get_recipe': {
            var q = supabase.from('recepten').select('*');
            if (input.recept_id) q = q.eq('id', input.recept_id);
            else if (input.recept_naam) q = q.ilike('naam', '%' + input.recept_naam + '%');
            var { data: recepten } = await q.limit(3);
            if (!recepten || recepten.length === 0) return { resultaat: 'Geen recepten gevonden' };
            return {
                recepten: recepten.map(function (r) {
                    return {
                        id: r.id,
                        naam: r.naam,
                        categorie: r.categorie,
                        porties: r.porties,
                        preptime: r.preptime,
                        instructies: r.instructies,
                        ingredienten: r.ingredienten || [],
                    };
                }),
            };
        }

        case 'get_event': {
            var todayStr = new Date().toISOString().split('T')[0];
            var eq = supabase.from('events').select('*').neq('status', 'completed');
            if (input.event_id) eq = eq.eq('id', input.event_id);
            else if (input.event_naam) eq = eq.ilike('name', '%' + input.event_naam + '%');
            else if (input.eerstvolgende) eq = eq.gte('date', todayStr).order('date').limit(1);
            else eq = eq.gte('date', todayStr).order('date').limit(5);
            var { data: events } = await eq.limit(5);
            if (!events || events.length === 0) return { resultaat: 'Geen aankomende events gevonden' };
            return { events: events };
        }

        case 'calculate_foodcost': {
            var receptQuery = supabase.from('recepten').select('*');
            if (input.recept_id) receptQuery = receptQuery.eq('id', input.recept_id);
            else if (input.recept_naam) receptQuery = receptQuery.ilike('naam', '%' + input.recept_naam + '%').limit(1);
            var { data: receptData } = await receptQuery.limit(1);
            var recept = receptData && receptData[0];
            if (!recept) return { error: 'Recept niet gevonden' };

            var ingredienten = Array.isArray(recept.ingredienten) ? recept.ingredienten : [];
            var totalCost = 0;
            var breakdown = [];
            var ontbrekendeIngred = [];

            for (var i = 0; i < ingredienten.length; i++) {
                var ing = ingredienten[i];
                if (!ing.naam) continue;
                var { data: prices } = await supabase
                    .from('supplier_prices')
                    .select('supplier_name, product_name, price_per_unit, unit_type')
                    .ilike('product_name', '%' + ing.naam + '%')
                    .order('price_per_unit')
                    .limit(1);

                if (prices && prices.length > 0) {
                    var p = prices[0];
                    var qty = parseFloat(ing.hoeveelheid) || 0;
                    var unitFactor = 1;
                    if (ing.eenheid === 'gram' && p.unit_type === 'kg') unitFactor = 0.001;
                    if (ing.eenheid === 'ml' && p.unit_type === 'liter') unitFactor = 0.001;
                    var kostprijs = qty * unitFactor * p.price_per_unit;
                    totalCost += kostprijs;
                    breakdown.push({
                        ingredient: ing.naam,
                        hoeveelheid: ing.hoeveelheid + ' ' + ing.eenheid,
                        leverancier: p.supplier_name,
                        prijs_per_eenheid: Number(p.price_per_unit).toFixed(2) + ' per ' + p.unit_type,
                        kostprijs_ingredient: kostprijs.toFixed(3),
                    });
                } else {
                    ontbrekendeIngred.push(ing.naam);
                }
            }

            var menuPrijs = input.menu_prijs || 38.50;
            var porties = recept.porties || 1;
            var kostPerPortie = totalCost / porties;
            var foodcostPct = (kostPerPortie / menuPrijs * 100);
            var margeEur = menuPrijs - kostPerPortie;
            var margePct = 100 - foodcostPct;

            return {
                recept: recept.naam,
                porties: porties,
                menu_prijs: menuPrijs,
                totale_foodcost: totalCost.toFixed(2),
                kostprijs_per_portie: kostPerPortie.toFixed(2),
                foodcost_percentage: foodcostPct.toFixed(1) + '%',
                marge_per_portie: margeEur.toFixed(2),
                marge_percentage: margePct.toFixed(1) + '%',
                doel_foodcost: '30% (= €' + (menuPrijs * 0.30).toFixed(2) + ')',
                status: foodcostPct <= 30 ? 'OK — binnen doel' : 'LET OP — foodcost te hoog!',
                breakdown: breakdown,
                ontbrekende_prijzen: ontbrekendeIngred,
            };
        }

        case 'generate_shopping_list': {
            var evQuery = supabase.from('events').select('*').neq('status', 'completed');
            if (input.event_id) evQuery = evQuery.eq('id', input.event_id);
            else if (input.event_naam) evQuery = evQuery.ilike('name', '%' + input.event_naam + '%');
            else evQuery = evQuery.gte('date', new Date().toISOString().split('T')[0]).order('date').limit(1);
            var { data: evData } = await evQuery.limit(1);
            var event = evData && evData[0];
            if (!event) return { error: 'Event niet gevonden' };

            var menuIds = event.menu || [];
            if (menuIds.length === 0) return { error: 'Geen recepten gekoppeld aan dit event', event: event.name };

            var { data: receptenData } = await supabase.from('recepten').select('*').in('id', menuIds);
            var gasten = event.guests || 1;

            // Aggregeer ingrediënten
            var totalen = {};
            for (var r of (receptenData || [])) {
                var multiplier = gasten / (r.porties || 1);
                for (var ing of (Array.isArray(r.ingredienten) ? r.ingredienten : [])) {
                    if (!ing.naam) continue;
                    var k = ing.naam.toLowerCase();
                    if (!totalen[k]) totalen[k] = { naam: ing.naam, totaal: 0, eenheid: ing.eenheid, recepten: [] };
                    totalen[k].totaal += (parseFloat(ing.hoeveelheid) || 0) * multiplier;
                    if (!totalen[k].recepten.includes(r.naam)) totalen[k].recepten.push(r.naam);
                }
            }

            // Zoek goedkoopste leverancier per item
            var inkooplijst = [];
            var totalInkoopCost = 0;
            for (var item of Object.values(totalen)) {
                var { data: px } = await supabase
                    .from('supplier_prices')
                    .select('supplier_name, product_name, price_per_unit, unit_type, article_number')
                    .ilike('product_name', '%' + item.naam + '%')
                    .order('price_per_unit')
                    .limit(3);

                var cheapest = px && px[0];
                var kostprijs = cheapest ? item.totaal * cheapest.price_per_unit : null;
                if (kostprijs) totalInkoopCost += kostprijs;

                inkooplijst.push({
                    product: item.naam,
                    benodigde_hoeveelheid: item.totaal.toFixed(1) + ' ' + item.eenheid,
                    voor_recepten: item.recepten,
                    goedkoopste_leverancier: cheapest ? cheapest.supplier_name : 'Niet gevonden',
                    artikelnummer: cheapest ? cheapest.article_number : null,
                    prijs: cheapest ? '€' + Number(cheapest.price_per_unit).toFixed(2) + ' per ' + cheapest.unit_type : null,
                    geschatte_kostprijs: kostprijs ? '€' + kostprijs.toFixed(2) : null,
                    alternatieven: px && px.slice(1).map(function (p) { return p.supplier_name + ' €' + Number(p.price_per_unit).toFixed(2); }),
                });
            }

            return {
                event: event.name,
                datum: event.date,
                gasten: event.guests,
                menu: (receptenData || []).map(function (r) { return r.naam; }),
                inkooplijst: inkooplijst,
                totaal_items: inkooplijst.length,
                geschatte_totale_inkoopkosten: '€' + totalInkoopCost.toFixed(2),
                geschatte_foodcost_per_persoon: '€' + (totalInkoopCost / gasten).toFixed(2),
            };
        }

        case 'suggest_vegan_alternatives': {
            var vegaKeywords = ['tofu', 'tempeh', 'seitan', 'jackfruit', 'portobello', 'halloumi', 'linzen', 'kikkererwten', 'courgette', 'aubergine', 'bloemkool', 'champignon', 'quinoa'];
            var orFilter = vegaKeywords.map(function (k) { return 'product_name.ilike.%' + k + '%'; }).join(',');
            var { data: vegaStock } = await supabase
                .from('supplier_prices')
                .select('product_name, supplier_name, price_per_unit, unit_type')
                .or(orFilter)
                .order('price_per_unit')
                .limit(20);

            var alternatieven = {};
            for (var ing of (input.ingredienten || [])) {
                var matches = (vegaStock || []).slice(0, 3);
                alternatieven[ing] = {
                    beschikbaar_in_db: matches.length,
                    opties: matches.map(function (v) {
                        return {
                            product: v.product_name,
                            leverancier: v.supplier_name,
                            prijs: '€' + Number(v.price_per_unit).toFixed(2) + ' per ' + v.unit_type,
                        };
                    }),
                };
            }

            return {
                vega_alternatieven: alternatieven,
                aantal_gasten: input.aantal_gasten || 'onbekend',
                tip: 'Jackfruit (langzaam gegaard) en portobello zijn uitstekende BBQ-alternatieven voor vlees op de Yoder.',
            };
        }

        case 'check_price_changes': {
            var drempel = (input.drempel_pct || 3) / 100;
            var changesQuery = supabase
                .from('supplier_prices')
                .select('supplier_name, product_name, price_per_unit, previous_price, unit_type, updated_at')
                .not('previous_price', 'is', null)
                .order('updated_at', { ascending: false })
                .limit(50);
            if (input.leverancier) changesQuery = changesQuery.eq('supplier_name', input.leverancier);
            var { data: allChanges } = await changesQuery;

            var significante = (allChanges || []).filter(function (p) {
                if (!p.previous_price || p.previous_price === 0) return false;
                return Math.abs((p.price_per_unit - p.previous_price) / p.previous_price) >= drempel;
            }).map(function (p) {
                var diff = (p.price_per_unit - p.previous_price) / p.previous_price;
                return {
                    product: p.product_name,
                    leverancier: p.supplier_name,
                    oude_prijs: '€' + Number(p.previous_price).toFixed(2),
                    nieuwe_prijs: '€' + Number(p.price_per_unit).toFixed(2),
                    wijziging: (diff > 0 ? '+' : '') + (diff * 100).toFixed(1) + '%',
                    stijging: diff > 0,
                    bijgewerkt: p.updated_at,
                };
            });

            var stijgingen = significante.filter(function (p) { return p.stijging; });
            var dalingen = significante.filter(function (p) { return !p.stijging; });

            return {
                wijzigingen: significante,
                samenvatting: significante.length + ' wijzigingen ≥' + (drempel * 100) + '% gevonden: ' + stijgingen.length + ' stijgingen, ' + dalingen.length + ' dalingen',
                stijgingen_count: stijgingen.length,
                dalingen_count: dalingen.length,
            };
        }

        default:
            return { error: 'Onbekende tool: ' + name };
    }
}

// ── SSE helper ────────────────────────────────────────────────────────────────
function makeSend(controller) {
    var encoder = new TextEncoder();
    return function send(data) {
        controller.enqueue(encoder.encode('data: ' + JSON.stringify(data) + '\n\n'));
    };
}

// ── Poe API fallback (geen tool-calling) ─────────────────────────────────────
async function callPoeApi(messages, send) {
    var lastUser = messages.filter(function (m) { return m.role === 'user'; }).pop();
    var prompt = lastUser ? lastUser.content : '';

    var res = await fetch('https://api.poe.com/bot/' + (process.env.POE_BOT_NAME || 'Claude-3.5-Sonnet'), {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + process.env.POE_API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: [{ role: 'user', content: prompt }] }),
    });

    if (!res.ok) throw new Error('Poe API fout: ' + res.status);
    var data = await res.json();
    var text = (data.text || data.reply || '').trim();

    // Chunk the text for streaming effect
    var chunkSize = 60;
    for (var i = 0; i < text.length; i += chunkSize) {
        send({ type: 'text', delta: text.slice(i, i + chunkSize) });
        await new Promise(function (r) { setTimeout(r, 18); });
    }
}

// ── Main API handler ──────────────────────────────────────────────────────────
export async function POST(request) {
    var body = await request.json();
    var messages = body.messages || [];
    var usePoe = !process.env.ANTHROPIC_API_KEY && process.env.POE_API_KEY;

    var stream = new ReadableStream({
        async start(controller) {
            var send = makeSend(controller);
            try {
                // Poe API mode (geen tools)
                if (usePoe) {
                    await callPoeApi(messages, send);
                    send({ type: 'done' });
                    controller.close();
                    return;
                }

                // Anthropic mode met tool-calling
                if (!process.env.ANTHROPIC_API_KEY) {
                    send({ type: 'error', message: 'Geen API-sleutel geconfigureerd. Voeg ANTHROPIC_API_KEY of POE_API_KEY toe aan .env.local' });
                    send({ type: 'done' });
                    controller.close();
                    return;
                }

                var Anthropic = (await import('@anthropic-ai/sdk')).default;
                var client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

                var currentMessages = messages.map(function (m) {
                    return { role: m.role, content: m.content };
                });

                var MAX_ITERATIONS = 6;
                var iteration = 0;

                while (iteration < MAX_ITERATIONS) {
                    iteration++;

                    var response = await client.messages.create({
                        model: 'claude-3-5-sonnet-20241022',
                        max_tokens: 4096,
                        system: SYSTEM_PROMPT,
                        tools: TOOLS,
                        messages: currentMessages,
                    });

                    if (response.stop_reason === 'end_turn') {
                        // Stream de tekst in chunks
                        var fullText = '';
                        for (var block of response.content) {
                            if (block.type === 'text') fullText += block.text;
                        }
                        var chunkSize = 60;
                        for (var ci = 0; ci < fullText.length; ci += chunkSize) {
                            send({ type: 'text', delta: fullText.slice(ci, ci + chunkSize) });
                            await new Promise(function (r) { setTimeout(r, 15); });
                        }
                        send({ type: 'done' });
                        break;
                    }

                    if (response.stop_reason === 'tool_use') {
                        currentMessages.push({ role: 'assistant', content: response.content });

                        var toolResults = [];
                        for (var block of response.content) {
                            if (block.type !== 'tool_use') continue;

                            send({ type: 'tool_start', tool: block.name, input: block.input });

                            var result = await executeTool(block.name, block.input);

                            send({ type: 'tool_done', tool: block.name });

                            toolResults.push({
                                type: 'tool_result',
                                tool_use_id: block.id,
                                content: JSON.stringify(result),
                            });
                        }

                        currentMessages.push({ role: 'user', content: toolResults });
                        continue;
                    }

                    // Unexpected stop reason
                    send({ type: 'done' });
                    break;
                }

            } catch (err) {
                console.error('[sous-chef]', err);
                send({ type: 'error', message: err.message || 'Onbekende fout' });
                send({ type: 'done' });
            }
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'X-Accel-Buffering': 'no',
        },
    });
}
