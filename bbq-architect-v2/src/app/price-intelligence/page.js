'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

var SUPPLIERS = ['Sligro', 'Hanos', 'Bidfood'];
var SUPPLIER_COLORS = { Sligro: '#3b82f6', Hanos: '#22c55e', Bidfood: '#f59e0b' };

export default function PriceIntelligence() {
    var [prices, setPrices] = useState([]);
    var [loading, setLoading] = useState(true);
    var [search, setSearch] = useState('');
    var [supplierFilter, setSupplierFilter] = useState('Alle');
    var [importing, setImporting] = useState(false);
    var [selectedSupplier, setSelectedSupplier] = useState('Sligro');
    var [dragOver, setDragOver] = useState(false);
    var [importResult, setImportResult] = useState(null);
    var [sortBy, setSortBy] = useState('name'); // 'name' | 'price' | 'change'
    var [view, setView] = useState('vergelijk'); // 'vergelijk' | 'alle'
    var [pushStatus, setPushStatus] = useState('unknown'); // 'unknown'|'granted'|'denied'|'loading'
    var fileRef = useRef();
    var showToast = useToast();

    // Controleer huidige notificatie-status
    useEffect(function () {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPushStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'default');
        }
    }, []);

    async function enablePushNotifications() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            showToast('Push notificaties worden niet ondersteund door deze browser', 'error');
            return;
        }
        setPushStatus('loading');
        try {
            var permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setPushStatus('denied');
                showToast('Notificaties geweigerd — wijzig dit in je browserinstellingen', 'error');
                return;
            }
            var reg = await navigator.serviceWorker.ready;
            var vapidKey = window.__VAPID_PUBLIC_KEY__;
            if (!vapidKey) {
                showToast('VAPID_PUBLIC_KEY niet geconfigureerd — zie .env.local', 'error');
                setPushStatus('default');
                return;
            }
            var sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub.toJSON(), userAgent: navigator.userAgent }),
            });
            setPushStatus('granted');
            showToast('Notificaties ingeschakeld voor prijswijzigingen > 5%', 'success');
        } catch (err) {
            setPushStatus('default');
            showToast('Fout: ' + err.message, 'error');
        }
    }

    function urlBase64ToUint8Array(base64String) {
        var padding = '='.repeat((4 - base64String.length % 4) % 4);
        var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        var rawData = window.atob(base64);
        var outputArray = new Uint8Array(rawData.length);
        for (var i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
        return outputArray;
    }

    function fetchPrices() {
        if (!supabase) { setLoading(false); return; }
        setLoading(true);
        supabase.from('supplier_prices').select('*').order('product_name').then(function (res) {
            if (res.data) setPrices(res.data);
            setLoading(false);
        });
    }

    useEffect(function () { fetchPrices(); }, []);

    // ---- Stats ----
    var uniqueProducts = [...new Set(prices.map(function (p) { return p.product_name.toLowerCase(); }))].length;
    var activeSuppliers = [...new Set(prices.map(function (p) { return p.supplier_name; }))].length;
    var priceRises = prices.filter(function (p) { return p.previous_price !== null && p.price_per_unit > p.previous_price; }).length;
    var priceFalls = prices.filter(function (p) { return p.previous_price !== null && p.price_per_unit < p.previous_price; }).length;
    var lastImport = prices.length > 0
        ? prices.reduce(function (a, b) { return a.updated_at > b.updated_at ? a : b; }).updated_at
        : null;

    // ---- Filtering & Grouping ----
    var filtered = prices.filter(function (p) {
        var matchSearch = !search || p.product_name.toLowerCase().includes(search.toLowerCase()) || p.article_number.toLowerCase().includes(search.toLowerCase());
        var matchSupplier = supplierFilter === 'Alle' || p.supplier_name === supplierFilter;
        return matchSearch && matchSupplier;
    });

    // Groepeer per productnaam (case-insensitive)
    var grouped = {};
    filtered.forEach(function (p) {
        var key = p.product_name.toLowerCase();
        if (!grouped[key]) grouped[key] = { name: p.product_name, items: [] };
        grouped[key].items.push(p);
    });

    var groupedList = Object.values(grouped).sort(function (a, b) {
        if (sortBy === 'price') {
            var aMin = Math.min.apply(null, a.items.map(function (i) { return i.price_per_unit; }));
            var bMin = Math.min.apply(null, b.items.map(function (i) { return i.price_per_unit; }));
            return aMin - bMin;
        }
        if (sortBy === 'change') {
            var aHasChange = a.items.some(function (i) { return i.previous_price !== null && i.price_per_unit !== i.previous_price; }) ? 1 : 0;
            var bHasChange = b.items.some(function (i) { return i.previous_price !== null && i.price_per_unit !== i.previous_price; }) ? 1 : 0;
            return bHasChange - aHasChange;
        }
        return a.name.localeCompare(b.name);
    });

    // Alleen producten bij meerdere leveranciers (vergelijkingsmodus)
    var compareList = groupedList.filter(function (g) { return g.items.length > 1; });
    var displayList = view === 'vergelijk' ? compareList : groupedList;

    // Prijsalerts: stijgingen > 5%
    var prijsAlerts = prices
        .filter(function (p) {
            return p.previous_price !== null && p.previous_price > 0 &&
                (p.price_per_unit - p.previous_price) / p.previous_price > 0.05;
        })
        .sort(function (a, b) {
            var diffA = (a.price_per_unit - a.previous_price) / a.previous_price;
            var diffB = (b.price_per_unit - b.previous_price) / b.previous_price;
            return diffB - diffA;
        });

    // Recent gewijzigde prijzen
    var recentChanges = prices
        .filter(function (p) { return p.previous_price !== null && p.price_per_unit !== p.previous_price; })
        .sort(function (a, b) { return b.updated_at.localeCompare(a.updated_at); })
        .slice(0, 10);

    // ---- Import ----
    async function handleImport(file) {
        if (!file) return;
        setImporting(true);
        setImportResult(null);
        var formData = new FormData();
        formData.append('file', file);
        formData.append('supplier', selectedSupplier);
        try {
            var res = await fetch('/api/price-import', { method: 'POST', body: formData });
            var data = await res.json();
            if (data.success) {
                showToast(data.count + ' producten geïmporteerd van ' + selectedSupplier, 'success');
                setImportResult({ success: true, count: data.count, supplier: data.supplier });
                fetchPrices();
            } else {
                showToast(data.error || 'Import mislukt', 'error');
                setImportResult({ error: data.error, detected: data.detected, missing: data.missing });
            }
        } catch (e) {
            showToast('Import mislukt: ' + e.message, 'error');
            setImportResult({ error: e.message });
        }
        setImporting(false);
    }

    function onFileChange(e) { if (e.target.files[0]) handleImport(e.target.files[0]); }
    function onDrop(e) { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleImport(e.dataTransfer.files[0]); }

    function priceChangeTag(p) {
        if (p.previous_price === null || p.previous_price === p.price_per_unit) return null;
        var diff = ((p.price_per_unit - p.previous_price) / p.previous_price * 100);
        var up = p.price_per_unit > p.previous_price;
        return (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: up ? 'rgba(239,68,68,.15)' : 'rgba(34,197,94,.15)', color: up ? 'var(--red)' : 'var(--green)' }}>
                {up ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}%
            </span>
        );
    }

    function formatDate(iso) {
        if (!iso) return '—';
        var d = new Date(iso);
        return d.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return (
        <div>
            {/* ---- Stats grid ---- */}
            <div className="pi-stats">
                <div className="pi-stat">
                    <div className="pi-stat-val">{uniqueProducts}</div>
                    <div className="pi-stat-label"><i className="fa-solid fa-tag"></i> Unieke producten</div>
                </div>
                <div className="pi-stat">
                    <div className="pi-stat-val">{activeSuppliers}</div>
                    <div className="pi-stat-label"><i className="fa-solid fa-truck"></i> Actieve leveranciers</div>
                </div>
                <div className="pi-stat pi-stat-red">
                    <div className="pi-stat-val">{priceRises}</div>
                    <div className="pi-stat-label"><i className="fa-solid fa-arrow-trend-up"></i> Prijsstijgingen</div>
                </div>
                <div className="pi-stat pi-stat-green">
                    <div className="pi-stat-val">{priceFalls}</div>
                    <div className="pi-stat-label"><i className="fa-solid fa-arrow-trend-down"></i> Prijsdalingen</div>
                </div>
            </div>

            {/* ---- Notificaties banner ---- */}
            {pushStatus !== 'granted' && pushStatus !== 'denied' && (
                <div style={{ marginBottom: 16, padding: '12px 18px', background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.3)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--purple)' }}>
                            <i className="fa-solid fa-bell" style={{ marginRight: 6 }}></i>
                            Prijswijzigingen op je Xiaomi ontvangen?
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                            Schakel meldingen in — je krijgt een notificatie bij &gt;5% prijsverandering op actieve ingrediënten.
                        </div>
                    </div>
                    <button
                        className="btn btn-brand btn-sm"
                        onClick={enablePushNotifications}
                        disabled={pushStatus === 'loading'}
                        style={{ flexShrink: 0 }}
                    >
                        {pushStatus === 'loading'
                            ? <><i className="fa-solid fa-spinner fa-spin"></i> Bezig...</>
                            : <><i className="fa-solid fa-bell"></i> Inschakelen</>}
                    </button>
                </div>
            )}
            {pushStatus === 'granted' && (
                <div style={{ marginBottom: 16, padding: '10px 18px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fa-solid fa-bell" style={{ color: 'var(--green)' }}></i>
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>Notificaties actief</span>
                    <span style={{ color: 'var(--muted)' }}>— je ontvangt meldingen bij prijswijzigingen &gt;5% op je actieve ingrediënten.</span>
                </div>
            )}
            {pushStatus === 'denied' && (
                <div style={{ marginBottom: 16, padding: '10px 18px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 12, fontSize: 12, color: 'var(--muted)' }}>
                    <i className="fa-solid fa-bell-slash" style={{ color: 'var(--red)', marginRight: 6 }}></i>
                    Notificaties geblokkeerd. Sta ze toe via <b>Browserinstellingen → Sitemachtigingen → Meldingen</b>.
                </div>
            )}

            {/* ---- Prijsalerts: stijgingen > 5% ---- */}
            {prijsAlerts.length > 0 && (
                <div style={{ marginBottom: 20, borderRadius: 12, border: '1px solid rgba(239,68,68,.35)', background: 'rgba(239,68,68,.06)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: '1px solid rgba(239,68,68,.2)', background: 'rgba(239,68,68,.1)' }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--red)', fontSize: 16 }}></i>
                        <span style={{ fontWeight: 700, color: 'var(--red)', fontSize: 14 }}>
                            {prijsAlerts.length} prijsstijging{prijsAlerts.length !== 1 ? 'en' : ''} &gt;5% gedetecteerd
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>— controleer je inkoop</span>
                    </div>
                    <div style={{ padding: '8px 0' }}>
                        {prijsAlerts.map(function (p) {
                            var pct = ((p.price_per_unit - p.previous_price) / p.previous_price * 100);
                            return (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid rgba(239,68,68,.1)' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,.15)', color: 'var(--red)', fontSize: 13, flexShrink: 0 }}>
                                        <i className="fa-solid fa-arrow-trend-up"></i>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ fontWeight: 600, fontSize: 13 }}>{p.product_name}</span>
                                        <span style={{ marginLeft: 8, padding: '1px 7px', borderRadius: 10, background: (SUPPLIER_COLORS[p.supplier_name] || '#666') + '22', color: SUPPLIER_COLORS[p.supplier_name] || 'var(--muted)', fontWeight: 600, fontSize: 10 }}>{p.supplier_name}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>
                                        <span style={{ textDecoration: 'line-through' }}>€{Number(p.previous_price).toFixed(2)}</span>
                                        <i className="fa-solid fa-arrow-right" style={{ margin: '0 6px', fontSize: 9 }}></i>
                                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>€{Number(p.price_per_unit).toFixed(2)}</span>
                                    </div>
                                    <div style={{ flexShrink: 0, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,.15)', color: 'var(--red)', fontWeight: 800, fontSize: 12 }}>
                                        ▲ {pct.toFixed(1)}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ---- Hoofdgrid: Import + Recente wijzigingen ---- */}
            <div className="pi-top-row">
                {/* Import panel */}
                <div className="panel pi-import-panel">
                    <div className="panel-head">
                        <h3><i className="fa-solid fa-file-arrow-up"></i> CSV Importeren</h3>
                        {lastImport && <span style={{ fontSize: 11, color: 'var(--muted)' }}>Laatste import: {formatDate(lastImport)}</span>}
                    </div>
                    <div className="panel-body">
                        <div className="field" style={{ marginBottom: 12 }}>
                            <label>Leverancier</label>
                            <select value={selectedSupplier} onChange={function (e) { setSelectedSupplier(e.target.value); setImportResult(null); }}>
                                {SUPPLIERS.map(function (s) { return <option key={s}>{s}</option>; })}
                            </select>
                        </div>

                        <div
                            className={'pi-drop' + (dragOver ? ' pi-drop-over' : '')}
                            onDragOver={function (e) { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={function () { setDragOver(false); }}
                            onDrop={onDrop}
                            onClick={function () { fileRef.current.click(); }}
                        >
                            <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 30, color: 'var(--brand)', marginBottom: 8 }}></i>
                            <p style={{ fontWeight: 600, marginBottom: 4 }}>Sleep CSV hier naartoe</p>
                            <p style={{ color: 'var(--muted)', fontSize: 12 }}>of klik om te bladeren</p>
                            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={onFileChange} />
                        </div>

                        {importing && (
                            <div style={{ textAlign: 'center', marginTop: 12, color: 'var(--brand)', fontSize: 13 }}>
                                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Importeren...
                            </div>
                        )}

                        {importResult && importResult.success && (
                            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(34,197,94,.1)', border: '1px solid var(--green)', borderRadius: 8, fontSize: 13 }}>
                                <i className="fa-solid fa-check" style={{ color: 'var(--green)', marginRight: 6 }}></i>
                                <b>{importResult.count}</b> producten van <b>{importResult.supplier}</b> geïmporteerd
                            </div>
                        )}

                        {importResult && importResult.error && (
                            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid var(--red)', borderRadius: 8, fontSize: 12 }}>
                                <div style={{ color: 'var(--red)', fontWeight: 700, marginBottom: 4 }}>
                                    <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }}></i>{importResult.error}
                                </div>
                                {importResult.detected && (
                                    <div style={{ color: 'var(--muted)', marginTop: 6 }}>
                                        <b>Gevonden kolommen:</b> {importResult.detected.join(', ')}
                                    </div>
                                )}
                                {importResult.missing && (
                                    <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                                        <b>Ontbreekt:</b> {Object.entries(importResult.missing).filter(function (e) { return e[1]; }).map(function (e) { return e[0]; }).join(', ')}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--brand-light)', borderRadius: 8, fontSize: 12 }}>
                            <div style={{ color: 'var(--brand)', fontWeight: 700, marginBottom: 6 }}>Verwachte kolomnamen in CSV:</div>
                            <div style={{ color: 'var(--muted)', lineHeight: 2 }}>
                                <span style={{ marginRight: 8 }}>📦 Artikelnummer / ItemCode / SKU</span><br />
                                <span style={{ marginRight: 8 }}>📝 Omschrijving / Description / Naam</span><br />
                                <span style={{ marginRight: 8 }}>💶 Prijs / Verkoopprijs / Price</span><br />
                                <span>📐 Eenheid / UOM (optioneel)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recente prijswijzigingen */}
                <div className="panel" style={{ flex: 1, minWidth: 0 }}>
                    <div className="panel-head">
                        <h3><i className="fa-solid fa-bolt"></i> Recente Prijswijzigingen</h3>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{recentChanges.length} wijzigingen</span>
                    </div>
                    <div className="panel-body" style={{ padding: 0 }}>
                        {recentChanges.length === 0 ? (
                            <div className="empty-state" style={{ padding: 40 }}>
                                <i className="fa-solid fa-chart-line"></i>
                                <p>Nog geen prijswijzigingen</p>
                                <p style={{ fontSize: 12, color: 'var(--muted)' }}>Importeer meerdere keren om wijzigingen te zien</p>
                            </div>
                        ) : (
                            <div>
                                {recentChanges.map(function (p) {
                                    var up = p.price_per_unit > p.previous_price;
                                    var diff = ((p.price_per_unit - p.previous_price) / p.previous_price * 100);
                                    return (
                                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: up ? 'rgba(239,68,68,.15)' : 'rgba(34,197,94,.15)', color: up ? 'var(--red)' : 'var(--green)', fontSize: 14, flexShrink: 0 }}>
                                                <i className={'fa-solid ' + (up ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down')}></i>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                                    <span style={{ padding: '1px 7px', borderRadius: 10, background: (SUPPLIER_COLORS[p.supplier_name] || '#666') + '22', color: SUPPLIER_COLORS[p.supplier_name] || 'var(--muted)', fontWeight: 600, fontSize: 10 }}>{p.supplier_name}</span>
                                                    <span style={{ marginLeft: 6 }}>{formatDate(p.updated_at)}</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700 }}>€{Number(p.price_per_unit).toFixed(2)}</div>
                                                <div style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'line-through' }}>€{Number(p.previous_price).toFixed(2)}</div>
                                            </div>
                                            <div style={{ flexShrink: 0 }}>{priceChangeTag(p)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ---- Prijsvergelijking tabel ---- */}
            <div className="panel" style={{ marginTop: 20 }}>
                <div className="panel-head" style={{ flexWrap: 'wrap', gap: 10 }}>
                    <h3><i className="fa-solid fa-magnifying-glass-dollar"></i> Prijsvergelijking</h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
                        <button className={'btn btn-sm ' + (view === 'vergelijk' ? 'btn-brand' : 'btn-ghost')} onClick={function () { setView('vergelijk'); }}>
                            <i className="fa-solid fa-scale-balanced"></i> Vergelijken
                        </button>
                        <button className={'btn btn-sm ' + (view === 'alle' ? 'btn-brand' : 'btn-ghost')} onClick={function () { setView('alle'); }}>
                            <i className="fa-solid fa-list"></i> Alles
                        </button>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{displayList.length} producten</span>
                    </div>
                </div>
                <div className="panel-body">
                    {/* Zoek + filters */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                        <input
                            style={{ flex: 1, minWidth: 200, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 12px', borderRadius: 8, font: '400 13px DM Sans,sans-serif' }}
                            placeholder="Zoek product of artikelnummer..."
                            value={search}
                            onChange={function (e) { setSearch(e.target.value); }}
                        />
                        {['Alle'].concat(SUPPLIERS).map(function (s) {
                            return (
                                <button key={s} className={'btn btn-sm ' + (supplierFilter === s ? 'btn-brand' : 'btn-ghost')} onClick={function () { setSupplierFilter(s); }}>
                                    {s !== 'Alle' && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: SUPPLIER_COLORS[s], marginRight: 5 }}></span>}
                                    {s}
                                </button>
                            );
                        })}
                        <select
                            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 10px', borderRadius: 8, font: '400 13px DM Sans,sans-serif' }}
                            value={sortBy}
                            onChange={function (e) { setSortBy(e.target.value); }}
                        >
                            <option value="name">Sorteren: Naam</option>
                            <option value="price">Sorteren: Prijs</option>
                            <option value="change">Sorteren: Wijzigingen eerst</option>
                        </select>
                    </div>

                    {loading && (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24 }}></i>
                            <div style={{ marginTop: 12 }}>Laden...</div>
                        </div>
                    )}

                    {!loading && displayList.length === 0 && (
                        <div className="empty-state">
                            <i className="fa-solid fa-chart-bar"></i>
                            <p>{view === 'vergelijk' ? 'Geen producten bij meerdere leveranciers' : 'Nog geen prijsdata'}</p>
                            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                                {view === 'vergelijk' ? 'Importeer CSV van meerdere leveranciers om te vergelijken' : 'Importeer een CSV om te beginnen'}
                            </p>
                        </div>
                    )}

                    {!loading && displayList.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Product</th>
                                        <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Leverancier</th>
                                        <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Artikelnr.</th>
                                        <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Prijs/eenheid</th>
                                        <th style={{ textAlign: 'center', padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Eenheid</th>
                                        <th style={{ textAlign: 'center', padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Wijziging</th>
                                        <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Bijgewerkt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayList.map(function (group) {
                                        var sorted = group.items.slice().sort(function (a, b) { return a.price_per_unit - b.price_per_unit; });
                                        var cheapest = sorted[0];
                                        var maxPrice = sorted[sorted.length - 1].price_per_unit;
                                        var saving = group.items.length > 1 ? maxPrice - cheapest.price_per_unit : 0;

                                        return sorted.map(function (p, idx) {
                                            var isCheapest = p.id === cheapest.id && group.items.length > 1;
                                            return (
                                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: idx === 0 && group.items.length > 1 ? 'rgba(34,197,94,.03)' : 'transparent', transition: 'background .15s' }}>
                                                    {idx === 0 && (
                                                        <td rowSpan={sorted.length} style={{ padding: '12px 14px', fontWeight: 600, verticalAlign: 'top', borderRight: '1px solid var(--border)' }}>
                                                            <div>{group.name}</div>
                                                            {saving > 0 && (
                                                                <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: 'rgba(34,197,94,.12)', color: 'var(--green)', fontSize: 11, fontWeight: 700 }}>
                                                                    <i className="fa-solid fa-piggy-bank"></i>
                                                                    Bespaar €{saving.toFixed(2)}
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td style={{ padding: '12px 14px' }}>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: (SUPPLIER_COLORS[p.supplier_name] || '#666') + '22', color: SUPPLIER_COLORS[p.supplier_name] || 'var(--muted)' }}>
                                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: SUPPLIER_COLORS[p.supplier_name] || '#666', display: 'inline-block' }}></span>
                                                            {p.supplier_name}
                                                        </span>
                                                        {isCheapest && (
                                                            <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>★ goedkoopst</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: 12, fontFamily: 'monospace' }}>{p.article_number}</td>
                                                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: isCheapest ? 'var(--green)' : 'var(--text)' }}>
                                                        €{Number(p.price_per_unit).toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>{p.unit_type}</td>
                                                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                        {priceChangeTag(p) || <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
                                                        {formatDate(p.updated_at)}
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
