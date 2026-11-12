# Roteiro de apresentação — 10 minutos + 3 de perguntas

Data: preencher com a data confirmada da próxima aula. Integrantes: preencher os nomes reais.

## Divisão de fala

Sugestão para quatro pessoas: A apresenta slides 1–2 (2 min); B apresenta 3–4 (2 min); C apresenta 5–6 e executa a demonstração (3 min); D apresenta 7–8 (3 min). Se o grupo tiver outro tamanho, divida as oito partes para que todos falem e participem das respostas. Cronometrem no ensaio.

| Slide | Tempo | Fala e ação |
|---|---|---|
| 1 · Anatomia das APIs | 0:30 | Apresentar grupo e objetivo: mesma pergunta, contratos diferentes |
| 2 · Caminho da pergunta | 1:30 | Explicar navegador → back-end → APIs. LLM gera texto; API é o contrato de acesso. Justificar o back-end |
| 3 · Endpoint e headers | 1:00 | Mostrar método POST, URLs e headers. Nunca abrir `.env` no projetor |
| 4 · Body JSON | 1:00 | Comparar `input`/`messages`, `instructions`/`system` e limites. Abrir a coleção Postman com variáveis vazias |
| 5 · Resposta | 1:00 | Mostrar `output` versus `content`, status e uso de tokens. Explicar normalização |
| 6 · Experimento | 2:00 | Fazer a mesma pergunta no Postman ou curl e mostrar o comparador real. Abrir detalhes e exportar evidência |
| 7 · Segurança e erros | 1:30 | Chaves no servidor; `.gitignore`; 401 não é 429. Mostrar o que acontece com chave ausente sem afirmar que isso é um 401 real |
| 8 · Desafio | 1:30 | Dar 30 segundos à turma e discutir a resposta. Encerrar com o aprendizado sobre baixo acoplamento |

## Pergunta-desafio

**Se trocarmos apenas a URL da OpenAI pela da Anthropic, mantendo headers e body, a chamada continuará funcionando? O que precisa mudar, e como evitar alterações no front-end?**

Resposta esperada: não basta trocar a URL. Ajustar autenticação, versão, campos da pergunta/instrução, limite e leitura da resposta. Um adaptador no back-end converte o contrato e devolve um formato comum à interface. Mencionar que modelo e permissões também precisam ser válidos.

## Antes da aula

1. Todos executam `npm start` e entendem `server.js`, `providers.js` e `public/app.js`.
2. Responsável pela demonstração configura suas próprias chaves, verifica créditos e executa ambas as APIs. Não compartilha chaves com colegas.
3. Importar a coleção Postman e executar a mesma pergunta em ambas as chamadas, ou usar os exemplos curl. Guardar as respostas e completar `resultados.md`.
4. No app, selecionar modo real, comparar, abrir os detalhes e baixar JSON. Capturar prints sem outras janelas ou dados pessoais. Não abrir `.env` durante captura.
5. Guardar cópia dos resultados para uma falha de internet. Ensaio simulado é material didático, não prova de execução real.
6. Preencher nomes/data, ensaiar o limite de dez minutos e conferir o acesso do professor ao GitHub.

## Perguntas prováveis

- **Por que não chamar direto do navegador?** A chave seria entregue a quem abre o site. Back-end permite guardar credenciais e controlar uso.
- **Por que respostas diferentes?** Modelos, treinamento e geração são diferentes. Igualar a pergunta não obriga igualdade de resposta.
- **Mais rápido significa melhor?** Não. A medida inclui rede e processamento, varia entre execuções e não avalia precisão.
- **Tokens são palavras?** Não, são unidades de texto do tokenizador, que pode variar entre modelos.
- **Por que o app retorna HTTP 200 se um provedor deu 401?** O comparador funcionou; o erro está no resultado individual do provedor.
- **O `.gitignore` protege uma chave já publicada?** Não. Revogar imediatamente e tratar o histórico do repositório.
- **Podemos hospedar no GitHub Pages?** Ele serve arquivos estáticos; nosso back-end Node precisa de um ambiente de execução próprio.
