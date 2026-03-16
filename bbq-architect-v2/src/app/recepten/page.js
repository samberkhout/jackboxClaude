'use client';
import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/useSupabase';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

export default function Recepten() {
    var { data: recepten, insert, update, remove } = useSupabase('recepten', []);
    var { data: inventory } = useSupabase('inventory', []);
    var showToast = useToast();
    var showConfirm = useConfirm();
    var [editing, setEditing] = useState(null); // null | 'new' | id
    var [form, setForm] = useState(null);
    var [filter, setFilter] = useState('Alles');
    var [supplierPrices, setSupplierPrices] = useState([]);

    var categories = ['Alles', 'Vlees', 'Vis', 'Bijgerecht', 'Saus', 'Dessert', 'Drank'];

    // Laad leverancierssprijzen eenmalig
    useEffect(function () {
        if (!supabase) return;
        supabase.from('supplier_prices').select('*').then(function (res) {
            if (res.data) setSupplierPrices(res.data);
        }).catch(function (e) { console.warn('[recepten] Leverancierssprijzen laden mislukt:', e.message); });
    }, []);

    function newRecept() {
        setEditing('new');
        setForm({ naam: '', categorie: 'Vlees', porties: 4, preptime: 30, ingredienten: [], instructies: '', notitie: '' });
    }

    function editRecept(r) {
        setEditing(r.id);
        setForm(JSON.parse(JSON.stringify(r)));
    }

    function saveRecept() {
        if (!form.naam) { showToast('Vul een naam in', 'error'); return; }
        if (editing === 'new') {
            insert(form).then(function () { showToast('Recept aangemaakt', 'success'); setEditing(null); setForm(null); }).catch(function (e) { showToast('Opslaan mislukt: ' + e.message, 'error'); });
        } else {
            var { id, created_at, ...rest } = form;
            update(editing, rest).then(function () { showToast('Recept bijgewerkt', 'success'); setEditing(null); setForm(null); }).catch(function (e) { showToast('Bijwerken mislukt: ' + e.message, 'error'); });
        }
    }

    function deleteRecept() {
        showConfirm('Weet je zeker dat je dit recept wilt verwijderen?', function () {
            remove(editing).then(function () { showToast('Recept verwijderd', 'success'); setEditing(null); setForm(null); }).catch(function (e) { showToast('Verwijderen mislukt: ' + e.message, 'error'); });
        });
    }

    function setField(key, val) { setForm(Object.assign({}, form, { [key]: val })); }

    function addIngredient() {
        var ing = (form.ingredienten || []).concat([{ naam: '', hoeveelheid: '', eenheid: 'gram' }]);
        setField('ingredienten', ing);
    }

    function updateIngredient(idx, key, val) {
        var ing = form.ingredienten.map(function (item, i) { return i === idx ? Object.assign({}, item, { [key]: val }) : item; });
        setField('ingredienten', ing);
    }

    function removeIngredient(idx) {
        setField('ingredienten', form.ingredienten.filter(function (_, i) { return i !== idx; }));
    }

    // Zoek leveranciersmatch voor een ingrediëntnaam
    function getSupplierMatches(naam) {
        if (!naam || naam.length < 3) return [];
        var lower = naam.toLowerCase();
        return supplierPrices.filter(function (p) {
            return p.product_name.toLowerCase().includes(lower);
        });
    }

    // Goedkoopste match per leverancier
    function getCheapestMatch(naam) {
        var matches = getSupplierMatches(naam);
        if (matches.length === 0) return null;
        return matches.reduce(function (a, b) { return a.price_per_unit <= b.price_per_unit ? a : b; });
    }

    // Editor view
    if (editing !== null && form) {
        var recipeSupplierCost = calcRecipeCostFromSupplier(form);

        return (
            <>
                <div className="panel">
                    <div className="panel-head">
                        <h3>{editing === 'new' ? 'Nieuw Recept' : 'Recept Bewerken'}</h3>
                        <button className="btn btn-ghost btn-sm" onClick={function () { setEditing(null); setForm(null); }}>
                            <i className="fa-solid fa-arrow-left"></i> Terug
                        </button>
                    </div>
                    <div className="panel-body">
                        <div className="form-grid">
                            <div className="field full">
                                <label>Naam</label>
                                <input value={form.naam} onChange={function (e) { setField('naam', e.target.value); }} />
                            </div>
                            <div className="field">
                                <label>Categorie</label>
                                <select value={form.categorie} onChange={function (e) { setField('categorie', e.target.value); }}>
                                    {['Vlees', 'Vis', 'Bijgerecht', 'Saus', 'Dessert', 'Drank'].map(function (c) {
                                        return <option key={c} value={c}>{c}</option>;
                                    })}
                                </select>
                            </div>
                            <div className="field">
                                <label>Porties</label>
                                <input type="number" value={form.porties} onChange={function (e) { setField('porties', parseInt(e.target.value) || 0); }} />
                            </div>
                            <div className="field">
                                <label>Preptime (min)</label>
                                <input type="number" value={form.preptime} onChange={function (e) { setField('preptime', parseInt(e.target.value) || 0); }} />
                            </div>
                        </div>

                        {/* Ingrediënten */}
                        <div style={{ marginTop: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 600 }}>Ingrediënten</h4>
                                <button className="btn btn-brand btn-sm" onClick={addIngredient}>
                                    <i className="fa-solid fa-plus"></i> Toevoegen
                                </button>
                            </div>
                            {(form.ingredienten || []).map(function (ing, idx) {
                                var matches = getSupplierMatches(ing.naam);
                                var cheapest = matches.length > 0 ? matches.reduce(function (a, b) { return a.price_per_unit <= b.price_per_unit ? a : b; }) : null;
                                return (
                                    <div key={idx} style={{ marginBottom: 12 }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <input style={{ flex: 2, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 10px', borderRadius: 8, font: '400 13px DM Sans,sans-serif' }}
                                                placeholder="Ingredient" value={ing.naam} onChange={function (e) { updateIngredient(idx, 'naam', e.target.value); }} />
                                            <input style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 10px', borderRadius: 8, font: '400 13px DM Sans,sans-serif' }}
                                                placeholder="Hoeveelheid" value={ing.hoeveelheid} onChange={function (e) { updateIngredient(idx, 'hoeveelheid', e.target.value); }} />
                                            <select style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 10px', borderRadius: 8, font: '400 13px DM Sans,sans-serif' }}
                                                value={ing.eenheid} onChange={function (e) { updateIngredient(idx, 'eenheid', e.target.value); }}>
                                                {['gram', 'kg', 'ml', 'liter', 'stuks', 'el', 'tl'].map(function (u) { return <option key={u}>{u}</option>; })}
                                            </select>
                                            <button className="del-btn" onClick={function () { removeIngredient(idx); }}>
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>

                                        {/* Prijsvergelijking inline */}
                                        {matches.length > 0 && (
                                            <div style={{ marginTop: 6, marginLeft: 4, padding: '8px 12px', background: 'rgba(255,191,0,.07)', border: '1px solid rgba(255,191,0,.15)', borderRadius: 8 }}>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 700, marginRight: 4 }}>
                                                        <i className="fa-solid fa-tags"></i> Leveranciers:
                                                    </span>
                                                    {matches.slice(0, 6).map(function (m) {
                                                        var isCheap = m.id === cheapest.id;
                                                        return (
                                                            <span key={m.id} style={{ display: 'inline-flex', gap: 4, alignItems: 'center', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: isCheap ? 'rgba(34,197,94,.15)' : 'var(--bg)', border: isCheap ? '1px solid var(--green)' : '1px solid var(--border)', color: isCheap ? 'var(--green)' : 'var(--muted)' }}>
                                                                {isCheap && <i className="fa-solid fa-star" style={{ fontSize: 9 }}></i>}
                                                                {m.supplier_name} — €{Number(m.price_per_unit).toFixed(2)}/{m.unit_type}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                                <div style={{ marginTop: 5, fontSize: 11, color: 'var(--green)' }}>
                                                    <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }}></i>
                                                    Goedkoopste: <b>{cheapest.supplier_name}</b> — €{Number(cheapest.price_per_unit).toFixed(2)} per {cheapest.unit_type}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Totale kostprijs op basis van leveranciersprijs */}
                        {recipeSupplierCost > 0 && (
                            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.3)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, color: 'var(--purple)', fontWeight: 600 }}>
                                    <i className="fa-solid fa-calculator" style={{ marginRight: 6 }}></i>
                                    Kostprijs (goedkoopste leveranciers)
                                </span>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand)' }}>€{recipeSupplierCost.toFixed(2)}</span>
                                    <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>totaal</span>
                                    {form.porties > 0 && (
                                        <div style={{ fontSize: 12, color: 'var(--purple)' }}>€{(recipeSupplierCost / form.porties).toFixed(2)} / portie</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="form-grid" style={{ marginTop: 20 }}>
                            <div className="field full">
                                <label>Instructies</label>
                                <textarea rows={4} value={form.instructies} onChange={function (e) { setField('instructies', e.target.value); }} />
                            </div>
                            <div className="field full">
                                <label>Notitie</label>
                                <textarea rows={2} value={form.notitie} onChange={function (e) { setField('notitie', e.target.value); }} />
                            </div>
                        </div>

                        <div className="editor-actions">
                            <button className="btn btn-brand" onClick={saveRecept}>
                                <i className="fa-solid fa-save"></i> Opslaan
                            </button>
                            {editing !== 'new' && (
                                <button className="btn btn-red" onClick={deleteRecept}>
                                    <i className="fa-solid fa-trash"></i> Verwijderen
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Bereken kostprijs vanuit voorraad
    function calcRecipeCost(recipe) {
        var total = 0;
        (recipe.ingredienten || []).forEach(function (ing) {
            var match = inventory.find(function (inv) { return ing.naam && inv.naam && inv.naam.toLowerCase().indexOf(ing.naam.toLowerCase()) >= 0; });
            if (match) {
                var qty = parseFloat(ing.hoeveelheid) || 0;
                var unitFactor = 1;
                if (ing.eenheid === 'gram' && match.unit === 'kg') unitFactor = 0.001;
                if (ing.eenheid === 'ml' && match.unit === 'L') unitFactor = 0.001;
                total += qty * unitFactor * (match.purchase_price || 0);
            }
        });
        return total;
    }

    // Bereken kostprijs vanuit leveranciersprijs (goedkoopste per ingrediënt)
    function calcRecipeCostFromSupplier(recipe) {
        var total = 0;
        (recipe.ingredienten || []).forEach(function (ing) {
            var matches = getSupplierMatches(ing.naam);
            if (matches.length === 0) return;
            var cheapest = matches.reduce(function (a, b) { return a.price_per_unit <= b.price_per_unit ? a : b; });
            var qty = parseFloat(ing.hoeveelheid) || 0;
            var unitFactor = 1;
            if (ing.eenheid === 'gram' && cheapest.unit_type === 'kg') unitFactor = 0.001;
            if (ing.eenheid === 'ml' && cheapest.unit_type === 'liter') unitFactor = 0.001;
            total += qty * unitFactor * (cheapest.price_per_unit || 0);
        });
        return total;
    }

    // List view
    var filtered = filter === 'Alles' ? recepten : recepten.filter(function (r) { return r.categorie === filter; });

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {categories.map(function (c) {
                        return <button key={c} className={'btn btn-sm ' + (filter === c ? 'btn-brand' : 'btn-ghost')} onClick={function () { setFilter(c); }}>{c}</button>;
                    })}
                </div>
                <button className="btn btn-brand" onClick={newRecept}>
                    <i className="fa-solid fa-plus"></i> Nieuw Recept
                </button>
            </div>

            {filtered.length === 0 && (
                <div className="empty-state">
                    <i className="fa-solid fa-utensils"></i>
                    <p>Geen recepten gevonden</p>
                    <button className="btn btn-brand btn-sm" onClick={newRecept}>Voeg je eerste recept toe</button>
                </div>
            )}

            <div className="grid-3">
                {filtered.map(function (r) {
                    var invCost = calcRecipeCost(r);
                    var supplierCost = calcRecipeCostFromSupplier(r);
                    return (
                        <div key={r.id} className="rec-card" onClick={function () { editRecept(r); }}>
                            <div className="rec-cat">{r.categorie}</div>
                            <div className="rec-name">{r.naam}</div>
                            <div className="rec-meta">
                                <span><i className="fa-solid fa-users"></i> {r.porties} porties</span>
                                <span><i className="fa-solid fa-clock"></i> {r.preptime} min</span>
                                <span><i className="fa-solid fa-list"></i> {(r.ingredienten || []).length} ingr.</span>
                            </div>
                            {(invCost > 0 || supplierCost > 0) && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                                    {invCost > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                            <span style={{ fontSize: 11, color: 'var(--purple)' }}><i className="fa-solid fa-coins" style={{ marginRight: 4 }}></i> Voorraad</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>€{(invCost / (r.porties || 1)).toFixed(2)} /portie</span>
                                        </div>
                                    )}
                                    {supplierCost > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 11, color: 'var(--green)' }}><i className="fa-solid fa-truck" style={{ marginRight: 4 }}></i> Goedkoopste</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>€{(supplierCost / (r.porties || 1)).toFixed(2)} /portie</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
