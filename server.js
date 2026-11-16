// Merry Brawl multiplayer server - zero dependencies. Node.js 18+  |  start: node server.js
const http = require('http'), crypto = require('crypto');
const PORT = process.env.PORT || 8080, CH = ['luffy', 'zoro', 'sanji', 'ryuma'];
const clients = new Set(), rooms = new Map(); let queue = [];
const server = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/plain' }); r.end('Merry Brawl server OK\n'); });
function frame(s) {
  const p = Buffer.from(s), n = p.length; let h;
  if (n < 126) h = Buffer.from([0x81, n]);
  else if (n < 65536) { h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(n, 2); }
  else { h = Buffer.alloc(10); h[0] = 0x81; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); }
  return Buffer.concat([h, p]);
}
function send(c, o) { if (!c.sock.destroyed) c.sock.write(frame(typeof o === 'string' ? o : JSON.stringify(o))); }
function start(a, b) {
  a.peer = b; b.peer = a;
  send(a, { t: 'start', slot: 0, ch: [a.ch, b.ch] }); send(b, { t: 'start', slot: 1, ch: [b.ch, a.ch] });
}
function leave(c) {
  queue = queue.filter(x => x !== c);
  if (c.code) { rooms.delete(c.code); c.code = null; }
  if (c.peer) { send(c.peer, { t: 'left' }); c.peer.peer = null; c.peer = null; }
}
function code() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s; do { s = ''; for (let i = 0; i < 5; i++) s += A[crypto.randomInt(A.length)]; } while (rooms.has(s)); return s; }
function msg(c, s) {
  let m; try { m = JSON.parse(s); } catch { return; }
  if ((m.t === 's' || m.t === 'hit') && c.peer) return send(c.peer, s);
  if (m.t === 'ping') return send(c, { t: 'pong', ts: m.ts });
  if (c.peer) return;
  if (['quick', 'host', 'join'].includes(m.t)) { leave(c); c.ch = CH.includes(m.ch) ? m.ch : 'luffy'; }
  if (m.t === 'quick') { const o = queue.shift(); if (o && !o.sock.destroyed) start(o, c); else { queue.push(c); send(c, { t: 'wait' }); } }
  else if (m.t === 'host') { c.code = code(); rooms.set(c.code, c); send(c, { t: 'code', code: c.code }); }
  else if (m.t === 'join') {
    const k = String(m.code || '').toUpperCase().trim(), h = rooms.get(k);
    if (!h || h === c) return send(c, { t: 'err', m: 'Code not found' });
    rooms.delete(k); h.code = null; start(h, c);
  } else if (m.t === 'cancel') leave(c);
}
server.on('upgrade', (req, sock) => {
  const k = req.headers['sec-websocket-key']; if (!k) return sock.destroy();
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' +
    crypto.createHash('sha1').update(k + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64') + '\r\n\r\n');
  sock.setNoDelay(true);
  const c = { sock, buf: Buffer.alloc(0), frag: [], peer: null, code: null, ch: 'luffy', alive: true }; clients.add(c);
  const done = () => { clients.delete(c); leave(c); };
  sock.on('close', done); sock.on('error', () => sock.destroy());
  sock.on('data', d => {
    c.alive = true; c.buf = Buffer.concat([c.buf, d]);
    for (;;) {
      const b = c.buf; if (b.length < 2) return;
      const fin = b[0] & 128, op = b[0] & 15, masked = b[1] & 128; let len = b[1] & 127, off = 2;
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
      if (len > 65536) return sock.destroy();
      if (masked) off += 4; if (b.length < off + len) return;
      const p = Buffer.from(b.subarray(off, off + len));
      if (masked) { const mk = b.subarray(off - 4, off); for (let i = 0; i < p.length; i++) p[i] ^= mk[i & 3]; }
      c.buf = b.subarray(off + len);
      if (op === 8) return sock.end();
      if (op === 9) { sock.write(Buffer.concat([Buffer.from([0x8a, p.length]), p])); continue; }
      if (op === 1 || op === 0) { c.frag.push(p); if (fin) { const s = Buffer.concat(c.frag).toString(); c.frag = []; msg(c, s); } }
    }
  });
});
setInterval(() => { for (const c of clients) { if (!c.alive) { c.sock.destroy(); continue; } c.alive = false; c.sock.write(Buffer.from([0x89, 0])); } }, 25000);
server.listen(PORT, () => console.log('Merry Brawl server listening on ' + PORT));
