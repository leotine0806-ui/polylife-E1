'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const projectRoot = path.resolve(__dirname, '..');
const designRoot = path.join(projectRoot, 'design');
const manifest = JSON.parse(fs.readFileSync(path.join(designRoot, 'APPROVED-E1-MANIFEST.json'), 'utf8'));
const errors = [];

for (const entry of manifest.files) {
  const file = path.resolve(designRoot, entry.path);
  if (!file.startsWith(designRoot + path.sep)) {
    errors.push(`Path fuori da design/: ${entry.path}`);
    continue;
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    errors.push(`File mancante: ${entry.path}`);
    continue;
  }
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if (hash !== entry.sha256.toLowerCase()) errors.push(`Hash diverso: ${entry.path}`);
}

if (manifest.files.length !== manifest.filesCount) {
  errors.push(`Conteggio manifest incoerente: ${manifest.files.length}/${manifest.filesCount}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Design E1 verificati: ${manifest.files.length}/${manifest.filesCount} file.`);
}
