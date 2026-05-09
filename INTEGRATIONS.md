# Plugins e conectores recomendados

Este guia prepara o terreno para conectar o projeto aos plugins essenciais de desenvolvimento, atendimento e crescimento do negocio.

## Ordem recomendada

1. **GitHub**
   - Use para hospedar o repositorio, revisar mudancas, abrir issues e acompanhar historico.
   - Antes de conectar: confirme que `.env`, `.wwebjs_auth/`, `.wwebjs_cache/`, `node_modules/` e `data/customers.json` nao entram no Git.
   - Fluxo sugerido: branch `main` estavel, issues para melhorias, PRs para alteracoes maiores.

2. **OpenAI Developers**
   - Use para consultar documentacao oficial, revisar uso da API e evoluir `src/ai.js`.
   - Chave continua somente no `.env` como `OPENAI_API_KEY`.
   - Bom para decidir modelos, prompts e proximos passos de IA no bot.

3. **Calendario**
   - Status atual: Google Calendar pulado por enquanto porque a conexao nao completou.
   - Alternativa recomendada agora: usar Outlook Calendar, ou manter agenda manual ate tentar Google novamente.
   - Use para agendar visitas tecnicas, diagnosticos e retornos.
   - Crie um calendario chamado `Martinho - Visitas tecnicas`.
   - Dados padrao do evento: nome, WhatsApp, bairro, tipo de servico, urgencia e observacoes.

4. **Email**
   - Status atual: se Google continuar instavel, priorize Outlook Email.
   - Use para follow-up, envio de orcamentos e registro de conversas formais.
   - Crie marcadores/pastas: `Leads`, `Orcamentos enviados`, `Aguardando retorno`, `Clientes`.
   - Prepare modelos: primeiro contato, envio de orcamento, confirmacao de visita e pos-atendimento.

5. **Arquivos**
   - Status atual: Google Drive fica para depois, junto com a proxima tentativa do Google.
   - Alternativa recomendada agora: pasta local organizada ou SharePoint, se usar Microsoft.
   - Use para organizar fotos, PDFs, planilhas e orcamentos por cliente.
   - Estrutura sugerida:
     - `Martinho Construtor/Clientes/Nome do cliente/`
     - `Martinho Construtor/Modelos/`
     - `Martinho Construtor/Orcamentos enviados/`

6. **Notion**
   - Use como painel leve de CRM e base de conhecimento.
   - Tabelas sugeridas: `Leads`, `Orcamentos`, `Visitas`, `Servicos frequentes`, `Checklist eletrico`.
   - Bom para padronizar atendimento e criar playbooks.

7. **Canva**
   - Use para posts, panfletos, cartoes, banners e materiais comerciais.
   - Prepare kit de marca: nome, cores, WhatsApp, mapa/localizacao, lista de servicos e chamadas principais.

## Fluxo operacional alvo

- Cliente entra pelo site ou WhatsApp.
- Lead e qualificado com nome, bairro, servico, urgencia e fotos.
- Visita entra no Calendar.
- Fotos, proposta e PDF ficam no Drive.
- Follow-up sai por Gmail/Outlook.
- Notion acompanha status do lead e historico.
- GitHub organiza evolucao tecnica do bot e da landing page.

## Contas e dados para deixar prontos

- Conta GitHub para o repositorio.
- Conta Google ou Microsoft que sera usada para email e agenda.
- Numero de WhatsApp em formato internacional, salvo em `VITE_WHATSAPP_PHONE`.
- Link do Google Maps e link de avaliacao.
- Pasta principal no Drive ou SharePoint, se for usar Microsoft no futuro.
- Workspace no Notion e identidade visual basica no Canva.

## Cuidados

- Nunca subir `.env`, sessao do WhatsApp, cache local ou dados reais de cliente.
- Usar repositorio privado enquanto houver dados sensiveis no historico local.
- Separar automacao comercial de dados tecnicos: o bot pode qualificar o lead, mas orcamento final deve continuar validado por profissional habilitado.
