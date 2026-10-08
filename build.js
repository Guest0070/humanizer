// Inlines src/engine.js into src/app.html and writes the single-file app, index.html.
'use strict';
const fs = require('fs');
const path = require('path');
const engine = fs.readFileSync(path.join(__dirname, 'src', 'engine.js'), 'utf8');
if (/<\/script/i.test(engine)) throw new Error('engine.js must not contain a closing script tag');
const app = fs.readFileSync(path.join(__dirname, 'src', 'app.html'), 'utf8');
if (!app.includes('/*ENGINE*/')) throw new Error('app.html is missing the /*ENGINE*/ marker');
fs.writeFileSync(path.join(__dirname, 'index.html'), app.replace('/*ENGINE*/', () => engine));
console.log('built index.html (' + Math.round((app.length + engine.length) / 1024) + ' KB)');
