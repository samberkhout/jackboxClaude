'use client';
import { useState } from 'react';
import { useSupabase, useSettings } from '@/lib/useSupabase';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { fmt, fmtNl, calcLineTotals, today, addDays, genNummer, calcMargeForOfferte, margeColor, margeLabel, margeEmoji, exportCsv } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { generatePDF } from '@/lib/pdfGenerator';
import MenuWizard from '@/components/MenuWizard';

export default function Offertes() {
    var { data: offertes, insert, update, remove } = useSupabase('offertes', []);
    var facturen = useSupabase('facturen', []);
    var { data: gerechtenData } = useSupabase('gerechten', []);
    var { data: inventoryData } = useSupabase('inventory', []);
    var { settings } = useSettings();
    var showToast = useToast();
    var showConfirm = useConfirm();
    var [editing, setEditing] = useState(null);
    var [form, setForm] = useState(null);
    var [showWizard, setShowWizard] = useState(false);
    var [showWizardForExisting, setShowWizardForExisting] = useState(false);
    var [vasteKostenInput, setVasteKostenInput] = useState({ naam: '', bedrag: '' });

    // ── Marge Calculation Engine — via gedeelde utils ──
    function calcOfferteMargeData(offerte) { return calcMargeForOfferte(offerte, gerechtenData, inventoryData); }

    function handleWizardComplete(result) {
        var geldigDagen = (settings && settings.offerte_geldig) || 30;
        var nummer = genNummer((settings && settings.offerte_prefix) || 'OFF-2026-', offertes.length + 1);
        setShowWizard(false);
        setEditing('new');
        setForm({
            nummer: nummer,
            status: 'definitief',
            client_naam: result.client_naam,
            client_adres: result.client_adres,
            datum: result.datum,
            geldig_tot: addDays(result.datum, geldigDagen),
            notitie: 'Signature Menu - ' + result.aantal_gasten + ' gasten',
            items: result.items,
            menu_selectie: result.menu_selectie,
            aantal_gasten: result.aantal_gasten,
            aantal_vega: result.aantal_vega,
            basis_prijs_pp: result.basis_prijs_pp,
            korting: result.korting
        });
        showToast('Menu samengesteld! Klik Opslaan om definitief te maken.', 'info');
    }

    function handleWizardUpdateExisting(result) {
        setShowWizardForExisting(false);
        setForm(Object.assign({}, form, {
            menu_selectie: result.menu_selectie,
            aantal_gasten: result.aantal_gasten,
            aantal_vega: result.aantal_vega,
            basis_prijs_pp: result.basis_prijs_pp,
            korting: result.korting,
            client_naam: result.client_naam,
            client_adres: result.client_adres,
            datum: result.datum,
            items: result.items
        }));
        showToast('🍽️ Menu bijgewerkt! Klik Opslaan om wijzigingen door te voeren.', 'info');
    }

    function newOfferte() {
        var geldigDagen = (settings && settings.offerte_geldig) || 30;
        var nummer = genNummer((settings && settings.offerte_prefix) || 'OFF-2026-', offertes.length + 1);
        setEditing('new');
        setForm({ nummer: nummer, status: 'concept', client_naam: '', client_adres: '', datum: today(), geldig_tot: addDays(today(), geldigDagen), notitie: '', items: [{ desc: '', qty: 1, prijs: 0, btw: (settings && settings.default_btw) || 21 }] });
    }

    function editOfferte(o) { setEditing(o.id); setForm(JSON.parse(JSON.stringify(o))); }
    function setField(key, val) { setForm(Object.assign({}, form, { [key]: val })); }

    // =====================================================
    // CENTRAL SYNC: syncQuoteToEvent — Robust Watcher v2
    // Called on EVERY offerte save/update. Upserts the event.
    // Always overwrites event data from offerte.
    // =====================================================
    function syncQuoteToEvent(quoteId, quoteData) {
        if (!quoteId) return;

        var qid = parseInt(quoteId, 10);
        if (isNaN(qid)) return;

        var newStatus = quoteData.status;

        var totalBedrag = 0;
        var estimatedGuests = 0;
        (quoteData.items || []).forEach(function (item) {
            totalBedrag += (item.qty || 0) * (item.prijs || 0);
            if ((item.qty || 0) > estimatedGuests) estimatedGuests = item.qty || 0;
        });
        var ppp = estimatedGuests > 0 ? totalBedrag / estimatedGuests : 45;

        var eventStatus;
        if (newStatus === 'geaccepteerd' || newStatus === 'akkoord' || newStatus === 'betaald') {
            eventStatus = 'confirmed';
        } else if (newStatus === 'afgewezen' || newStatus === 'verlopen') {
            eventStatus = '__DELETE__';
        } else {
            eventStatus = 'optie';
        }

        supabase.from('events').select('id, status, name').eq('offerte_id', qid)
            .then(function (res) {
                if (res.error) {
                    showToast('Sync fout: ' + res.error.message, 'error');
                    return;
                }

                var rows = res.data || [];

                // Clean up duplicates (defensive)
                if (rows.length > 1) {
                    for (var i = 1; i < rows.length; i++) {
                        supabase.from('events').delete().eq('id', rows[i].id)
                            .then(function () { })
                            .catch(function (e) { console.error('[SYNC] Duplicate cleanup error:', e.message); });
                    }
                }

                var existing = rows.length > 0 ? rows[0] : null;

                if (eventStatus === '__DELETE__') {
                    if (existing) {
                        supabase.from('events').delete().eq('offerte_id', qid)
                            .then(function (d) {
                                if (d.error) {
                                    console.error('[SYNC] Delete error:', d.error.message);
                                } else {
                                    showToast('🗑️ Optie verwijderd uit Agenda', 'info');
                                }
                            })
                            .catch(function (e) { console.error('[SYNC] Delete error:', e.message); });
                    }
                    return;
                }

                var payload = {
                    name: 'Offerte: ' + (quoteData.client_naam || quoteData.nummer || 'Onbekend'),
                    date: quoteData.datum || new Date().toISOString().slice(0, 10),
                    guests: estimatedGuests || 50,
                    ppp: Math.round(ppp * 100) / 100,
                    location: quoteData.client_adres || '',
                    client_naam: quoteData.client_naam || '',
                    client_adres: quoteData.client_adres || '',
                    status: eventStatus,
                    notitie: quoteData.notitie || ''
                };

                if (existing) {
                    supabase.from('events').update(payload).eq('id', existing.id).select()
                        .then(function (u) {
                            if (u.error) {
                                showToast('Sync fout bij update: ' + u.error.message, 'error');
                            } else {
                                var msg = eventStatus === 'confirmed'
                                    ? '✅ Agenda gesynchroniseerd — Event bevestigd!'
                                    : '📅 Agenda gesynchroniseerd met Offerte';
                                showToast(msg, 'success');
                            }
                        })
                        .catch(function (e) { console.error('[SYNC] Update error:', e.message); });
                } else {
                    payload.offerte_id = qid;
                    payload.type = 'Zakelijk';
                    payload.menu = [];
                    supabase.from('events').insert(payload).select()
                        .then(function (ins) {
                            if (ins.error) {
                                showToast('Sync fout bij insert: ' + ins.error.message, 'error');
                            } else {
                                showToast('📅 Agenda gesynchroniseerd — Optie toegevoegd!', 'success');
                            }
                        })
                        .catch(function (e) { console.error('[SYNC] Insert error:', e.message); });
                }
            })
            .catch(function (e) {
                console.error('[SYNC] Events ophalen error:', e.message);
                showToast('Sync fout: kon events niet ophalen', 'error');
            });
    }

    // =====================================================
    // SAVE — always triggers syncQuoteToEvent
    // =====================================================
    function saveOfferte() {
        if (!form.client_naam) { showToast('Vul een klantnaam in', 'error'); return; }

        if (editing === 'new') {
            insert(form).then(function (insertedRow) {
                showToast('Offerte aangemaakt', 'success');
                var newId = insertedRow && insertedRow.id ? insertedRow.id : null;
                if (newId) {
                    syncQuoteToEvent(newId, form);
                } else {
                    // Fallback — zoek op nummer als insert geen id teruggeeft
                    supabase.from('offertes').select('id').eq('nummer', form.nummer).order('id', { ascending: false }).limit(1)
                        .then(function (lookup) {
                            if (lookup.data && lookup.data.length > 0) {
                                syncQuoteToEvent(lookup.data[0].id, form);
                            } else {
                                console.error('[SAVE] Kon offerte ID niet ophalen — sync overgeslagen');
                            }
                        })
                        .catch(function (e) { console.error('[SAVE] Lookup error:', e.message); });
                }
                setEditing(null); setForm(null);
            }).catch(function (err) {
                showToast('Fout bij aanmaken: ' + (err.message || ''), 'error');
            });
        } else {
            var { id, created_at, ...rest } = form;
            update(editing, rest).then(function () {
                showToast('Offerte bijgewerkt', 'success');
                syncQuoteToEvent(editing, form);
                setEditing(null); setForm(null);
            }).catch(function (err) {
                showToast('Fout bij opslaan: ' + (err.message || ''), 'error');
            });
        }
    }

    function deleteOfferte() {
        showConfirm('Weet je zeker dat je deze offerte wilt verwijderen?', function () {
            supabase.from('events').delete().eq('offerte_id', editing)
                .then(function () { })
                .catch(function (e) { console.error('[DELETE] Event verwijderen mislukt:', e.message); });
            remove(editing)
                .then(function () { showToast('Offerte verwijderd', 'success'); setEditing(null); setForm(null); })
                .catch(function (e) { showToast('Verwijderen mislukt: ' + e.message, 'error'); });
        });
    }

    function convertToFactuur() {
        var betaaltermijn = (settings && settings.betaaltermijn) || 14;
        var factuurNum = genNummer((settings && settings.factuur_prefix) || 'F2026-', facturen.data.length + 1);
        var factuurData = {
            nummer: factuurNum,
            status: 'concept',
            client_naam: form.client_naam,
            client_adres: form.client_adres,
            datum: today(),
            vervaldatum: addDays(today(), betaaltermijn),
            items: form.items
        };
        facturen.insert(factuurData).then(function () {
            var { id, created_at, ...rest } = Object.assign({}, form, { status: 'geaccepteerd' });
            update(editing, rest)
                .then(function () {
                    showToast('Factuur aangemaakt vanuit offerte', 'success');
                    syncQuoteToEvent(editing, Object.assign({}, form, { status: 'geaccepteerd' }));
                    setEditing(null); setForm(null);
                })
                .catch(function (e) { showToast('Offerte bijwerken mislukt: ' + e.message, 'error'); });
        }).catch(function (e) { showToast('Factuur aanmaken mislukt: ' + e.message, 'error'); });
    }

    function addItem() { setField('items', (form.items || []).concat([{ desc: '', qty: 1, prijs: 0, btw: (settings && settings.default_btw) || 21 }])); }
    function updateItem(idx, key, val) {
        var items = form.items.map(function (item, i) { return i === idx ? Object.assign({}, item, { [key]: val }) : item; });
        setField('items', items);
    }
    function removeItem(idx) { setField('items', form.items.filter(function (_, i) { return i !== idx; })); }

    function downloadOfferte() {
        var totals = calcLineTotals(form.items);
        generatePDF({ type: 'offerte', form: form, settings: settings, totals: totals });
    }

    function emailOfferte() {
        var totals = calcLineTotals(form.items);
        var onderwerp = encodeURIComponent('Offerte ' + (form.nummer || '') + ' — ' + ((settings && settings.bedrijf_naam) || 'Hop & Bites'));
        var regels = (form.items || []).map(function(item) {
            return item.qty + 'x ' + item.desc + ' — €' + ((item.qty || 0) * (item.prijs || 0)).toFixed(2);
        }).join('\n');
        var body = encodeURIComponent(
            'Beste ' + (form.client_naam || '') + ',\n\n' +
            'Hierbij ontvangt u onze offerte ' + (form.nummer || '') + ' d.d. ' + (form.datum || '') + '.\n\n' +
            'Samenvatting:\n' + regels + '\n\n' +
            'Totaal excl. BTW: €' + totals.subtotaal.toFixed(2) + '\n' +
            'Totaal incl. BTW: €' + totals.totaal.toFixed(2) + '\n\n' +
            'Met vriendelijke groet,\n' + ((settings && settings.bedrijf_naam) || 'Hop & Bites')
        );
        var mailto = 'mailto:' + (form.client_email || '') + '?subject=' + onderwerp + '&body=' + body;
        window.open(mailto, '_blank');
    }

    // Editor
    if (editing !== null && form) {
        var totals = calcLineTotals(form.items);
        var pillMap = { concept: 'pill-blue', verzonden: 'pill-amber', geaccepteerd: 'pill-green', afgewezen: 'pill-red', verlopen: 'pill-red' };

        // Sync status indicator text
        var syncMsg = '📅 Opslaan synchroniseert automatisch met de Agenda';
        if (form.status === 'geaccepteerd' || form.status === 'akkoord' || form.status === 'betaald') syncMsg = '✅ Event bevestigd in Agenda — Groene glow actief';
        else if (form.status === 'afgewezen' || form.status === 'verlopen') syncMsg = '🗑️ Optie wordt verwijderd uit Agenda bij opslaan';

        return (
            <div className="panel">
                <div className="panel-head">
                    <h3>{editing === 'new' ? 'Nieuwe Offerte' : 'Offerte Bewerken'}</h3>
                    <button className="btn btn-ghost btn-sm" onClick={function () { setEditing(null); setForm(null); }}><i className="fa-solid fa-arrow-left"></i> Terug</button>
                </div>
                <div className="panel-body">
                    <div className="form-grid">
                        <div className="field"><label>Offertenummer</label><input value={form.nummer} onChange={function (e) { setField('nummer', e.target.value); }} /></div>
                        <div className="field"><label>Status</label>
                            <select value={form.status} onChange={function (e) { setField('status', e.target.value); }}>
                                {['concept', 'verzonden', 'geaccepteerd', 'akkoord', 'betaald', 'afgewezen', 'verlopen'].map(function (s) { return <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>; })}
                            </select>
                        </div>
                        <div className="field"><label>Klantnaam</label><input value={form.client_naam} onChange={function (e) { setField('client_naam', e.target.value); }} /></div>
                        <div className="field"><label>Klantadres</label><input value={form.client_adres} onChange={function (e) { setField('client_adres', e.target.value); }} /></div>
                        <div className="field"><label>Datum</label><input type="date" value={form.datum} onChange={function (e) { setField('datum', e.target.value); }} /></div>
                        <div className="field"><label>Geldig Tot</label><input type="date" value={form.geldig_tot} onChange={function (e) { setField('geldig_tot', e.target.value); }} /></div>
                        <div className="field full"><label>Notitie</label><textarea rows={2} value={form.notitie || ''} onChange={function (e) { setField('notitie', e.target.value); }} /></div>
                    </div>

                    {/* Sync indicator */}
                    <div style={{ margin: '16px 0 8px', padding: '10px 14px', background: 'rgba(255,191,0,.06)', border: '1px solid rgba(255,191,0,.12)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="fa-solid fa-link" style={{ color: 'var(--brand)', fontSize: 11 }}></i>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{syncMsg}</span>
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600 }}>Regels</h4>
                            <button className="btn btn-brand btn-sm" onClick={addItem}><i className="fa-solid fa-plus"></i> Regel</button>
                        </div>
                        <table className="tbl">
                            <thead><tr><th>Omschrijving</th><th style={{ width: 80 }}>Aantal</th><th style={{ width: 100 }}>Prijs</th><th style={{ width: 70 }}>BTW%</th><th style={{ width: 90 }}>Totaal</th><th style={{ width: 30 }}></th></tr></thead>
                            <tbody>
                                {(form.items || []).map(function (item, idx) {
                                    return <tr key={idx}>
                                        <td><input value={item.desc} onChange={function (e) { updateItem(idx, 'desc', e.target.value); }} /></td>
                                        <td><input type="number" value={item.qty} onChange={function (e) { updateItem(idx, 'qty', parseFloat(e.target.value) || 0); }} /></td>
                                        <td><input type="number" step="0.01" value={item.prijs} onChange={function (e) { updateItem(idx, 'prijs', parseFloat(e.target.value) || 0); }} /></td>
                                        <td><input type="number" value={item.btw} onChange={function (e) { updateItem(idx, 'btw', parseFloat(e.target.value) || 0); }} /></td>
                                        <td style={{ fontWeight: 600 }}>{fmt((item.qty || 0) * (item.prijs || 0))}</td>
                                        <td><button className="del-btn" onClick={function () { removeItem(idx); }}><i className="fa-solid fa-trash"></i></button></td>
                                    </tr>;
                                })}
                            </tbody>
                        </table>
                        <div style={{ textAlign: 'right', marginTop: 12, fontSize: 14 }}>
                            <div style={{ color: 'var(--muted)' }}>Subtotaal: {fmt(totals.subtotaal)}</div>
                            <div style={{ color: 'var(--muted)' }}>BTW: {fmt(totals.btw)}</div>
                            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--brand)' }}>Totaal: {fmt(totals.totaal)}</div>
                        </div>
                    </div>
                    <div className="editor-actions">
                        <button className="btn btn-brand" onClick={saveOfferte}><i className="fa-solid fa-save"></i> Opslaan</button>
                        <button className="btn" style={{ background: '#B48C14', color: '#000' }} onClick={function () { setShowWizardForExisting(true); }}><i className="fa-solid fa-utensils"></i> Menu Samenstellen</button>
                        <button className="btn btn-cyan" onClick={downloadOfferte}><i className="fa-solid fa-file-pdf"></i> PDF</button>
                        <button className="btn btn-ghost btn-sm" onClick={emailOfferte} title={form.client_email ? 'Email naar ' + form.client_email : 'Geen email adres ingevuld'}><i className="fa-solid fa-envelope"></i> Email</button>
                        {editing !== 'new' && form.status === 'geaccepteerd' && <button className="btn btn-green" onClick={convertToFactuur}><i className="fa-solid fa-file-invoice"></i> Naar Factuur</button>}
                        {editing !== 'new' && <button className="btn btn-red" onClick={deleteOfferte}><i className="fa-solid fa-trash"></i> Verwijderen</button>}
                    </div>

                    {/* ═══ VASTE KOSTEN ═══ */}
                    <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#B48C14', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
                            ⚙️ Vaste Kosten per Event
                        </div>
                        {(form.vaste_kosten || []).length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                                {(form.vaste_kosten || []).map(function (k, idx) {
                                    return (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(180,140,20,.04)', borderRadius: 8, border: '1px solid rgba(180,140,20,.1)' }}>
                                            <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{k.naam}</span>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand)' }}>€{(parseFloat(k.bedrag) || 0).toFixed(2)}</span>
                                            <button type="button" className="tag-remove" onClick={function () {
                                                var items = (form.vaste_kosten || []).slice();
                                                items.splice(idx, 1);
                                                setField('vaste_kosten', items);
                                            }}>×</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                            <div className="field" style={{ flex: 1 }}>
                                <label>Kostenpost</label>
                                <input value={vasteKostenInput.naam} onChange={function (e) { setVasteKostenInput(Object.assign({}, vasteKostenInput, { naam: e.target.value })); }}
                                    placeholder="bijv. Brandstof, Personeel" style={{ fontSize: 12, padding: '7px 10px' }} />
                            </div>
                            <div className="field" style={{ width: 100 }}>
                                <label>Bedrag €</label>
                                <input type="number" step="0.01" value={vasteKostenInput.bedrag}
                                    onChange={function (e) { setVasteKostenInput(Object.assign({}, vasteKostenInput, { bedrag: e.target.value })); }}
                                    placeholder="75" style={{ fontSize: 12, padding: '7px 10px' }} />
                            </div>
                            <button type="button" className="btn btn-brand btn-sm" style={{ height: 34 }} onClick={function () {
                                if (!vasteKostenInput.naam.trim()) return;
                                setField('vaste_kosten', (form.vaste_kosten || []).concat([{ naam: vasteKostenInput.naam.trim(), bedrag: parseFloat(vasteKostenInput.bedrag) || 0 }]));
                                setVasteKostenInput({ naam: '', bedrag: '' });
                            }}>+</button>
                        </div>
                    </div>

                    {/* ═══ PROFIT BREAKDOWN ═══ */}
                    {(function () {
                        var m = calcOfferteMargeData(form);
                        if (m.gasten === 0) return null;
                        var color = margeColor(m.margePct);
                        var barWidth = Math.min(100, Math.max(0, m.margePct));
                        return (
                            <div className="profit-breakdown">
                                <div className="profit-breakdown-head">
                                    <span style={{ fontWeight: 800, fontSize: 13 }}>📊 Profit Breakdown</span>
                                    <span className={'marge-badge marge-' + color}>{margeEmoji(m.margePct)} {m.margePct.toFixed(1)}% {margeLabel(m.margePct)}</span>
                                </div>
                                <div className="profit-breakdown-bar">
                                    <div className="profit-breakdown-fill" style={{ width: barWidth + '%', background: color === 'green' ? 'var(--green)' : color === 'orange' ? 'var(--amber)' : 'var(--red)' }}></div>
                                </div>
                                <div className="profit-breakdown-grid">
                                    <div className="profit-breakdown-cell">
                                        <div className="profit-breakdown-label">Omzet</div>
                                        <div className="profit-breakdown-value" style={{ color: 'var(--green)' }}>€{m.omzet.toFixed(2)}</div>
                                        <div className="profit-breakdown-sub">{m.gasten} gasten × €{m.prijsPP.toFixed(2)}</div>
                                    </div>
                                    <div className="profit-breakdown-cell">
                                        <div className="profit-breakdown-label">Foodcost</div>
                                        <div className="profit-breakdown-value" style={{ color: 'var(--red)' }}>-€{m.foodcostTotaal.toFixed(2)}</div>
                                        <div className="profit-breakdown-sub">€{m.foodcostPP.toFixed(2)} p.p.</div>
                                    </div>
                                    <div className="profit-breakdown-cell">
                                        <div className="profit-breakdown-label">Vaste Kosten</div>
                                        <div className="profit-breakdown-value" style={{ color: 'var(--amber)' }}>-€{m.vasteKosten.toFixed(2)}</div>
                                    </div>
                                    <div className="profit-breakdown-cell">
                                        <div className="profit-breakdown-label">Netto Winst</div>
                                        <div className="profit-breakdown-value" style={{ fontSize: 18, fontWeight: 900, color: m.nettoWinst >= 0 ? 'var(--green)' : 'var(--red)' }}>€{m.nettoWinst.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {showWizardForExisting && <MenuWizard onComplete={handleWizardUpdateExisting} onClose={function () { setShowWizardForExisting(false); }} settings={settings} existingOfferte={form} />}
                </div>
            </div>
        );
    }

    // List
    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Offertes ({offertes.length})</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={function () {
                        exportCsv('offertes.csv', offertes.map(function(o) {
                            return { nummer: o.nummer, klant: o.client_naam, datum: o.datum, status: o.status, gasten: o.aantal_gasten, prijs_pp: o.basis_prijs_pp };
                        }));
                    }}><i className="fa-solid fa-file-csv"></i> CSV</button>
                    <button className="btn btn-brand" onClick={function () { setShowWizard(true); }} style={{ background: '#B48C14' }}><i className="fa-solid fa-utensils"></i> Stel Menu Samen</button>
                    <button className="btn btn-brand" onClick={newOfferte}><i className="fa-solid fa-plus"></i> Nieuwe Offerte</button>
                </div>
            </div>
            {showWizard && <MenuWizard onComplete={handleWizardComplete} onClose={function () { setShowWizard(false); }} settings={settings} />}
            <div className="panel">
                {offertes.length === 0 && <div className="empty-state"><i className="fa-solid fa-file-signature"></i><p>Nog geen offertes aangemaakt</p></div>}
                {offertes.map(function (o) {
                    var total = 0;
                    (o.items || []).forEach(function (item) { total += (item.qty || 0) * (item.prijs || 0); });
                    var pillMap = { concept: 'pill-blue', verzonden: 'pill-amber', geaccepteerd: 'pill-green', akkoord: 'pill-green', betaald: 'pill-green', afgewezen: 'pill-red', verlopen: 'pill-red' };
                    var m = calcOfferteMargeData(o);
                    var hasMenu = (o.menu_selectie || []).length > 0;
                    return (
                        <div key={o.id} className="ev-row" onClick={function () { editOfferte(o); }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>{o.nummer}
                                    {hasMenu && m.gasten > 0 && <span className={'marge-badge marge-badge-sm marge-' + margeColor(m.margePct)}>{margeEmoji(m.margePct)} {m.margePct.toFixed(0)}%</span>}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{o.client_naam} — {fmtNl(o.datum)}</div>
                                {o.notitie && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{o.notitie}</div>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600 }}>{fmt(total)}</div>
                                <span className={'pill ' + (pillMap[o.status] || 'pill-blue')}>{o.status}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
