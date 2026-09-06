// Runs at Netlify build time. Reads every retreat entry from content/retreats/
// (managed via the CMS) and combines them into one file, content/retreats-index.json,
// that the live site fetches to render the Retreats page.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'content', 'retreats');
const outFile = path.join(__dirname, 'content', 'retreats-index.json');

let files = [];
try {
  files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
} catch (e) {
  console.log('No content/retreats folder found — writing an empty index.');
}

const retreats = files.map(f => {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Skipping ${f}: invalid JSON (${e.message})`);
    return null;
  }
}).filter(Boolean);

retreats.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

fs.writeFileSync(outFile, JSON.stringify(retreats, null, 2));
console.log(`Wrote ${retreats.length} retreat(s) to ${outFile}`);
