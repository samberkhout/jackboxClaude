import { createClient } from '@supabase/supabase-js';

var supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Detecteer het CSV-scheidingsteken
function detectSeparator(firstLine) {
    var counts = { ';': 0, ',': 0, '\t': 0, '|': 0 };
    for (var ch of firstLine) { if (counts[ch] !== undefined) counts[ch]++; }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// Splits een CSV-regel rekening houdend met aanhalingstekens
function splitLine(line, sep) {
    var result = [];
    var current = '';
    var inQuote = false;
    var quoteChar = '';
    for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (!inQuote && (ch === '"' || ch === "'")) { inQuote = true; quoteChar = ch; }
        else if (inQuote && ch === quoteChar) { inQuote = false; }
        else if (!inQuote && ch === sep) { result.push(current.trim()); current = ''; }
        else { current += ch; }
    }
    result.push(current.trim());
    return result;
}

function parseCSV(text) {
    var lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n').filter(function(l) { return l.trim(); });
    if (lines.length < 2) return { rows: [], headers: [] };
    var sep = detectSeparator(lines[0]);
    var headers = splitLine(lines[0], sep).map(function(h) { return h.replace(/^["']|["']$/g, '').toLowerCase().trim(); });
    var rows = lines.slice(1).map(function(line) {
        var vals = splitLine(line, sep);
        var row = {};
        headers.forEach(function(h, i) { row[h] = (vals[i] || '').replace(/^["']|["']$/g, '').trim(); });
        return row;
    });
    return { rows, headers };
}

// Kolomnamen per leverancier + generieke sleutelwoorden
var ARTICLE_KEYS = ['artikelnummer', 'art.nr', 'artnr', 'art nr', 'itemcode', 'item code', 'item_code', 'code', 'sku', 'bestelnummer', 'ordernummer', 'productnummer'];
var NAME_KEYS = ['omschrijving', 'artikel', 'artikelomschrijving', 'description', 'naam', 'productnaam', 'product naam', 'product_name', 'name', 'item description', 'item_description'];
var PRICE_KEYS = ['prijs', 'verkoopprijs', 'inkoop', 'inkoopprijs', 'netto prijs', 'nettoprijs', 'price', 'eenheidsprijs', 'netto', 'bedrag', 'unit price', 'unit_price', 'your price'];
var UNIT_KEYS = ['eenheid', 'verpakkingseenheid', 'verpakking', 'uom', 'unit', 'per', 'inhoud', 'quantity unit', 'quantityunit'];

function findCol(headers, keys) {
    return headers.find(function(h) { return keys.some(function(k) { return h === k || h.includes(k); }); }) || null;
}

function parsePrice(str) {
    return parseFloat((str || '').replace(/[€$\s]/g, '').replace(',', '.')) || 0;
}

export async function POST(request) {
    try {
        var formData = await request.formData();
        var file = formData.get('file');
        var supplier = formData.get('supplier');

        if (!file || !supplier) {
            return Response.json({ error: 'Bestand en leverancier zijn verplicht' }, { status: 400 });
        }

        var text = await file.text();
        var { rows, headers } = parseCSV(text);

        if (rows.length === 0) {
            return Response.json({ error: 'Geen data gevonden in CSV' }, { status: 400 });
        }

        var articleCol = findCol(headers, ARTICLE_KEYS);
        var nameCol = findCol(headers, NAME_KEYS);
        var priceCol = findCol(headers, PRICE_KEYS);
        var unitCol = findCol(headers, UNIT_KEYS);

        if (!articleCol || !nameCol || !priceCol) {
            return Response.json({
                error: 'Kolommen niet herkend. Verwacht: artikelnummer, omschrijving/naam, prijs/verkoopprijs',
                detected: headers,
                missing: {
                    artikelnummer: !articleCol,
                    naam: !nameCol,
                    prijs: !priceCol,
                }
            }, { status: 400 });
        }

        var upserts = rows
            .filter(function(r) { return r[articleCol] && r[nameCol] && parsePrice(r[priceCol]) > 0; })
            .map(function(r) {
                return {
                    supplier_name: supplier,
                    article_number: r[articleCol],
                    product_name: r[nameCol],
                    price_per_unit: parsePrice(r[priceCol]),
                    unit_type: unitCol ? (r[unitCol] || 'stuks') : 'stuks',
                    updated_at: new Date().toISOString(),
                };
            });

        if (upserts.length === 0) {
            return Response.json({ error: 'Geen geldige rijen gevonden (prijs moet > 0 zijn)' }, { status: 400 });
        }

        // Batch upsert per 500 rijen
        var totalInserted = 0;
        for (var i = 0; i < upserts.length; i += 500) {
            var chunk = upserts.slice(i, i + 500);
            var { error } = await supabase
                .from('supplier_prices')
                .upsert(chunk, { onConflict: 'supplier_name,article_number', ignoreDuplicates: false });
            if (error) throw error;
            totalInserted += chunk.length;
        }

        return Response.json({ success: true, count: totalInserted, supplier });
    } catch (err) {
        console.error('[price-import]', err);
        return Response.json({ error: err.message || 'Import mislukt' }, { status: 500 });
    }
}
