// Format number as Euro currency
export function fmt(n) {
    if (n == null || isNaN(n)) return '€ 0,00';
    return '€ ' + Number(n).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// HTML escape
export function escH(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ISO date to NL format
export function fmtNl(d) {
    if (!d) return '';
    var parts = d.split('-');
    if (parts.length !== 3) return d;
    return parts[2] + '-' + parts[1] + '-' + parts[0];
}

// Today as ISO string
export function today() {
    return new Date().toISOString().slice(0, 10);
}

// Add days to ISO date string
export function addDays(dateStr, days) {
    var d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

// Calculate line totals
export function calcLineTotals(items) {
    var subtotaal = 0;
    (items || []).forEach(function (item) {
        subtotaal += (item.qty || 0) * (item.prijs || 0);
    });
    var btwBedrag = 0;
    (items || []).forEach(function (item) {
        var lineTotal = (item.qty || 0) * (item.prijs || 0);
        btwBedrag += lineTotal * ((item.btw || 0) / 100);
    });
    return { subtotaal: subtotaal, btw: btwBedrag, totaal: subtotaal + btwBedrag };
}

// Month names in Dutch
export var MAANDEN = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
export var MAANDEN_KORT = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
export var DAGEN = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

// Generate invoice/quote number
export function genNummer(prefix, nr) {
    return prefix + String(nr).padStart(3, '0');
}

// Safe JSON parse — returns fallback (default []) on failure
export function safeJsonParse(str, fallback) {
    if (fallback === undefined) fallback = [];
    if (str == null) return fallback;
    if (typeof str !== 'string') return str;
    try { return JSON.parse(str); } catch (e) { return fallback; }
}

// ── Marge Calculation Engine (shared between dashboard and offertes) ─────────

function _getInvPrice(naam, inventory) {
    var item = (inventory || []).find(function (i) { return i.naam && i.naam.toLowerCase() === naam.toLowerCase(); });
    return item ? { price: item.purchase_price || 0, unit: item.unit || 'kg', yield_factor: item.yield_factor || 1.0 } : null;
}

export function calcDishCostPP(gerechtNaam, gerechten, inventory) {
    var gerecht = (gerechten || []).find(function (g) { return g.naam === gerechtNaam; });
    if (!gerecht || !gerecht.ingredient_costs) return 0;
    return (gerecht.ingredient_costs || []).reduce(function (sum, item) {
        var inv = _getInvPrice(item.naam, inventory);
        var price = inv ? inv.price : 0;
        var yld = item.yield || (inv ? inv.yield_factor : 1.0) || 1.0;
        var unitFactor = 1;
        if (item.unit === 'g' && inv && inv.unit === 'kg') unitFactor = 0.001;
        if (item.unit === 'ml' && inv && inv.unit === 'L') unitFactor = 0.001;
        return sum + ((item.qty_pp || 0) * unitFactor / yld) * price;
    }, 0);
}

export function calcMargeForOfferte(offerte, gerechten, inventory) {
    try {
        var gasten = offerte.aantal_gasten || (offerte.items && offerte.items[0] ? offerte.items[0].qty : 0) || 0;
        var prijsPP = offerte.basis_prijs_pp || 38.50;
        var omzet = gasten * prijsPP;
        var menuGerechten = offerte.menu_selectie || [];
        if (!Array.isArray(menuGerechten)) menuGerechten = [];
        var foodcostPP = menuGerechten.reduce(function (sum, sel) {
            return sum + (sel ? calcDishCostPP(sel.gerecht_naam || sel.naam || '', gerechten, inventory) : 0);
        }, 0);
        var foodcostTotaal = foodcostPP * gasten;
        var vk = Array.isArray(offerte.vaste_kosten) ? offerte.vaste_kosten : [];
        var vasteKosten = vk.reduce(function (s, k) { return s + (parseFloat(k.bedrag) || 0); }, 0);
        var nettoWinst = omzet - foodcostTotaal - vasteKosten;
        var margePct = omzet > 0 ? (nettoWinst / omzet) * 100 : 0;
        return { gasten: gasten, prijsPP: prijsPP, omzet: omzet, foodcostPP: foodcostPP, foodcostTotaal: foodcostTotaal, vasteKosten: vasteKosten, nettoWinst: nettoWinst, margePct: margePct };
    } catch (e) {
        console.error('[MARGE] calc error:', e);
        return { gasten: 0, prijsPP: 38.50, omzet: 0, foodcostPP: 0, foodcostTotaal: 0, vasteKosten: 0, nettoWinst: 0, margePct: 0 };
    }
}

export function margeColor(pct) { return pct > 70 ? 'green' : pct >= 60 ? 'orange' : 'red'; }
export function margeLabel(pct) { return pct > 70 ? 'Strong' : pct >= 60 ? 'Watchful' : 'Low Margin'; }
export function margeEmoji(pct) { return pct > 70 ? '🟢' : pct >= 60 ? '🟡' : '🔴'; }

// ── CSV Export ──────────────────────────────────────────────────────────────
export function exportCsv(bestandsnaam, rijen) {
    if (!rijen || rijen.length === 0) return;
    var kolommen = Object.keys(rijen[0]);
    var csv = [kolommen.join(';')]
        .concat(rijen.map(function (rij) {
            return kolommen.map(function (k) {
                var v = rij[k];
                if (v == null) return '';
                if (typeof v === 'object') v = JSON.stringify(v);
                return '"' + String(v).replace(/"/g, '""') + '"';
            }).join(';');
        }))
        .join('\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = bestandsnaam;
    a.click();
    URL.revokeObjectURL(url);
}
