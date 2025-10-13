# 🚀 Deployment Guide - Party Game Night

Complete gids om je party game app gratis te hosten!

## 📋 Voorbereiding

### 1. Zet je code op GitHub

```bash
# Initialiseer Git (als nog niet gedaan)
git init

# Voeg alle files toe
git add .

# Maak eerste commit
git commit -m "Initial commit - Party Game Night MVP"

# Maak een nieuwe repository op GitHub.com
# Dan:
git remote add origin https://github.com/JOUW-USERNAME/party-game-night.git
git branch -M main
git push -u origin main
```

---

## 🎯 Optie 1: Render.com (AANGERADEN)

**Voordelen:** Eenvoudig, gratis, goede Socket.IO support
**Nadelen:** Server "slaapt" na 15 min inactiviteit

### Stap 1: Maak Render Account
1. Ga naar [render.com](https://render.com)
2. Sign up (gratis)
3. Klik op "New" → "Web Service"

### Stap 2: Deploy Server
1. Connect je GitHub repository
2. Configuratie:
   ```
   Name: party-game-server
   Region: Frankfurt (of dichtsbij)
   Branch: main
   Root Directory: server
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. Environment Variables:
   ```
   NODE_ENV = production
   ```

4. Selecteer **Free tier**
5. Klik "Create Web Service"
6. **BELANGRIJK: Kopieer je server URL** (bijv: `https://party-game-server-xyz.onrender.com`)

### Stap 3: Deploy Client (Frontend)
1. Klik "New" → "Static Site"
2. Select dezelfde repository
3. Configuratie:
   ```
   Name: party-game-client
   Branch: main
   Build Command: npm install && npm run build
   Publish Directory: client/dist
   ```

4. Environment Variables toevoegen:
   ```
   VITE_WS_URL = https://party-game-server-xyz.onrender.com
   ```
   *(Vervang met je server URL uit stap 2!)*

5. Klik "Create Static Site"

### Stap 4: Test Je App
1. Open je client URL (bijv: `https://party-game-client.onrender.com`)
2. Klik "Host Game"
3. Open dezelfde URL op je telefoon en join!

### 🔄 Updates Deployen
```bash
git add .
git commit -m "Update game logic"
git push
```
Render deploy automatisch!

---

## 🎯 Optie 2: Railway.app

**Voordelen:** Geen cold starts, €5/maand gratis credits, sneller
**Nadelen:** Credits kunnen opraken

### Stap 1: Setup
1. Ga naar [railway.app](https://railway.app)
2. Sign up met GitHub
3. Klik "New Project" → "Deploy from GitHub repo"

### Stap 2: Deploy Server
1. Selecteer je repository
2. Railway detecteert automatisch de configuratie
3. Ga naar je service → Settings:
   ```
   Root Directory: server
   Start Command: npm start
   ```

4. Klik op "Generate Domain" om publieke URL te krijgen
5. **Kopieer deze URL**

### Stap 3: Deploy Client
1. Klik "+ New" → "GitHub Repo" (zelfde repo)
2. Settings:
   ```
   Root Directory: client
   Build Command: npm install && npm run build
   Start Command: npx serve dist
   ```

3. Environment Variables:
   ```
   VITE_WS_URL = https://jouw-server.railway.app
   ```

4. Generate Domain voor client

### Test Je App
Open de client URL en test!

---

## 🎯 Optie 3: Vercel (Client) + Render (Server)

**Voordelen:** Beste performance voor client
**Nadelen:** Twee platforms beheren

### Server (Render)
Volg "Optie 1: Stap 2" hierboven

### Client (Vercel)
1. Ga naar [vercel.com](https://vercel.com)
2. Sign up / Login
3. "Add New..." → "Project"
4. Import je GitHub repository
5. Settings:
   ```
   Framework Preset: Vite
   Root Directory: client
   Build Command: npm run build
   Output Directory: dist
   ```

6. Environment Variables:
   ```
   VITE_WS_URL = https://party-game-server-xyz.onrender.com
   ```

7. Deploy!

---

## 🎯 Optie 4: Fly.io (Alles-in-één)

**Voordelen:** Altijd online, geen cold starts
**Nadelen:** Vereist credit card (geen kosten)

### Setup
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Deploy server
cd server
flyctl launch
# Volg de prompts, selecteer Frankfurt region

# Deploy client
cd ../client
flyctl launch
```

### Configureer URLs
Update `client/.env.production` met je server URL en redeploy.

---

## 🔧 Troubleshooting

### "Cannot connect to server"
1. Check of server URL correct is in `client/.env.production`
2. Check server logs op Render/Railway
3. Test server direct: `https://je-server-url.onrender.com`

### "Room not found"
Server is waarschijnlijk herstart (Render cold start)
- Wacht 30 seconden en probeer opnieuw
- Of upgrade naar Railway voor always-on

### Socket.IO connection errors
1. Check CORS settings in `server/server.js`
2. Controleer of beide services draaien
3. Check browser console voor errors

### Build fails
```bash
# Test lokaal eerst
npm install
npm run build
npm start
```

---

## 📊 Welke Optie Kiezen?

| Platform | Kosten | Speed | Uptime | Complexity |
|----------|--------|-------|--------|-----------|
| **Render** | Gratis | Langzaam (cold start) | Medium | ⭐ Makkelijk |
| **Railway** | €5 gratis | Snel | Hoog | ⭐⭐ Gemiddeld |
| **Vercel + Render** | Gratis | Snel (client) | Medium | ⭐⭐⭐ Meer werk |
| **Fly.io** | Gratis* | Snel | Hoog | ⭐⭐⭐ Advanced |

**Aanbeveling voor beginners:** Start met **Render** (Optie 1)

---

## 🎮 Na Deployment

### URLs Delen
- **Host URL**: `https://jouw-client.onrender.com`
- Dit is het enige adres dat spelers nodig hebben!
- Toon dit op je TV/projector

### Performance Tips
1. **Warm-up** je Render server voordat gasten komen:
   - Open de app 5 minuten voor het feest
   - Dit voorkomt cold start tijdens het spel

2. **Mobile Data** werkt het best:
   - WiFi kan trager zijn met veel devices
   - Test vooraf met je eigen telefoons

3. **Browser Compatibility**:
   - Werkt op alle moderne browsers
   - iOS Safari, Chrome, Firefox all OK

### Monitoring
- **Render**: Dashboard → Service logs
- **Railway**: Project → Deployments → Logs
- Check hier voor errors tijdens het spel

---

## 🆘 Hulp Nodig?

### Logs Bekijken
**Render:**
```
Dashboard → Service → Logs tab
```

**Railway:**
```
Project → Service → Deployments → View Logs
```

### Server Herstarten
**Render:** Service → Manual Deploy → Deploy latest commit
**Railway:** Deployments → Redeploy

### Veelgemaakte Fouten
1. **Vergeten VITE_WS_URL te setten** → Client kan niet met server praten
2. **Verkeerde URL format** → Moet `https://` beginnen, geen trailing `/`
3. **Server regio te ver** → Kies Frankfurt/Amsterdam voor EU

---

## ✅ Deployment Checklist

- [ ] Code op GitHub
- [ ] Server deployed en draait
- [ ] Server URL gekopieerd
- [ ] Client deployed met correcte `VITE_WS_URL`
- [ ] App getest op desktop
- [ ] App getest op mobiel
- [ ] Room join/create werkt
- [ ] Quiplash round speelbaar
- [ ] Leaderboard updates
- [ ] URLs gedeeld met vrienden 🎉

---

## 🔄 Updates Pushen

```bash
# Maak changes
# Test lokaal met: npm run dev

# Commit en push
git add .
git commit -m "Add new feature"
git push

# Render/Railway/Vercel deployen automatisch!
# Check deployment status in hun dashboards
```

---

## 💰 Kosten Overzicht

### Volledig Gratis Opties:
1. **Render (beide)**: €0, maar cold starts
2. **Vercel (client) + Render (server)**: €0, client is snel

### Met Kleine Kosten:
1. **Railway**: €5/maand gratis credits, daarna ~€5-10/maand
2. **Fly.io**: €0 met 3 VMs (vereist credit card)

**Voor een party game avond:** Render gratis tier is perfect! ✅

---

## 🎯 Quick Start (Copy-Paste Friendly)

### Render Deployment (5 minuten):

1. **Push naar GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/party-game-night.git
git push -u origin main
```

2. **Deploy Server op Render.com:**
- New Web Service
- Connect GitHub
- Root: `server`, Build: `npm install`, Start: `npm start`
- Deploy → Copy URL

3. **Deploy Client op Render.com:**
- New Static Site
- Build: `npm install && npm run build`, Publish: `client/dist`
- Environment: `VITE_WS_URL = [JE_SERVER_URL]`
- Deploy → Open URL → Test!

**Klaar! Deel de client URL met je vrienden!** 🎊

---

## 📱 QR Code voor Makkelijk Joinen

Je Host scherm toont automatisch een QR code. Spelers kunnen:
1. QR code scannen met telefoon camera
2. Direct naar de join pagina gaan
3. Naam + room code invullen
4. Spelen!

---

**Veel plezier met je party game night! 🎮🎉**

Problemen? Check de logs of herstart de services!
