import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { queryProvider, sanitize } from './providers.js';

const assets = { '/': ['index.html','text/html'], '/app.js': ['app.js','text/javascript'], '/style.css': ['style.css','text/css'] };
export function createApp({ env = process.env, fetchImpl = fetch, limit = 10 } = {}) {
  let windowStart = Date.now(), count = 0;
  return http.createServer(async (req, res) => {
    const send = (status, data, type = 'application/json') => {
      res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'" });
      res.end(type === 'application/json' ? JSON.stringify(data) : data);
    };
    try {
      const host = req.headers.host;
      if (!host || !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return send(403, {error:'Host não permitido.'});
      const path = new URL(req.url, `http://${host}`).pathname;
      if (req.method === 'GET' && assets[path]) {
        const [file,type] = assets[path];
        return send(200, await readFile(new URL(`./public/${file}`,import.meta.url)), type);
      }
      if (req.method === 'GET' && path === '/api/config') return send(200, { ready: { openai: !!env.OPENAI_API_KEY, anthropic: !!env.ANTHROPIC_API_KEY } });
      if (path !== '/api/compare') return send(404, {error:'Não encontrado.'});
      if (req.method !== 'POST') return send(405, {error:'Use POST.'});
      if (req.headers.origin && req.headers.origin !== `http://${host}`) return send(403, {error:'Origem não permitida.'});
      if (!req.headers['content-type']?.startsWith('application/json')) return send(415, {error:'Envie application/json.'});
      let body = '', size = 0;
      for await (const chunk of req) { size += chunk.length; if(size > 16000) { send(413,{error:'Corpo muito grande.'}); return; } body += chunk; }
      let data;
      try { data = JSON.parse(body); } catch { return send(400,{error:'JSON inválido.'}); }
      if (!data || typeof data.prompt !== 'string' || !data.prompt.trim() || data.prompt.length > 2000 || !['demo','live'].includes(data.mode)) return send(400,{error:'Informe pergunta de 1 a 2000 caracteres e modo demo ou live.'});
      if(Date.now()-windowStart >= 60000) { windowStart = Date.now(); count = 0; }
      if(count >= limit) return send(429,{error:'Limite local: 10 comparações por minuto. Aguarde.'});
      count++;
      const results = await Promise.all(['openai','anthropic'].map(provider => queryProvider(provider,data.prompt.trim(),data.mode,{env,fetchImpl})));
      return send(200,sanitize({timestamp:new Date().toISOString(), prompt:data.prompt.trim(), mode:data.mode, results},env));
    } catch { if(!res.headersSent) send(500,{error:'Erro interno. Confira a configuração do servidor.'}); else res.end(); }
  });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port,'127.0.0.1',()=>console.log(`LLM Lab: http://127.0.0.1:${port}`));
}
