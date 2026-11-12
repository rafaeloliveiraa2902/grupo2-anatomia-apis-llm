const $ = id => document.getElementById(id);
let evidence;
const node = (tag, text, className) => { const el=document.createElement(tag); el.textContent=text; if(className) el.className=className; return el; };
function render(result) {
  const card=node('article','','result');
  card.append(node('span',result.provider.toUpperCase(),'provider'),node('h2',result.model));
  card.append(node('p',result.mode==='demo'?'SIMULADO · NÃO É RESULTADO REAL':'MODO REAL','notice'));
  card.append(node('p',`HTTP: ${result.status ?? 'não recebido'} · Tempo: ${result.elapsedMs == null ? 'não medido' : result.elapsedMs+' ms'} · Entrada: ${result.usage?.input_tokens ?? '—'} tokens · Saída: ${result.usage?.output_tokens ?? '—'} tokens`,'metrics'));
  card.append(node('p',result.ok?result.text:result.error));
  if(result.notice) card.append(node('p',result.notice,'notice'));
  for(const [title,data] of [['Endpoint, headers e body (chave removida)',result.request],['JSON de resposta',result.raw]]) {
    if(!data) continue;
    const details=node('details',''); details.append(node('summary',title),node('pre',JSON.stringify(data,null,2)));card.append(details);
  }
  return card;
}
$('mode').addEventListener('change',()=>{ $('mode-note').textContent=$('mode').value==='demo'?'Ensaio com dados fictícios, sem chamadas externas.':'Envia a pergunta aos dois provedores e pode consumir créditos.'; });
$('form').addEventListener('submit',async event=>{
  event.preventDefault();$('compare').disabled=true;$('export').disabled=true;evidence=null;
  $('results').replaceChildren();$('status').textContent='Comparando os dois contratos…';
  try {
    const response=await fetch('/api/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:$('prompt').value,mode:$('mode').value})});
    const data=await response.json();if(!response.ok)throw new Error(data.error);
    evidence=data;$('results').replaceChildren(...data.results.map(render));$('export').disabled=false;
    $('status').textContent=data.mode==='demo'?'Ensaio concluído. As respostas e os tokens são fictícios.':`${data.results.filter(r=>r.ok).length}/2 provedores responderam. Confira os detalhes abaixo.`;
  } catch(error){$('status').textContent=error.message || 'Não foi possível acessar o servidor.';} finally{$('compare').disabled=false;}
});
$('export').addEventListener('click',()=>{
  if(!evidence)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`comparacao-${evidence.mode}-${Date.now()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
fetch('/api/config').then(r=>r.json()).then(data=>{ $('config').textContent=`Chaves no servidor: OpenAI ${data.ready.openai?'configurada':'ausente'} · Anthropic ${data.ready.anthropic?'configurada':'ausente'}.`; }).catch(()=>{$('config').textContent='Servidor indisponível.';});
