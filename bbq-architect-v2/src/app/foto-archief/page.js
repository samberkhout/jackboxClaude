'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';

// ── Lokale CLIP classifier (Transformers.js) ───────────────────────────────
// Model wordt eenmalig geladen en gecached in de browser (IndexedDB)
var classifierRef = null;
var classifierLoading = false;
var classifierCallbacks = [];

async function getClassifier(onProgress) {
    if (classifierRef) return classifierRef;

    if (classifierLoading) {
        return new Promise(function(resolve) { classifierCallbacks.push(resolve); });
    }

    classifierLoading = true;
    try {
        var { pipeline, env } = await import('@huggingface/transformers');
        // Gebruik WASM backend zodat het in browser werkt zonder GPU
        env.allowLocalModels = false;

        var clf = await pipeline(
            'zero-shot-image-classification',
            'Xenova/clip-vit-base-patch32',
            {
                progress_callback: onProgress || null,
            }
        );
        classifierRef = clf;
        classifierCallbacks.forEach(function(cb) { cb(clf); });
        classifierCallbacks = [];
        return clf;
    } finally {
        classifierLoading = false;
    }
}

async function classifeerLokaal(file, categorieNamen, onProgress) {
    try {
        var clf = await getClassifier(onProgress);
        // Maak tijdelijke object-URL voor het model
        var url = URL.createObjectURL(file);
        // Vertaal NL categorienamen naar Engelse hints voor CLIP
        var labelMap = {
            'Food':  'BBQ food grilled meat dish plate',
            'Gear':  'BBQ smoker equipment grill setup',
            'Sfeer': 'people event crowd party atmosphere',
            'Admin': 'document paper office invoice',
        };
        var labels = categorieNamen.map(function(naam) {
            return labelMap[naam] || naam;
        });
        var result = await clf(url, labels);
        URL.revokeObjectURL(url);
        // result is gesorteerd op score (hoog → laag)
        var bestIdx = 0; // index in labels array = index in categorieNamen
        var bestLabel = result[0].label;
        var idx = labels.indexOf(bestLabel);
        return categorieNamen[idx >= 0 ? idx : 0];
    } catch(e) {
        console.warn('[CLIP] Lokale classificatie mislukt:', e.message);
        return null; // valt terug op Claude Vision in de API
    }
}

var DEFAULT_CATEGORIES = ['Food', 'Gear', 'Sfeer', 'Admin'];
var STORAGE_KEY = 'fa_custom_categories';

var DEFAULT_ICONS = {
    Food:  'fa-drumstick-bite',
    Gear:  'fa-fire-burner',
    Sfeer: 'fa-people-group',
    Admin: 'fa-folder-open',
};
var DEFAULT_COLORS = {
    Food:  '#FF6B35',
    Gear:  '#FFBF00',
    Sfeer: '#4ECDC4',
    Admin: '#95A5A6',
};

var PALETTE = ['#FF6B35','#FFBF00','#4ECDC4','#95A5A6','#E74C3C','#3498DB','#9B59B6','#2ECC71','#E67E22','#1ABC9C'];
var ICON_OPTIES = [
    'fa-tag','fa-star','fa-heart','fa-camera','fa-utensils','fa-truck','fa-music',
    'fa-glass-cheers','fa-wine-glass','fa-cake-candles','fa-clipboard','fa-box',
];

function loadCustomCategories() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
}
function saveCustomCategories(cats) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
}

export default function FotoArchief() {
    var [customCategories, setCustomCategories] = useState([]);
    var [activeCategory, setActiveCategory] = useState('Alles');
    var [fotos, setFotos] = useState([]);
    var [loading, setLoading] = useState(true);
    var [batchProgress, setBatchProgress] = useState(null); // null | { total, done, errors, msg, phase }
    var [modelStatus, setModelStatus] = useState('idle'); // idle | loading | ready | error
    var [lightbox, setLightbox] = useState(null);
    var [dragOver, setDragOver] = useState(false);
    var [autoEdit, setAutoEdit] = useState(true);
    var [showCatModal, setShowCatModal] = useState(false);
    var [newCatNaam, setNewCatNaam] = useState('');
    var [newCatKleur, setNewCatKleur] = useState('#3498DB');
    var [newCatIcon, setNewCatIcon] = useState('fa-tag');
    var fileInputRef = useRef(null);

    // Laad custom categorieën uit localStorage
    useEffect(function() {
        setCustomCategories(loadCustomCategories());
    }, []);

    // Alle categorieën (vaste + custom)
    var alleCategorieen = DEFAULT_CATEGORIES.concat(customCategories.map(function(c) { return c.naam; }));
    var alleTabs = ['Alles'].concat(alleCategorieen);

    function getCatIcon(cat) {
        if (DEFAULT_ICONS[cat]) return DEFAULT_ICONS[cat];
        var c = customCategories.find(function(x) { return x.naam === cat; });
        return c ? c.icon : 'fa-tag';
    }
    function getCatKleur(cat) {
        if (DEFAULT_COLORS[cat]) return DEFAULT_COLORS[cat];
        var c = customCategories.find(function(x) { return x.naam === cat; });
        return c ? c.kleur : '#95A5A6';
    }

    var laadFotos = useCallback(function() {
        setLoading(true);
        var url = '/api/photo/upload?limit=200' + (activeCategory !== 'Alles' ? '&category=' + encodeURIComponent(activeCategory) : '');
        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) { setFotos(data.fotos || []); })
            .catch(function(e) { console.error(e); })
            .finally(function() { setLoading(false); });
    }, [activeCategory]);

    useEffect(function() { laadFotos(); }, [laadFotos]);

    // ── Upload één foto ────────────────────────────────────────────────────
    async function uploadEenFoto(file, allCatNames) {
        // 1. Lokale CLIP classificatie
        var predictedCategory = null;
        try {
            setModelStatus('loading');
            predictedCategory = await classifeerLokaal(
                file,
                allCatNames,
                function(info) {
                    // info.status = 'downloading' | 'progress' | 'done'
                    if (info.status === 'ready') setModelStatus('ready');
                }
            );
            setModelStatus('ready');
        } catch(e) {
            setModelStatus('error');
        }

        // 2. Stuur naar API (met lokaal voorspelde categorie indien beschikbaar)
        var form = new FormData();
        form.append('photo', file);
        form.append('auto_edit', autoEdit ? 'true' : 'false');
        if (allCatNames && allCatNames.length) {
            form.append('categories', allCatNames.join(','));
        }
        if (predictedCategory) {
            form.append('predicted_category', predictedCategory);
        }
        var res = await fetch('/api/photo/upload', { method: 'POST', body: form });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload mislukt');
        return data;
    }

    // ── Batch upload meerdere bestanden ────────────────────────────────────
    async function batchUpload(files) {
        var allCatNames = alleCategorieen;
        var total = files.length;
        var errors = 0;

        setBatchProgress({ total, done: 0, errors: 0, msg: 'Starten...', phase: 'uploading' });

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            setBatchProgress({ total, done: i, errors, msg: 'Uploaden ' + (i + 1) + ' van ' + total + ': ' + file.name, phase: 'uploading' });
            try {
                if (!file.type.startsWith('image/')) {
                    errors++;
                    continue;
                }
                await uploadEenFoto(file, allCatNames);
            } catch(e) {
                console.warn('Upload fout:', file.name, e);
                errors++;
            }
        }

        var phase = errors === total ? 'error' : 'done';
        var msg = errors === 0
            ? total + ' foto' + (total === 1 ? '' : "'s") + ' succesvol geüpload!'
            : (total - errors) + ' van ' + total + ' geüpload. ' + errors + ' mislukt.';

        setBatchProgress({ total, done: total - errors, errors, msg, phase });
        laadFotos();
        setTimeout(function() { setBatchProgress(null); }, 4000);
    }

    // ── ZIP extractie ──────────────────────────────────────────────────────
    async function verwerkZip(zipFile) {
        setBatchProgress({ total: 0, done: 0, errors: 0, msg: 'ZIP uitpakken...', phase: 'uploading' });
        try {
            var zip = await JSZip.loadAsync(zipFile);
            var imageExtensions = /\.(jpe?g|png|webp|heic)$/i;
            var entries = [];
            zip.forEach(function(relativePath, entry) {
                if (!entry.dir && imageExtensions.test(relativePath)) {
                    entries.push({ path: relativePath, entry });
                }
            });

            if (entries.length === 0) {
                setBatchProgress({ total: 0, done: 0, errors: 0, msg: 'Geen afbeeldingen gevonden in ZIP.', phase: 'error' });
                setTimeout(function() { setBatchProgress(null); }, 3000);
                return;
            }

            // Converteer ZIP entries naar File objecten
            var files = [];
            for (var i = 0; i < entries.length; i++) {
                var { path, entry } = entries[i];
                var blob = await entry.async('blob');
                var ext = path.split('.').pop().toLowerCase();
                var mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                    : ext === 'png' ? 'image/png'
                    : ext === 'webp' ? 'image/webp'
                    : 'image/heic';
                var naam = path.split('/').pop();
                var file = new File([blob], naam, { type: mime });
                files.push(file);
            }

            await batchUpload(files);
        } catch(e) {
            setBatchProgress({ total: 0, done: 0, errors: 0, msg: 'ZIP kon niet worden geopend: ' + e.message, phase: 'error' });
            setTimeout(function() { setBatchProgress(null); }, 3000);
        }
    }

    // ── File input handler ─────────────────────────────────────────────────
    async function handleFileChange(e) {
        var files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Check of er een ZIP bij zit
        var zipFiles = files.filter(function(f) { return f.name.toLowerCase().endsWith('.zip'); });
        var imageFiles = files.filter(function(f) { return f.type.startsWith('image/'); });

        if (zipFiles.length > 0) {
            // Verwerk ZIP(s) één voor één
            for (var zf of zipFiles) {
                await verwerkZip(zf);
            }
            // Plus losse afbeeldingen als die ook geselecteerd waren
            if (imageFiles.length > 0) await batchUpload(imageFiles);
        } else {
            await batchUpload(imageFiles);
        }
    }

    // ── Drag & drop ────────────────────────────────────────────────────────
    async function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        var files = Array.from(e.dataTransfer.files || []);
        if (files.length === 0) return;

        var zipFiles = files.filter(function(f) { return f.name.toLowerCase().endsWith('.zip'); });
        var imageFiles = files.filter(function(f) { return f.type.startsWith('image/'); });

        if (zipFiles.length > 0) {
            for (var zf of zipFiles) await verwerkZip(zf);
            if (imageFiles.length > 0) await batchUpload(imageFiles);
        } else {
            await batchUpload(imageFiles);
        }
    }

    // ── Foto verwijderen ───────────────────────────────────────────────────
    async function verwijderFoto(id, e) {
        e.stopPropagation();
        if (!confirm('Foto definitief verwijderen?')) return;
        await fetch('/api/photo/upload?id=' + id, { method: 'DELETE' });
        if (lightbox && lightbox.foto.id === id) setLightbox(null);
        laadFotos();
    }

    // ── Categorie beheer ───────────────────────────────────────────────────
    function voegCatToe() {
        var naam = newCatNaam.trim();
        if (!naam || alleTabs.includes(naam)) return;
        var updated = customCategories.concat([{ naam, kleur: newCatKleur, icon: newCatIcon }]);
        setCustomCategories(updated);
        saveCustomCategories(updated);
        setNewCatNaam('');
        setNewCatKleur('#3498DB');
        setNewCatIcon('fa-tag');
    }

    function verwijderCat(naam) {
        if (!confirm('Categorie "' + naam + '" verwijderen?')) return;
        var updated = customCategories.filter(function(c) { return c.naam !== naam; });
        setCustomCategories(updated);
        saveCustomCategories(updated);
        if (activeCategory === naam) setActiveCategory('Alles');
    }

    // ── Lightbox keyboard ──────────────────────────────────────────────────
    useEffect(function() {
        function onKey(e) {
            if (!lightbox) return;
            if (e.key === 'Escape') setLightbox(null);
            if (e.key === 'ArrowRight') {
                var idx = fotos.findIndex(function(f) { return f.id === lightbox.foto.id; });
                if (idx < fotos.length - 1) setLightbox({ foto: fotos[idx + 1], showEdited: lightbox.showEdited });
            }
            if (e.key === 'ArrowLeft') {
                var idx2 = fotos.findIndex(function(f) { return f.id === lightbox.foto.id; });
                if (idx2 > 0) setLightbox({ foto: fotos[idx2 - 1], showEdited: lightbox.showEdited });
            }
        }
        window.addEventListener('keydown', onKey);
        return function() { window.removeEventListener('keydown', onKey); };
    }, [lightbox, fotos]);

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="fa-page">
            {/* Header */}
            <div className="fa-header">
                <div className="fa-header-left">
                    <h1><i className="fa-solid fa-images"></i> Foto Archief</h1>
                    <p className="fa-subtitle">AI-powered bewerking &amp; automatische categorisatie</p>
                </div>
                <div className="fa-header-right">
                    <label className="fa-upload-btn" title="Foto's of ZIP uploaden">
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        <span>Uploaden</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic,.zip,application/zip"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </label>
                    <button
                        className="fa-upload-btn fa-upload-btn--secondary"
                        title="Categorieën beheren"
                        onClick={function() { setShowCatModal(true); }}
                    >
                        <i className="fa-solid fa-tags"></i>
                        <span>Categorieën</span>
                    </button>
                    <label className="fa-toggle-label" title="Automatisch bewerken met Cloudinary AI">
                        <input
                            type="checkbox"
                            checked={autoEdit}
                            onChange={function(e) { setAutoEdit(e.target.checked); }}
                        />
                        <span>Auto-edit</span>
                    </label>
                    {modelStatus === 'loading' && (
                        <span className="fa-model-status fa-model-status--loading">
                            <span className="fa-spinner"></span> AI-model laden...
                        </span>
                    )}
                    {modelStatus === 'ready' && (
                        <span className="fa-model-status fa-model-status--ready">
                            <i className="fa-solid fa-microchip"></i> Lokaal
                        </span>
                    )}
                </div>
            </div>

            {/* Upload progress banner */}
            {batchProgress && (
                <div className={'fa-upload-banner fa-upload-banner--' + batchProgress.phase}>
                    {batchProgress.phase === 'done' && <i className="fa-solid fa-circle-check"></i>}
                    {batchProgress.phase === 'error' && <i className="fa-solid fa-circle-exclamation"></i>}
                    {batchProgress.phase === 'uploading' && <span className="fa-spinner"></span>}
                    <span>{batchProgress.msg}</span>
                    {batchProgress.phase === 'uploading' && batchProgress.total > 1 && (
                        <div className="fa-progress-bar">
                            <div
                                className="fa-progress-fill"
                                style={{ width: Math.round((batchProgress.done / batchProgress.total) * 100) + '%' }}
                            ></div>
                        </div>
                    )}
                </div>
            )}

            {/* Drag-and-drop zone */}
            <div
                className={'fa-drop-zone' + (dragOver ? ' fa-drop-zone--over' : '')}
                onDragOver={function(e) { e.preventDefault(); setDragOver(true); }}
                onDragLeave={function() { setDragOver(false); }}
                onDrop={handleDrop}
            >
                <i className="fa-solid fa-cloud-arrow-up"></i>
                <span>Sleep foto's of een ZIP-bestand hierheen · of selecteer via de knop</span>
            </div>

            {/* Categorie tabs */}
            <div className="fa-tabs">
                {alleTabs.map(function(cat) {
                    var isActief = activeCategory === cat;
                    var kleur = cat === 'Alles' ? null : getCatKleur(cat);
                    return (
                        <button
                            key={cat}
                            className={'fa-tab' + (isActief ? ' fa-tab--active' : '')}
                            style={isActief && cat !== 'Alles' ? { borderColor: kleur, color: kleur } : {}}
                            onClick={function() { setActiveCategory(cat); }}
                        >
                            <i className={'fa-solid ' + (cat === 'Alles' ? 'fa-images' : getCatIcon(cat))}></i>
                            <span>{cat}</span>
                            {cat === 'Alles' && !loading && (
                                <span className="fa-tab-count">{fotos.length}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="fa-loading">
                    <span className="fa-spinner fa-spinner--lg"></span>
                    <span>Foto's laden...</span>
                </div>
            ) : fotos.length === 0 ? (
                <div className="fa-empty">
                    <i className={'fa-solid ' + (activeCategory === 'Alles' ? 'fa-images' : getCatIcon(activeCategory))}></i>
                    <p>Nog geen foto's in {activeCategory === 'Alles' ? 'het archief' : 'de map ' + activeCategory}</p>
                    <label className="fa-upload-btn fa-upload-btn--ghost">
                        <i className="fa-solid fa-plus"></i> Eerste foto uploaden
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic,.zip,application/zip"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </label>
                </div>
            ) : (
                <div className="fa-grid">
                    {fotos.map(function(foto) {
                        var kleur = getCatKleur(foto.category) || '#95A5A6';
                        return (
                            <div
                                key={foto.id}
                                className="fa-card"
                                onClick={function() { setLightbox({ foto: foto, showEdited: true }); }}
                            >
                                <div className="fa-card-img-wrap">
                                    <img
                                        src={foto.edited_url || foto.original_url}
                                        alt={foto.ai_description || foto.category}
                                        className="fa-card-img"
                                        loading="lazy"
                                    />
                                    <span className="fa-cat-badge" style={{ background: kleur }}>
                                        <i className={'fa-solid ' + getCatIcon(foto.category)}></i>
                                        {foto.category}
                                    </span>
                                    <button
                                        className="fa-card-delete"
                                        title="Verwijderen"
                                        onClick={function(e) { verwijderFoto(foto.id, e); }}
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                                {foto.ai_tags && foto.ai_tags.length > 0 && (
                                    <div className="fa-card-tags">
                                        {foto.ai_tags.slice(0, 3).map(function(tag, i) {
                                            return <span key={i} className="fa-tag">{tag}</span>;
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div className="fa-lightbox" onClick={function() { setLightbox(null); }}>
                    <div className="fa-lightbox-inner" onClick={function(e) { e.stopPropagation(); }}>
                        <div className="fa-lb-header">
                            <div className="fa-lb-meta">
                                <span className="fa-lb-cat" style={{ color: getCatKleur(lightbox.foto.category) }}>
                                    <i className={'fa-solid ' + getCatIcon(lightbox.foto.category)}></i>
                                    {lightbox.foto.category}
                                </span>
                                <span className="fa-lb-date">
                                    {new Date(lightbox.foto.uploaded_at).toLocaleDateString('nl-NL', {
                                        day: '2-digit', month: 'short', year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="fa-lb-actions">
                                {lightbox.foto.edited_url && lightbox.foto.edited_url !== lightbox.foto.original_url && (
                                    <button
                                        className="fa-lb-toggle"
                                        onClick={function() {
                                            setLightbox(function(lb) { return { foto: lb.foto, showEdited: !lb.showEdited }; });
                                        }}
                                    >
                                        <i className={'fa-solid ' + (lightbox.showEdited ? 'fa-wand-magic-sparkles' : 'fa-image')}></i>
                                        {lightbox.showEdited ? 'Bewerkt' : 'Origineel'}
                                    </button>
                                )}
                                <a
                                    className="fa-lb-download"
                                    href={lightbox.showEdited ? (lightbox.foto.edited_url || lightbox.foto.original_url) : lightbox.foto.original_url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Downloaden"
                                    onClick={function(e) { e.stopPropagation(); }}
                                >
                                    <i className="fa-solid fa-download"></i>
                                </a>
                                <button className="fa-lb-close" onClick={function() { setLightbox(null); }}>
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        </div>

                        <div className="fa-lb-img-wrap">
                            {fotos.findIndex(function(f) { return f.id === lightbox.foto.id; }) > 0 && (
                                <button
                                    className="fa-lb-nav fa-lb-nav--prev"
                                    onClick={function() {
                                        var idx = fotos.findIndex(function(f) { return f.id === lightbox.foto.id; });
                                        setLightbox({ foto: fotos[idx - 1], showEdited: lightbox.showEdited });
                                    }}
                                >
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                            )}
                            <img
                                src={lightbox.showEdited
                                    ? (lightbox.foto.edited_url || lightbox.foto.original_url)
                                    : lightbox.foto.original_url}
                                alt={lightbox.foto.ai_description || ''}
                                className="fa-lb-img"
                            />
                            {fotos.findIndex(function(f) { return f.id === lightbox.foto.id; }) < fotos.length - 1 && (
                                <button
                                    className="fa-lb-nav fa-lb-nav--next"
                                    onClick={function() {
                                        var idx = fotos.findIndex(function(f) { return f.id === lightbox.foto.id; });
                                        setLightbox({ foto: fotos[idx + 1], showEdited: lightbox.showEdited });
                                    }}
                                >
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            )}
                        </div>

                        <div className="fa-lb-footer">
                            {lightbox.foto.ai_description && (
                                <p className="fa-lb-desc">{lightbox.foto.ai_description}</p>
                            )}
                            {lightbox.foto.ai_tags && lightbox.foto.ai_tags.length > 0 && (
                                <div className="fa-lb-tags">
                                    {lightbox.foto.ai_tags.map(function(tag, i) {
                                        return <span key={i} className="fa-tag">{tag}</span>;
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Categorie beheer modal */}
            {showCatModal && (
                <div className="fa-lightbox" onClick={function() { setShowCatModal(false); }}>
                    <div className="fa-cat-modal" onClick={function(e) { e.stopPropagation(); }}>
                        <div className="fa-lb-header">
                            <h2><i className="fa-solid fa-tags"></i> Categorieën beheren</h2>
                            <button className="fa-lb-close" onClick={function() { setShowCatModal(false); }}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        {/* Vaste categorieën */}
                        <div className="fa-cat-section">
                            <h3>Standaard</h3>
                            <div className="fa-cat-list">
                                {DEFAULT_CATEGORIES.map(function(cat) {
                                    return (
                                        <div key={cat} className="fa-cat-row">
                                            <span style={{ color: DEFAULT_COLORS[cat] }}>
                                                <i className={'fa-solid ' + DEFAULT_ICONS[cat]}></i>
                                            </span>
                                            <span className="fa-cat-naam">{cat}</span>
                                            <span className="fa-cat-fixed">vast</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom categorieën */}
                        {customCategories.length > 0 && (
                            <div className="fa-cat-section">
                                <h3>Eigen categorieën</h3>
                                <div className="fa-cat-list">
                                    {customCategories.map(function(cat) {
                                        return (
                                            <div key={cat.naam} className="fa-cat-row">
                                                <span style={{ color: cat.kleur }}>
                                                    <i className={'fa-solid ' + cat.icon}></i>
                                                </span>
                                                <span className="fa-cat-naam">{cat.naam}</span>
                                                <button
                                                    className="fa-cat-delete-btn"
                                                    onClick={function() { verwijderCat(cat.naam); }}
                                                    title={'Categorie ' + cat.naam + ' verwijderen'}
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Nieuwe categorie toevoegen */}
                        <div className="fa-cat-section">
                            <h3>Nieuwe categorie</h3>
                            <div className="fa-cat-add-form">
                                <input
                                    type="text"
                                    className="fa-cat-input"
                                    placeholder="Naam (bijv. Workshops)"
                                    value={newCatNaam}
                                    onChange={function(e) { setNewCatNaam(e.target.value); }}
                                    onKeyDown={function(e) { if (e.key === 'Enter') voegCatToe(); }}
                                    maxLength={20}
                                />
                                <div className="fa-cat-kleur-row">
                                    <span>Kleur:</span>
                                    {PALETTE.map(function(kleur) {
                                        return (
                                            <button
                                                key={kleur}
                                                className={'fa-kleur-dot' + (newCatKleur === kleur ? ' fa-kleur-dot--actief' : '')}
                                                style={{ background: kleur }}
                                                onClick={function() { setNewCatKleur(kleur); }}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="fa-cat-icon-row">
                                    <span>Icoon:</span>
                                    {ICON_OPTIES.map(function(icon) {
                                        return (
                                            <button
                                                key={icon}
                                                className={'fa-icon-opt' + (newCatIcon === icon ? ' fa-icon-opt--actief' : '')}
                                                style={newCatIcon === icon ? { color: newCatKleur } : {}}
                                                onClick={function() { setNewCatIcon(icon); }}
                                                title={icon}
                                            >
                                                <i className={'fa-solid ' + icon}></i>
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    className="fa-upload-btn"
                                    onClick={voegCatToe}
                                    disabled={!newCatNaam.trim() || alleTabs.includes(newCatNaam.trim())}
                                >
                                    <i className="fa-solid fa-plus"></i>
                                    <span>Toevoegen</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
