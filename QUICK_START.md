# 🚀 Quick Start - 2 Minuten Setup

## Lokaal Testen (Nu meteen!)

```bash
# 1. Installeer dependencies (eenmalig)
npm install

# 2. Start de app
npm run dev

# 3. Open in browser
# Host: http://localhost:3000
# Players: http://localhost:3000 (vanaf telefoons op zelfde WiFi)
```

## 🎮 Eerste Game Spelen

### Als Host:
1. Open http://localhost:3000
2. Klik **"Host Game"**
3. Je krijgt een 4-letter room code
4. Toon dit scherm op je TV/laptop

### Als Speler (minimaal 2):
1. Open http://localhost:3000 op je telefoon
2. Klik **"Join Game"**
3. Vul je naam in
4. Vul de room code in
5. Klaar!

### Game Starten:
1. Host selecteert **"Quiplash"** (aangeraden voor eerste keer)
2. Klik **"Start Game"**
3. Volg de instructies op je telefoon
4. Host klikt "Next Phase" om door te gaan

## 📱 Op Meerdere Devices Testen

### Optie 1: Zelfde WiFi
```bash
# Find je lokale IP:
# Windows:
ipconfig
# Mac/Linux:
ifconfig

# Meestal iets als: 192.168.1.X

# Open op telefoons:
http://192.168.1.X:3000
```

### Optie 2: Ngrok (Internet toegang)
```bash
# Install ngrok
npm install -g ngrok

# In een nieuwe terminal:
ngrok http 3000

# Gebruik de https URL die je krijgt
# Werkt vanaf overal!
```

## ✅ Test Checklist

- [ ] Server start zonder errors
- [ ] Host kan room maken
- [ ] Spelers kunnen joinen
- [ ] Quiplash INPUT fase werkt (prompts beantwoorden)
- [ ] VOTE fase werkt (stemmen op antwoorden)
- [ ] REVEAL toont resultaten
- [ ] Leaderboard toont scores
- [ ] Host kan nieuwe ronde starten

## 🐛 Problemen?

### "Cannot GET /"
Server draait nog niet. Run: `npm run dev`

### "Connection failed"
1. Check of server draait op port 3001
2. Check browser console voor errors
3. Refresh de pagina

### "Room not found"
Server is herstart. Maak nieuwe room.

### Canvas tekenen werkt niet
Gebruik een moderne browser (Chrome, Firefox, Safari)

## 🎯 Volgende Stappen

### Test Alle Games:
1. **Quiplash** - Grappige antwoorden ✅ (Start hier!)
2. **Tee K.O.** - Tekenen + slogans
3. **Trivia** - Quiz vragen
4. **Fibbage** - Waarheid vs leugens
5. **Job Job** - Woord bank
6. **Champ'd Up** - Champion tekeningen

### Deploy Online:
Zie **[DEPLOYMENT.md](DEPLOYMENT.md)** voor gratis hosting!

### Customize:
- Voeg eigen prompts toe in `server/games/quiplash.js`
- Pas kleuren aan in `client/tailwind.config.js`
- Voeg timers toe aan host controls

## 🎊 Ready to Party!

Je app is klaar! Invite je vrienden en veel plezier!

**Pro Tip:** Test eerst met 2-3 spelers voordat je een groot feest organiseert.
