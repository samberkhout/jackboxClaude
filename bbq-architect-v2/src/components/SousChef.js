'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

// ── Quick action knoppen ──────────────────────────────────────────────────────
var QUICK_ACTIONS = [
    {
        label: 'Smart Sourcing',
        icon: 'fa-magnifying-glass-dollar',
        color: 'var(--brand)',
        prompt: 'Zoek de goedkoopste leverancier voor rundvlees ribben en vergelijk alle drie leveranciers.',
    },
    {
        label: 'Bereken Foodcost',
        icon: 'fa-calculator',
        color: 'var(--purple)',
        prompt: 'Bereken de foodcost en marge voor het meest recente recept. Gebruik menuprijs €38,50.',
    },
    {
        label: 'Inkooplijst',
        icon: 'fa-cart-shopping',
        color: 'var(--cyan)',
        prompt: 'Genereer een complete inkooplijst voor het eerstvolgende event met de scherpste prijzen van deze week.',
    },
    {
        label: 'Vega Opties',
        icon: 'fa-leaf',
        color: 'var(--green)',
        prompt: 'Geef vega-alternatieven voor de hoofdgangen van mijn menu, inclusief beschikbaarheid bij leveranciers.',
    },
    {
        label: 'Prijsalerts',
        icon: 'fa-bell',
        color: 'var(--amber)',
        prompt: 'Zijn er recentelijk significante prijswijzigingen (>3%) bij mijn leveranciers? Meld stijgingen én dalingen.',
    },
    {
        label: 'Check Marges',
        icon: 'fa-chart-pie',
        color: 'var(--blue)',
        prompt: 'Analyseer de marges voor alle recepten op basis van de actuele inkoopprijzen. Welk recept heeft de beste marge?',
    },
];

var TOOL_LABELS = {
    get_supplier_prices: 'Leveranciersprijs ophalen',
    get_recipe: 'Recept opzoeken',
    get_event: 'Event ophalen',
    calculate_foodcost: 'Foodcost berekenen',
    generate_shopping_list: 'Inkooplijst genereren',
    suggest_vegan_alternatives: 'Vega-alternatieven zoeken',
    check_price_changes: 'Prijswijzigingen controleren',
};

var WELCOME_MSG = {
    role: 'assistant',
    type: 'text',
    content: 'Goedemiddag! Ik ben je **Digital Sous-Chef**. Ik heb live toegang tot je leveranciersprijs, recepten en events.\n\nVraag me naar:\n• Goedkoopste leverancier voor een product\n• Foodcost-berekening van een recept\n• Inkooplijst voor je volgende event\n• Vega-alternatieven voor je menu',
};

// ── Markdown formatter ────────────────────────────────────────────────────────
function formatText(text) {
    if (!text) return null;
    return text.split('\n').map(function (line, lineIdx) {
        var parts = line.split(/(\*\*[^*]+\*\*)/g);
        var formatted = parts.map(function (part, partIdx) {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
            }
            // Bullet list conversion
            if (part.startsWith('• ') || part.startsWith('- ')) {
                return <span key={partIdx}>{part}</span>;
            }
            return part;
        });
        return (
            <span key={lineIdx}>
                {lineIdx > 0 && <br />}
                {formatted}
            </span>
        );
    });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SousChef() {
    var [open, setOpen] = useState(false);
    var [messages, setMessages] = useState([WELCOME_MSG]);
    var [input, setInput] = useState('');
    var [loading, setLoading] = useState(false);
    var [showActions, setShowActions] = useState(true);
    var [size, setSize] = useState('normal'); // 'normal' | 'large'
    var messagesEndRef = useRef();
    var inputRef = useRef();
    var abortRef = useRef(null);

    useEffect(function () {
        if (open && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, open]);

    useEffect(function () {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    var sendMessage = useCallback(async function (text) {
        if (!text.trim() || loading) return;

        var userMsg = { role: 'user', type: 'text', content: text };
        setMessages(function (prev) { return prev.concat([userMsg]); });
        setInput('');
        setLoading(true);
        setShowActions(false);

        // Bouw API messages (alleen role+content voor Anthropic)
        var apiMessages = messages
            .concat([userMsg])
            .filter(function (m) { return m.type === 'text' || m.type === 'streaming'; })
            .map(function (m) { return { role: m.role, content: m.content }; });

        try {
            var res = await fetch('/api/sous-chef', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages }),
                signal: abortRef.current,
            });

            if (!res.ok) {
                throw new Error('API fout: ' + res.status);
            }

            var reader = res.body.getReader();
            var decoder = new TextDecoder();
            var buffer = '';
            var assistantText = '';

            // Voeg streaming placeholder toe
            setMessages(function (prev) { return prev.concat([{ role: 'assistant', type: 'streaming', content: '' }]); });

            while (true) {
                var chunk = await reader.read();
                if (chunk.done) break;
                buffer += decoder.decode(chunk.value, { stream: true });

                var lines = buffer.split('\n');
                buffer = lines.pop();

                for (var line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        var event = JSON.parse(line.slice(6));

                        if (event.type === 'tool_start') {
                            // Voeg tool-kaart in vóór de streaming placeholder
                            setMessages(function (prev) {
                                var last = prev[prev.length - 1];
                                var rest = prev.slice(0, -1);
                                return rest.concat([
                                    { role: 'assistant', type: 'tool_running', tool: event.tool, input: event.input, id: event.tool + '_' + Date.now() },
                                    last,
                                ]);
                            });
                        } else if (event.type === 'tool_done') {
                            // Markeer tool als klaar
                            setMessages(function (prev) {
                                return prev.map(function (m) {
                                    if (m.type === 'tool_running' && m.tool === event.tool) {
                                        return Object.assign({}, m, { type: 'tool_done' });
                                    }
                                    return m;
                                });
                            });
                        } else if (event.type === 'text') {
                            assistantText += event.delta;
                            setMessages(function (prev) {
                                return prev.slice(0, -1).concat([{ role: 'assistant', type: 'streaming', content: assistantText }]);
                            });
                        } else if (event.type === 'done') {
                            setMessages(function (prev) {
                                return prev.slice(0, -1).concat([{ role: 'assistant', type: 'text', content: assistantText }]);
                            });
                        } else if (event.type === 'error') {
                            setMessages(function (prev) {
                                return prev.slice(0, -1).concat([{ role: 'assistant', type: 'error', content: 'Fout: ' + event.message }]);
                            });
                        }
                    } catch (e) { /* ignore parse errors */ }
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setMessages(function (prev) {
                    return prev.slice(0, -1).concat([{
                        role: 'assistant', type: 'error',
                        content: 'Verbindingsfout: ' + err.message + '\n\nControleer je ANTHROPIC_API_KEY in .env.local',
                    }]);
                });
            }
        }
        setLoading(false);
    }, [messages, loading]);

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    }

    function clearChat() {
        setMessages([WELCOME_MSG]);
        setShowActions(true);
    }

    function toggleSize() {
        setSize(function (s) { return s === 'normal' ? 'large' : 'normal'; });
    }

    return (
        <>
            {/* ── Floating Action Button ── */}
            <button
                className={'sc-fab' + (open ? ' sc-fab-open' : '')}
                onClick={function () { setOpen(function (o) { return !o; }); }}
                title="Digital Sous-Chef"
                aria-label="Open Digital Sous-Chef"
            >
                <i className={'fa-solid ' + (open ? 'fa-xmark' : 'fa-hat-chef')}></i>
                {!open && <span className="sc-fab-label">Sous-Chef</span>}
            </button>

            {/* ── Chat panel ── */}
            {open && (
                <div className={'sc-panel' + (size === 'large' ? ' sc-panel-large' : '')}>

                    {/* Header */}
                    <div className="sc-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="sc-avatar">
                                <i className="fa-solid fa-hat-chef"></i>
                            </div>
                            <div>
                                <div className="sc-title">Digital Sous-Chef</div>
                                <div className="sc-subtitle">
                                    <span className="sc-online-dot"></span>
                                    Hop &amp; Bites AI · Claude 3.5 Sonnet
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button className="sc-icon-btn" onClick={toggleSize} title={size === 'large' ? 'Kleiner' : 'Groter'}>
                                <i className={'fa-solid ' + (size === 'large' ? 'fa-compress' : 'fa-expand')}></i>
                            </button>
                            <button className="sc-icon-btn" onClick={clearChat} title="Chat wissen">
                                <i className="fa-solid fa-rotate-left"></i>
                            </button>
                            <button className="sc-icon-btn" onClick={function () { setOpen(false); }} title="Sluiten">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="sc-messages">
                        {messages.map(function (msg, i) {
                            return renderMessage(msg, i);
                        })}
                        {loading && messages[messages.length - 1]?.type === 'streaming' && (
                            <div className="sc-typing">
                                <span></span><span></span><span></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick actions */}
                    {showActions && (
                        <div className="sc-actions-wrap">
                            <div className="sc-actions-label">Snelle acties</div>
                            <div className="sc-actions">
                                {QUICK_ACTIONS.map(function (a) {
                                    return (
                                        <button
                                            key={a.label}
                                            className="sc-action-btn"
                                            style={{ '--sc-action-color': a.color }}
                                            onClick={function () { sendMessage(a.prompt); }}
                                            disabled={loading}
                                        >
                                            <i className={'fa-solid ' + a.icon}></i>
                                            {a.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Input area */}
                    <div className="sc-input-area">
                        {!showActions && !loading && (
                            <button className="sc-show-actions-btn" onClick={function () { setShowActions(true); }}>
                                <i className="fa-solid fa-bolt"></i> Acties
                            </button>
                        )}
                        <div className="sc-input-row">
                            <textarea
                                ref={inputRef}
                                className="sc-input"
                                placeholder="Stel een vraag aan je Sous-Chef..."
                                value={input}
                                rows={1}
                                onChange={function (e) {
                                    setInput(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                                }}
                                onKeyDown={handleKeyDown}
                                disabled={loading}
                            />
                            <button
                                className="sc-send"
                                onClick={function () { sendMessage(input); }}
                                disabled={loading || !input.trim()}
                            >
                                {loading
                                    ? <i className="fa-solid fa-spinner fa-spin"></i>
                                    : <i className="fa-solid fa-paper-plane"></i>}
                            </button>
                        </div>
                        <div className="sc-footer-note">
                            <i className="fa-solid fa-lock" style={{ fontSize: 9 }}></i>
                            Live data · Sligro · Hanos · Bidfood
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function renderMessage(msg, i) {
    if (msg.type === 'tool_running') {
        return (
            <div key={i} className="sc-tool-card sc-tool-running">
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 11 }}></i>
                <span>{TOOL_LABELS[msg.tool] || msg.tool}</span>
                <span className="sc-tool-dots">...</span>
            </div>
        );
    }

    if (msg.type === 'tool_done') {
        return (
            <div key={i} className="sc-tool-card sc-tool-done">
                <i className="fa-solid fa-check"></i>
                <span>{TOOL_LABELS[msg.tool] || msg.tool}</span>
            </div>
        );
    }

    if (msg.type === 'error') {
        return (
            <div key={i} className="sc-msg sc-msg-error">
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6, color: 'var(--red)' }}></i>
                {msg.content}
            </div>
        );
    }

    var isUser = msg.role === 'user';
    var isStreaming = msg.type === 'streaming';

    return (
        <div key={i} className={'sc-msg ' + (isUser ? 'sc-msg-user' : 'sc-msg-assistant')}>
            {!isUser && (
                <div className="sc-msg-avatar">
                    <i className="fa-solid fa-hat-chef"></i>
                </div>
            )}
            <div className={'sc-msg-bubble' + (isUser ? ' sc-bubble-user' : ' sc-bubble-assistant')}>
                {formatText(msg.content)}
                {isStreaming && <span className="sc-cursor">▋</span>}
            </div>
        </div>
    );
}
