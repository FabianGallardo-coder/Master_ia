const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8081;
const ROOT = __dirname;
const MIME = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.mp3': 'audio/mpeg',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
};

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

        // Media elements issue Range requests; answering 200 to them leaves the
        // connection in-flight (breaks Playwright networkidle and wastes memory).
        const range = req.headers.range;
        if (range) {
            const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
            if (m && (m[1] !== '' || m[2] !== '')) {
                const size = data.length;
                let start, end;
                if (m[1] === '') {
                    start = Math.max(0, size - parseInt(m[2], 10));
                    end = size - 1;
                } else {
                    start = parseInt(m[1], 10);
                    end = m[2] === '' ? size - 1 : Math.min(parseInt(m[2], 10), size - 1);
                }
                if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
                    res.writeHead(416, { 'Content-Range': `bytes */${size}` });
                    res.end(); return;
                }
                res.writeHead(206, {
                    'Content-Type': MIME[ext],
                    'Content-Range': `bytes ${start}-${end}/${size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': end - start + 1,
                });
                res.end(data.subarray(start, end + 1));
                return;
            }
        }

        res.writeHead(200, {
            'Content-Type': MIME[ext],
            'Accept-Ranges': 'bytes',
            'Content-Length': data.length,
        });
        res.end(data);
    });
}).listen(PORT, () => console.log(`Maestro IA: http://localhost:${PORT}`));