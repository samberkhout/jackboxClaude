'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

var CATEGORIES = ['Alles', 'Food', 'Gear', 'Sfeer', 'Admin'];

var CATEGORY_ICONS = {
    Alles: 'fa-images',
    Food:  'fa-drumstick-bite',
    Gear:  'fa-fire-burner',
    Sfeer: 'fa-people-group',
    Admin: 'fa-folder-open',
};

var CATEGORY_COLORS = {
    Food:  '#FF6B35',
    Gear:  '#FFBF00',
    Sfeer: '#4ECDC4',
    Admin: '#95A5A6',
};

export default function FotoArchief() {
    var [activeCategory, setActiveCategory] = useState('Alles');
    var [fotos, setFotos] = useState([]);
    var [loading, setLoading] = useState(true);
    var [uploading, setUploading] = useState(false);
    var [uploadProgress, setUploadProgress] = useState(null); // null | 'uploading' | 'editing' | 'categorising' | 'done' | 'error'
    var [uploadMsg, setUploadMsg] = useState('');
    var [lightbox, setLightbox] = useState(null); // { foto, showEdited }
    var [dragOver, setDragOver] = useState(false);
    var [autoEdit, setAutoEdit] = useState(true);
    var fileInputRef = useRef(null);

    var laadFotos = useCallback(function() {
        setLoading(true);
        var url = '/api/photo/upload?limit=200' + (activeCategory !== 'Alles' ? '&category=' + activeCategory : '');
        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                setFotos(data.fotos || []);
            })
            .catch(function(e) { console.error(e); })
            .finally(function() { setLoading(false); });
    }, [activeCategory]);

    useEffect(function() { laadFotos(); }, [laadFotos]);

    // ── Upload logica ──────────────────────────────────────────────────────
    async function uploadFoto(file) {
        if (!file || !file.type.startsWith('image/')) {
            setUploadMsg('Alleen afbeeldingen (JPEG, PNG, WebP, HEIC).');
            setUploadProgress('error');
            return;
        }
        setUploading(true);
        setUploadProgress('uploading');
        setUploadMsg('Foto uploaden...');

        try {
            var form = new FormData();
            form.append('photo', file);
            form.append('auto_edit', autoEdit ? 'true' : 'false');

            setUploadProgress('editing');
            setUploadMsg(autoEdit ? 'AI bewerkt de foto (rechttrekken, crop, kleur)...' : 'Foto verwerken...');

            var res = await fetch('/api/photo/upload', { method: 'POST', body: form });
            var data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Upload mislukt');

            setUploadProgress('categorising');
            setUploadMsg('AI categoriseert de foto...');

            // Kleine vertraging zodat de gebruiker de stap ziet
            await new Promise(function(r) { setTimeout(r, 600); });

            setUploadProgress('done');
            setUploadMsg(
                'Opgeslagen als ' + data.foto.category +
                (data.cloudinary ? ' · Cloudinary-bewerking toegepast' : '') +
                (data.ai_used ? ' · Gecategoriseerd door Claude Vision' : '')
            );
            laadFotos();
            setTimeout(function() { setUploadProgress(null); setUploadMsg(''); }, 3500);
        } catch (err) {
            setUploadProgress('error');
            setUploadMsg(err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    function handleFileChange(e) {
        var files = Array.from(e.target.files || []);
        files.forEach(function(f) { uploadFoto(f); });
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        var files = Array.from(e.dataTransfer.files || []);
        files.forEach(function(f) { uploadFoto(f); });
    }

    async function verwijderFoto(id, e) {
        e.stopPropagation();
        if (!confirm('Foto definitief verwijderen?')) return;
        await fetch('/api/photo/upload?id=' + id, { method: 'DELETE' });
        if (lightbox && lightbox.foto.id === id) setLightbox(null);
        laadFotos();
    }

    // ── Statistieken per categorie ─────────────────────────────────────────
    function aantalPerCategorie(cat) {
        if (cat === 'Alles') return fotos.length;
        // Als we gefilterd laden, klopt dit alleen bij 'Alles'-tab
        // Toon — als we niet op Alles staan
        return null;
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
                    <label className="fa-upload-btn" title="Foto uploaden">
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        <span>Foto Uploaden</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </label>
                    <label className="fa-toggle-label" title="Automatisch bewerken met Cloudinary AI">
                        <input
                            type="checkbox"
                            checked={autoEdit}
                            onChange={function(e) { setAutoEdit(e.target.checked); }}
                        />
                        <span>Auto-edit</span>
                    </label>
                </div>
            </div>

            {/* Upload progress banner */}
            {uploadProgress && (
                <div className={'fa-upload-banner fa-upload-banner--' + uploadProgress}>
                    {uploadProgress === 'done' && <i className="fa-solid fa-circle-check"></i>}
                    {uploadProgress === 'error' && <i className="fa-solid fa-circle-exclamation"></i>}
                    {(uploadProgress === 'uploading' || uploadProgress === 'editing' || uploadProgress === 'categorising') && (
                        <span className="fa-spinner"></span>
                    )}
                    <span>{uploadMsg}</span>
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
                <span>Sleep foto's hierheen of gebruik de knop</span>
            </div>

            {/* Categorie tabs */}
            <div className="fa-tabs">
                {CATEGORIES.map(function(cat) {
                    return (
                        <button
                            key={cat}
                            className={'fa-tab' + (activeCategory === cat ? ' fa-tab--active' : '')}
                            style={activeCategory === cat && cat !== 'Alles'
                                ? { borderColor: CATEGORY_COLORS[cat], color: CATEGORY_COLORS[cat] }
                                : {}}
                            onClick={function() { setActiveCategory(cat); }}
                        >
                            <i className={'fa-solid ' + CATEGORY_ICONS[cat]}></i>
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
                    <i className={'fa-solid ' + CATEGORY_ICONS[activeCategory]}></i>
                    <p>Nog geen foto's in {activeCategory === 'Alles' ? 'het archief' : 'de map ' + activeCategory}</p>
                    <label className="fa-upload-btn fa-upload-btn--ghost">
                        <i className="fa-solid fa-plus"></i> Eerste foto uploaden
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </label>
                </div>
            ) : (
                <div className="fa-grid">
                    {fotos.map(function(foto) {
                        var kleur = CATEGORY_COLORS[foto.category] || '#95A5A6';
                        return (
                            <div
                                key={foto.id}
                                className="fa-card"
                                onClick={function() { setLightbox({ foto: foto, showEdited: true }); }}
                            >
                                {/* Thumbnail */}
                                <div className="fa-card-img-wrap">
                                    <img
                                        src={foto.edited_url || foto.original_url}
                                        alt={foto.ai_description || foto.category}
                                        className="fa-card-img"
                                        loading="lazy"
                                    />
                                    {/* Category badge */}
                                    <span
                                        className="fa-cat-badge"
                                        style={{ background: kleur }}
                                    >
                                        <i className={'fa-solid ' + CATEGORY_ICONS[foto.category]}></i>
                                        {foto.category}
                                    </span>
                                    {/* Delete button */}
                                    <button
                                        className="fa-card-delete"
                                        title="Verwijderen"
                                        onClick={function(e) { verwijderFoto(foto.id, e); }}
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                                {/* Tags */}
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
                        {/* Header */}
                        <div className="fa-lb-header">
                            <div className="fa-lb-meta">
                                <span
                                    className="fa-lb-cat"
                                    style={{ color: CATEGORY_COLORS[lightbox.foto.category] }}
                                >
                                    <i className={'fa-solid ' + CATEGORY_ICONS[lightbox.foto.category]}></i>
                                    {lightbox.foto.category}
                                </span>
                                <span className="fa-lb-date">
                                    {new Date(lightbox.foto.uploaded_at).toLocaleDateString('nl-NL', {
                                        day: '2-digit', month: 'short', year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="fa-lb-actions">
                                {/* Origineel / Bewerkt toggle */}
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

                        {/* Afbeelding */}
                        <div className="fa-lb-img-wrap">
                            {/* Pijl links */}
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
                            {/* Pijl rechts */}
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

                        {/* Beschrijving en tags */}
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
        </div>
    );
}
