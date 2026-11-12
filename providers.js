export const SYSTEM = 'Responda em português, com clareza, em até 120 palavras. Use um exemplo de aplicação web.';
export function buildRequest(provider, prompt, env = process.env) {
  if (provider === 'openai') return {
    url: 'https://api.openai.com/v1/responses',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY || ''}` },
    body: { model: env.OPENAI_MODEL || 'gpt-4.1-mini', instructions: SYSTEM, input: prompt, max_output_tokens: 600, store: false }
  };
  if (provider === 'anthropic') return {
    url: 'https://api.anthropic.com/v1/messages',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY || '', 'anthropic-version': env.ANTHROPIC_VERSION || '2023-06-01' },
    body: { model: env.ANTHROPIC_MODEL || 'claude-haiku-5-5', system: SYSTEM, messages: [{ role: 'user', content: prompt }], max_tokens: 600 }
  };
  throw new Error('Provedor inválido');
}
export function sanitize(value, env = process.env) {
  let serialized = JSON.stringify(value);
  for (const secret of [env.OPENAI_API_KEY, env.ANTHROPIC_API_KEY].filter(Boolean)) serialized = serialized.split(JSON.stringify(secret).slice(1,-1)).join('[REMOVIDO]');
  return JSON.parse(serialized);
}
export function publicRequest(req) {
  const headers = { ...req.headers };
  if ('Authorization' in headers) headers.Authorization = 'Bearer [PROTEGIDA NO SERVIDOR]';
  if ('x-api-key' in headers) headers['x-api-key'] = '[PROTEGIDA NO SERVIDOR]';
  return { method: 'POST', endpoint: req.url, headers, body: req.body };
}
export function extractText(provider, data) {
  return provider === 'openai'
    ? (data.output || []).flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n')
    : (data.content || []).filter(item => item.type === 'text').map(item => item.text).join('\n');
}
const errors = { 400: 'Requisição rejeitada: confira os campos e o modelo.', 401: 'Falha de autenticação: confira a chave no .env.', 403: 'Acesso negado pelo provedor.', 404: 'Modelo ou recurso indisponível para esta conta.', 429: 'Limite ou saldo excedido. Confira o painel do provedor e aguarde.' };
export async function queryProvider(provider, prompt, mode, { env = process.env, fetchImpl = fetch, timeout = 45000 } = {}) {
  const req = buildRequest(provider, prompt, env);
  const base = { provider, mode, model: req.body.model, request: publicRequest(req) };
  if (mode === 'demo') {
    const text = provider === 'openai' ? 'EXEMPLO SIMULADO: uma API é um contrato de comunicação. Um navegador pede uma resposta ao back-end, que consulta um serviço externo por HTTP.' : 'EXEMPLO SIMULADO: uma API define como sistemas trocam dados. Em um site, o back-end envia JSON ao serviço de IA e transforma a resposta para a interface.';
    const raw = provider === 'openai' ? { id: 'simulado-openai', model: req.body.model, output: [{ type: 'message', content: [{ type: 'output_text', text }] }], usage: { input_tokens: 40, output_tokens: 45 } } : { id: 'simulado-anthropic', model: req.body.model, content: [{ type: 'text', text }], stop_reason: 'end_turn', usage: { input_tokens: 42, output_tokens: 46 } };
    return { ...base, ok: true, status: 200, elapsedMs: null, text, usage: raw.usage, raw, notice: 'Dados fixos fictícios: não respondem à pergunta e não comprovam uso das APIs.' };
  }
  if (!env[provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY']) return { ...base, ok: false, status: null, error: 'Chave ausente no .env. Nenhuma chamada foi feita.' };
  const start = performance.now();
  try {
    const res = await fetchImpl(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body), signal: AbortSignal.timeout(timeout) });
    if (!res.ok) return sanitize({ ...base, ok: false, status: res.status, elapsedMs: Math.round(performance.now()-start), error: errors[res.status] || 'Falha no provedor. Tente novamente mais tarde.' }, env);
    const raw = await res.json();
    return sanitize({ ...base, ok: true, status: res.status, model: raw.model || base.model, elapsedMs: Math.round(performance.now()-start), text: extractText(provider, raw) || 'Sem bloco de texto. Examine o JSON e o motivo de término.', usage: raw.usage || {}, raw }, env);
  } catch (error) {
    return { ...base, ok: false, status: null, elapsedMs: Math.round(performance.now()-start), error: ['TimeoutError','AbortError'].includes(error.name) ? 'Tempo limite de 45 segundos excedido.' : 'Falha de conexão ou resposta JSON inválida.' };
  }
}
