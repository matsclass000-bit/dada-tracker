// ============================================================
// server.js — The BRAIN of our app (server-side code ✅)
//
// We use a simple JSON file as our "database".
// Open "locations.json" anytime to see your data!
// Only dependency: express
// ============================================================

const express = require('express');
const fs      = require('fs');
const https   = require('https');
const path    = require('path');

const app     = express();
const DB_FILE = 'locations.json';

// ---- DATABASE HELPERS ✅ ----
function loadLocations() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  return [];
}

function saveLocations(locations) {
  fs.writeFileSync(DB_FILE, JSON.stringify(locations, null, 2));
}

console.log('✅ Database (locations.json) ready');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// POST /location  — Dada ji sends his location here
// ============================================================
app.post('/location', (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'Missing lat or lng' });

  const locations = loadLocations();
  const newEntry = {
    id:        locations.length + 1,
    lat,
    lng,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  };
  locations.unshift(newEntry);
  saveLocations(locations);
  console.log(`📍 Saved #${newEntry.id}: ${lat}, ${lng} | Total: ${locations.length}`);

  // Send push notification via ntfy.sh (free, no signup!)
  const mapsURL = `https://maps.google.com/?q=${lat},${lng}`;
  const options = {
    hostname: 'ntfy.sh', port: 443,
    path:     '/dada-tracker-8287481934',
    method:   'POST',
    headers:  { 'Title': 'Dada ji Location Alert', 'Content-Type': 'text/plain', 'Priority': 'high' }
  };
  const r = https.request(options, res => console.log(`🔔 Notification: ${res.statusCode}`));
  r.on('error', e => console.error('Notif error:', e.message));
  r.write(`Dada ji ne location bheja!\n${mapsURL}`);
  r.end();

  res.json({ success: true, id: newEntry.id });
});

// ============================================================
// GET /locations  — Dashboard fetches all saved locations
// ============================================================
app.get('/locations', (req, res) => {
  const locations = loadLocations();
  console.log(`📊 Dashboard: returning ${locations.length} locations`);
  res.json(locations);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Running on port ${PORT}`);
  console.log(`📱 Dada ji : http://localhost:${PORT}/dada.html`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html\n`);
});
