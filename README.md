# BBQ Architect v2 — Hop & Bites BBQ Catering

Volledig dashboard voor het beheer van Hop & Bites BBQ Catering. Gebouwd met Next.js 16 App Router en Supabase.

## Modules

| Module | Route | Beschrijving |
|--------|-------|-------------|
| Agenda | `/agenda` | Dagplanning en kalenderoverzicht |
| Offertes | `/offertes` | Offertes aanmaken en beheren |
| Events | `/events` | Evenementen en klantgegevens |
| Recepten | `/recepten` | Receptenbeheer met ingrediëntenlijsten |
| Gerechten | `/gerechten` | Menukaart en gerechtenopbouw |
| Inkoop | `/inkoop` | Inkooplijsten en bestellingen |
| Voorraad | `/voorraad` | Voorraadbeheer en stocktellingen |
| Price Intelligence | `/price-intelligence` | Leveranciersprijzen vergelijken (Sligro / Hanos / Bidfood) |
| Facturen | `/facturen` | Facturatie en betalingsstatus |
| Boekhouding | `/boekhouding` | Financieel overzicht |
| HACCP | `/haccp` | Temperatuurregistraties en voedselveiligheid |
| Uren | `/uren` | Urenstaten en personeelsplanning |
| Materieel | `/materieel` | Inventaris van apparatuur en gereedschap |
| Logistiek | `/logistiek` | Transport en laadplanning |
| Service | `/service` | Servicecontracten en onderhoud |
| Instellingen | `/instellingen` | App-instellingen en configuratie |

## Geavanceerde Features

### Price Intelligence
- CSV-import voor Sligro, Hanos en Bidfood prijslijsten
- Automatische kolomdetectie (separator + fuzzy matching)
- Goedkoopste leverancier per ingredient gemarkeerd met ★
- Web Push-notificaties bij >5% prijsstijging op actieve ingrediënten

### Digital Sous-Chef (AI Agent)
- Zwevende Command Center chat-knop rechtsonder
- Aangedreven door Claude 3.5 Sonnet met function calling
- 7 tools: prijsopzoeking, recepten, events, foodcost-berekening, inkooplijst, vega-alternatieven, prijsalerts
- Foodcost doel: 30% = €11,55/portie bij €38,50 menuprijs
- Fallback naar Poe API als geen Anthropic-sleutel beschikbaar

### PWA & Android Widgets
- Installeerbaar als Progressive Web App (standalone modus)
- Long-press snelkoppelingen: Nieuwe Offerte, Nieuw Event, Price Intelligence, Vandaag
- REST-endpoints voor Android-widgets: `/api/widget/today-event`, `/api/widget/mep-list`

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Database**: Supabase (PostgreSQL + RLS)
- **AI**: Anthropic Claude 3.5 Sonnet (`@anthropic-ai/sdk ^0.39.0`)
- **Push Notifications**: Web Push / VAPID (`web-push ^3.6.7`)
- **Storage**: Supabase Storage
- **Stijl**: Custom CSS (geen UI-framework)

## Vereiste Omgevingsvariabelen

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Anthropic (Digital Sous-Chef)
ANTHROPIC_API_KEY=sk-ant-...

# Web Push / VAPID
VAPID_MAILTO=mailto:sam@hopenbites.nl
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>

# Cloudinary (Foto Archief)
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
```

## Database Schemas

Voer de volgende SQL-bestanden uit in de Supabase SQL-editor:

```bash
bbq-architect-v2/price-intelligence-schema.sql   # supplier_prices tabel
bbq-architect-v2/push-subscriptions-schema.sql   # push_subscriptions tabel
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
│   │   ├── page.js                # Dashboard startpagina
│   │   ├── globals.css            # Globale stijlen
│   │   ├── agenda/                # Dagplanning
│   │   ├── events/                # Evenementenbeheer
│   │   ├── offertes/              # Offertebeheer
│   │   ├── recepten/              # Recepten + ingrediënten + leveranciersprijs
│   │   ├── price-intelligence/    # Leveranciersprijsvergelijking
│   │   └── api/
│   │       ├── price-import/      # CSV-parser + upsert + push
│   │       ├── push/subscribe/    # Web Push abonnementbeheer
│   │       ├── sous-chef/         # AI Agent SSE-endpoint
│   │       └── widget/            # Android-widget endpoints
│   ├── components/
│   │   ├── Sidebar.js             # Navigatiebalk
│   │   └── SousChef.js            # Zwevende AI-chat UI
│   └── lib/
│       └── pushNotify.js          # Server-side push helper
├── public/
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service Worker
├── price-intelligence-schema.sql
├── push-subscriptions-schema.sql
└── package.json
```

---

Ontwikkeld voor **Hop & Bites BBQ Catering** door Sam Berkhout.
