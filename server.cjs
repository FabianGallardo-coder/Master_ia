const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8081;
const ROOT = __dirname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css' };

http.createServer((req, res) => {
    let urlPath;
    try {
        urlPath = decodeURIComponent(req.url.split('?')[0]);
    } catch {
        res.writeHead(400); res.end('Bad request'); return;
    }
    if (urlPath.includes('\0')) {
        res.writeHead(400); res.end('Bad request'); return;
    }

    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const resolved = path.resolve(ROOT, rel);
    const rootWithSep = ROOT + path.sep;
    if (resolved !== ROOT && !resolved.startsWith(rootWithSep)) {
        res.writeHead(403); res.end('Forbidden'); return;
    }

    const ext = path.extname(resolved).toLowerCase();
    if (!MIME[ext]) {
        res.writeHead(403); res.end('Forbidden'); return;
    }

    fs.readFile(resolved, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[ext] });
        res.end(data);
    });
}).listen(PORT, () => console.log(`Maestro IA: http://localhost:${PORT}`));