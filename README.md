# IA + Obra - Bot WhatsApp para orcamento eletrico

Projeto com dois modulos locais:

- Bot WhatsApp para atendimento e orcamento inicial
- Webapp React/TypeScript para planejamento eletrico modular com planta 2D

## 1. Requisitos

- Node.js instalado
- VS Code
- WhatsApp no celular

## 2. Instalacao

Abra a pasta no VS Code e rode:

```bash
npm install
```

Copie `.env.example` para `.env` e ajuste:

```bash
COMPANY_NAME=Martinho Construtor
CITY=Porto Alegre
HOURLY_RATE=150
DIAGNOSTIC_FEE=200
EMERGENCY_MULTIPLIER=1.7
```

## 3. Rodar

Bot WhatsApp:

```bash
npm start
```

Escaneie o QR Code com o WhatsApp.

Webapp de planejamento eletrico:

```bash
npm run web
```

Abra:

```text
http://127.0.0.1:5173
```

## 3.1. Publicar a pagina web

Build de producao:

```bash
npm run check:web
```

O site estatico fica em `dist/` e pode ser publicado em Vercel, Netlify, Cloudflare Pages ou outro host estatico.

Configuracao recomendada do host:

- comando de build: `npm run check:web`
- diretorio publicado: `dist`
- variavel opcional: `VITE_WHATSAPP_PHONE=5551997290222`

Arquivos ja preparados para publicacao:

- `public/_headers`: headers de seguranca e cache para hosts que suportam esse formato.
- `public/_redirects`: fallback para o app React em hospedagem estatica.
- `public/robots.txt`, `public/llms.txt` e `public/agent.json`: descoberta por buscadores e agentes.
- `public/customer-configurator/optimized`: imagens WebP usadas pela pagina publicada.
- `assets-source/`: imagens originais locais, mantidas fora do pacote publico e fora do Git.

Depois que escolher o dominio final, adicione `canonical`, `og:url`, `og:image` absoluto e `sitemap.xml` com a URL publica.

### Publicar via GitHub Pages

Este repositorio ja inclui `.github/workflows/deploy-pages.yml`.

1. Crie um repositorio no GitHub.
2. Conecte este projeto local ao repositorio:

```bash
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
git add .
git commit -m "Prepare web page for GitHub Pages"
git push -u origin main
```

3. No GitHub, abra `Settings` -> `Pages`.
4. Em `Build and deployment`, selecione `Source: GitHub Actions`.
5. Abra a aba `Actions` e acompanhe o workflow `Deploy web to GitHub Pages`.

Quando o deploy terminar, o GitHub mostra a URL publicada no resumo do workflow e em `Settings` -> `Pages`.

## 4. Como testar

Envie mensagem para o numero conectado a partir de outro numero de WhatsApp:

```text
Ola
```

Depois siga o fluxo.

## 5. Estrutura do agente

O comportamento do agente fica separado em:

- `src/agent.js`: fluxo da conversa, sessao do cliente e geracao das respostas
- `src/index.js`: conexao com WhatsApp Web
- `src/budget.js`: regras de deteccao de servico, urgencia e complexidade
- `src/datasheet.js`: salvamento da ficha do cliente para analise e pos-venda
- `src/ai.js`: refinamento opcional da mensagem com OpenAI

Se quiser criar novos comportamentos, o ponto principal para evoluir e `src/agent.js`.

## 6. Webapp de planejamento eletrico

O webapp fica em `web/src` e abre com um projeto exemplo de restaurante.

Principais recursos:

- editor 2D em SVG para criar ambientes e posicionar pontos eletricos
- cadastro de circuitos, fases, cabos, disjuntores, DR e PE
- calculo de carga, corrente, queda de tensao, sugestao de cabo e disjuntor
- quadro de distribuicao, lista de materiais e balanceamento por fase
- alertas para circuito sobrecarregado, queda de tensao alta, PE ausente, DR ausente, desequilibrio de fases e incompatibilidade disjuntor/cabo
- exportacao em JSON, XLSX, PDF e PNG
- persistencia local no navegador

Aviso tecnico: a logica e inspirada em boas praticas da NBR 5410/NR-10 para planejamento e triagem. O dimensionamento final deve ser validado por profissional habilitado, com normas vigentes, levantamento em campo e responsabilidade tecnica quando aplicavel.

## 7. Fluxo atual do agente

O agente agora:

- sempre pede o nome do cliente no inicio
- faz um atendimento mais educado e com melhor texto em portugues
- detecta a intencao inicial do cliente e tenta classificar o tipo de servico
- coleta qualificacao basica do lead: endereco, tipo de local e urgencia
- calcula uma faixa inicial considerando urgencia e multiplicador de complexidade
- conduz um agendamento estruturado: foto/video, dia, horario e confirmacao do diagnostico
- salva uma ficha local do cliente em `data/customers.json`

## 8. IA opcional

Para ativar IA, coloque sua chave no `.env`:

```bash
OPENAI_API_KEY=sua_chave_aqui
```

Sem chave, o bot funciona com respostas padrao.

## 9. Plugins e conectores

Veja `INTEGRATIONS.md` para a ordem recomendada de conexoes: GitHub, OpenAI Developers, Calendar, Email, Drive, Notion e Canva.

## 10. Descoberta por IA e agentes

O site publica arquivos para assistentes entenderem o negocio e o contato:

- `/llms.txt`: resumo do site, servicos, area atendida e regras para agentes.
- `/agent.json`: perfil estruturado com WhatsApp, mapa, servicos e campos de lead.
- `/robots.txt`: aponta para os arquivos acima.

O `index.html` tambem inclui JSON-LD do tipo `Electrician` para buscadores e agentes.

## Aviso importante

Este projeto usa WhatsApp Web via biblioteca nao oficial. Para operacao comercial robusta e em escala, o ideal e migrar depois para WhatsApp Business Platform/API oficial.
