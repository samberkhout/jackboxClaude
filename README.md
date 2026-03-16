# BBQ Architect v2 — Hop & Bites BBQ Catering

Volledig operationeel dashboard voor het beheer van Hop & Bites BBQ Catering. Gebouwd met Next.js App Router en Supabase — geen betaalde AI-services voor dagelijks gebruik.

## Modules

| Module | Route | Beschrijving |
|--------|-------|-------------|
| Dashboard | `/` | Omzetgrafieken, HACCP-waarschuwingen, marge-alerts, low-stock |
| Agenda | `/agenda` | Maand- én weekweergave, events en prep-suggesties |
| Offertes | `/offertes` | Offertes aanmaken, marge berekenen, CSV-export, email via mailto |
| Events | `/events` | Evenementenbeheer met auto-voorraadverbruik bij afsluiting |
| Recepten | `/recepten` | Receptenbeheer met ingrediëntenlijsten en leveranciersprijzen |
| Gerechten | `/gerechten` | Menukaart, battle plan stappen, service-foto, doeltijd |
| Inkoop | `/inkoop` | Inkooplijsten en bestellingen |
| Voorraad | `/voorraad` | Voorraadbeheer en stocktellingen |
| Price Intelligence | `/price-intelligence` | Prijsvergelijking Sligro/Hanos/Bidfood, prijsalerts >5% |
| Facturen | `/facturen` | Facturatie, betalingsstatus, CSV-export |
| Boekhouding | `/boekhouding` | Financieel overzicht |
| HACCP | `/haccp` | Temperatuurregistraties, dossiers, NVWA-ready PDF-rapport |
| Service Mode | `/service` | The Architect — live gang-timing, battle plan, HACCP quick-log |
| Logistiek | `/logistiek` | Bus-check, transport en laadplanning |
| Foto Archief | `/foto-archief` | Foto upload, bulk-selectie, auto-categorisatie via lokale CLIP |
| Uren | `/uren` | Urenstaten en personeelsplanning |
| Materieel | `/materieel` | Inventaris van apparatuur en gereedschap |
| Instellingen | `/instellingen` | App-instellingen en configuratie |

## Modules in detail

### Service Mode — The Architect
- Selecteer een offerte en start per gang een live timer
- **The Architect modal**: fullscreen split-layout met service-foto links en battle plan rechts
- Stappenchecklist (tap om af te vinken), tabbladen bij meerdere gerechten per gang
- Overtimekleur: timer wordt rood als doeltijd overschreden
- **HACCP Quick-Log**: na elke gang een popup met +/− knoppen voor kerntemperatuur
  - Slimme standaard: kern 75°C, dessert/ijs 4°C, amuse/bites 65°C
- **Bus-Log** (na alle gangen): koeltemperatuur + schoonmaakcheck → automatisch opgeslagen in HACCP-dossier

### HACCP Temperatuurregistratie
- 3 tabs: **Overzicht** (gefilterd), **Registratie** (handmatig), **Dossier** (per event)
- Check types: Ontvangst · Opslag/Koeling · Bereiding · Regenereren · Uitgifte
- Real-time grenswaarde-waarschuwing bij invullen temperatuur
- Dossier-tab: timeline per event met status-indicatoren
- **NVWA-ready PDF**: kleurgecodeerde temperatuurtabel (groen OK / oranje LET OP / rood AFWIJKING)
- Dashboard-bannerwaarschuwing als definitieve offerte nog geen HACCP-logs heeft

### Price Intelligence
- CSV-import voor Sligro, Hanos en Bidfood prijslijsten
- Automatische kolomdetectie (separator + fuzzy matching)
- Goedkoopste leverancier per product gemarkeerd met ★
- **Prijsalerts-banner**: rode alert bij stijgingen >5% gesorteerd op hoogste procentuele stijging
- Web Push-notificaties bij >5% prijsstijging (VAPID, gratis)

### Digital Sous-Chef (AI Agent)
- Zwevende Command Center chat-knop rechtsonder
- Aangedreven door **Groq** (gratis) met function calling
- 7 tools: prijsopzoeking, recepten, events, foodcost-berekening, inkooplijst, vega-alternatieven, schrijfacties
- Geheugen: max 40 berichten opgeslagen in `localStorage`, herstel na reload

### Foto Archief
- Drag-and-drop upload met Sharp-bewerking (EXIF-rotatie, 4:3 crop, normalize, saturation)
- **Lokale AI-classificatie**: CLIP via Transformers.js — geen betaalde API
- Bulk-selectie: meerdere foto's tegelijk verwijderen of hercategoriseren
- Lightbox met navigatie, beschrijving en tags

### Dashboard Analytics
- Recharts BarCharts: omzet per maand + marge per offerte
- Marge-alerts voor komende events met marge <60%
- Bus-check waarschuwing als bus nog niet volledig geladen
- HACCP missing-log waarschuwing per definitieve offerte

### PWA & Offline
- Installeerbaar als Progressive Web App (standalone modus)
- Service Worker v2: stale-while-revalidate voor alle 11 pagina's
- Long-press snelkoppelingen: Nieuwe Offerte, Nieuw Event, Price Intelligence, Vandaag
- Android-widget endpoints: `/api/widget/today-event`, `/api/widget/mep-list`

## Tech Stack

| Categorie | Technologie |
|-----------|------------|
| Framework | Next.js App Router |
| Database | Supabase (PostgreSQL + RLS + Realtime) |
| AI / Chat | Groq (gratis) — geen Anthropic-kosten bij normaal gebruik |
| Lokale AI | Transformers.js (CLIP) — foto-classificatie in de browser |
| Afbeeldingen | Sharp — server-side bewerking, Supabase Storage |
| PDF | jsPDF + jspdf-autotable |
| Grafieken | Recharts |
| Push | Web Push / VAPID (`web-push`) |
| Stijl | Custom CSS (geen UI-framework) |

## Vereiste Omgevingsvariabelen

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # voor Storage uploads

# Groq (Digital Sous-Chef — gratis tier beschikbaar)
GROQ_API_KEY=gsk_...

# Web Push / VAPID
VAPID_MAILTO=mailto:sam@hopenbites.nl
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
```

## Database Schemas

Voer de volgende SQL-bestanden uit in de Supabase SQL-editor (volgorde maakt niet uit, alle scripts zijn idempotent):

```bash
bbq-architect-v2/price-intelligence-schema.sql   # supplier_prices
bbq-architect-v2/push-subscriptions-schema.sql   # push_subscriptions
bbq-architect-v2/photo-logbook-schema.sql        # photo_logbook
bbq-architect-v2/haccp-schema.sql                # haccp_records + service_logs
bbq-architect-v2/gerechten-service-schema.sql    # gerechten uitbreiding + gangen
```

## Lokaal Draaien

```bash
cd bbq-architect-v2
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Aanbevolen platform: **Vercel**

1. Verbind de GitHub-repo met Vercel
2. Stel de omgevingsvariabelen in via het Vercel dashboard
3. Deploy — Next.js wordt automatisch herkend

## Project Structuur

```
bbq-architect-v2/
├── src/
│   ├── app/
│   │   ├── layout.js              # Root layout (manifest, SW, SousChef)
│   │   ├── page.js                # Dashboard met charts en waarschuwingsbanner
│   │   ├── globals.css            # Globale stijlen (~5000 regels)
│   │   ├── agenda/                # Maand- en weekweergave
│   │   ├── events/                # Evenementenbeheer
│   │   ├── offertes/              # Offertebeheer + marge + email + CSV
│   │   ├── facturen/              # Facturatie + CSV
│   │   ├── haccp/                 # Temperatuurregistratie + NVWA PDF
│   │   ├── service/               # The Architect — live service modus
│   │   ├── foto-archief/          # Foto upload, CLIP-AI, bulk-acties
│   │   ├── price-intelligence/    # Prijsvergelijking + alerts
│   │   ├── recepten/              # Recepten + ingrediënten
│   │   ├── gerechten/             # Menukaart + battle plan + service foto
│   │   ├── logistiek/             # Bus-check en laadplanning
│   │   └── api/
│   │       ├── photo/upload/      # Sharp bewerking + Supabase Storage
│   │       ├── price-import/      # CSV-parser + upsert + push
│   │       ├── push/subscribe/    # Web Push abonnementbeheer
│   │       ├── sous-chef/         # AI Agent (Groq)
│   │       └── widget/            # Android-widget endpoints
│   ├── components/
│   │   ├── Sidebar.js             # Navigatiebalk
│   │   ├── SousChef.js            # Zwevende AI-chat (localStorage geheugen)
│   │   ├── MenuWizard.js          # Menu-selectie wizard
│   │   ├── Toast.js               # Notificatiebalkje
│   │   └── ConfirmDialog.js       # Bevestigingsdialoog
│   └── lib/
│       ├── supabase.js            # Supabase client
│       ├── useSupabase.js         # CRUD hook met realtime subscriptions
│       ├── utils.js               # Gedeelde hulpfuncties (marge, CSV, formattering)
│       ├── pdfGenerator.js        # jsPDF offertes, facturen en HACCP-rapporten
│       └── pushNotify.js          # Server-side push helper
├── public/
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service Worker v2 (stale-while-revalidate)
├── haccp-schema.sql               # haccp_records + service_logs
├── gerechten-service-schema.sql   # gerechten service-velden + gangen
├── price-intelligence-schema.sql  # supplier_prices
├── push-subscriptions-schema.sql  # push_subscriptions
├── photo-logbook-schema.sql       # photo_logbook
└── package.json
```

---

Ontwikkeld voor **Hop & Bites BBQ Catering** door Sam Berkhout.
