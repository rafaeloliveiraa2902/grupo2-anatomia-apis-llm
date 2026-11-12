# Mesma pergunta nas duas APIs com curl

Execute na raiz do projeto. Os arquivos JSON têm a mesma pergunta e instrução; os modelos podem ser ajustados conforme a sua conta. Use variáveis de ambiente já configuradas localmente. Nunca cole valores de chave no slide, terminal gravado ou histórico. Não use `curl -v`, pois pode imprimir headers de autenticação.

## Bash (Linux/macOS/Git Bash)

```bash
curl --fail-with-body --max-time 45 https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @examples/openai-body.json

curl --fail-with-body --max-time 45 https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  --data-binary @examples/anthropic-body.json
```

## PowerShell (Windows)

`curl.exe` evita confusão com o alias do PowerShell antigo. O `.env` é carregado pelo comando `npm start`; ele **não** configura automaticamente as variáveis do terminal. Para usar as chaves do `.env` sem imprimi-las:

```powershell
Get-Content .env | ForEach-Object {
  if ($_ -match '^(OPENAI_API_KEY|ANTHROPIC_API_KEY)=(.+)$') {
    [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2].Trim(), 'Process')
  }
}
curl.exe --fail-with-body --max-time 45 https://api.openai.com/v1/responses -H "Authorization: Bearer $env:OPENAI_API_KEY" -H "Content-Type: application/json" --data-binary '@examples/openai-body.json'
curl.exe --fail-with-body --max-time 45 https://api.anthropic.com/v1/messages -H "x-api-key: $env:ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" -H "Content-Type: application/json" --data-binary '@examples/anthropic-body.json'
```

Esse leitor simples espera valores sem aspas no `.env`. Os comandos diretos passam credenciais como argumento ao processo curl; use-os somente no computador local confiável. Para uma demonstração gravada, prefira a chamada ao back-end abaixo.

## Chamar o nosso back-end sem credenciais no curl

Com `npm start` ativo:

```powershell
curl.exe -H "Content-Type: application/json" --data-binary '@examples/compare-body.json' http://127.0.0.1:3000/api/compare
```

O arquivo usa `live`. Troque para `demo` apenas para ensaio simulado. O retorno tem resultados individuais para cada provedor. O modo real nunca transforma uma falha em resposta simulada.
