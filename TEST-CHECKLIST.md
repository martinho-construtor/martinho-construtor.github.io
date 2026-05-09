# 🧪 Checklist de Testes Locais

## Pré-requisito
```bash
npm run web
```
Acesse: http://localhost:5173

---

## ✅ Teste 1: Hero + Services Grid (Home)
- [ ] Página carrega em `http://localhost:5173/#` ou `http://localhost:5173/`
- [ ] Hero section visível com "Serviços elétricos e manutenção em Porto Alegre"
- [ ] 8 cards de serviços exibidos (disjuntor, tomada, chuveiro, quadro, iluminação, ar, reforma, comércio)
- [ ] Botão "Chamar no WhatsApp" abre wa.me
- [ ] Botão "Calcular meu quadro elétrico" leva para #app

---

## ✅ Teste 2: Floating WhatsApp Button
- [ ] Botão verde com ícone WhatsApp visível no canto inferior direito (em todas as páginas)
- [ ] Clique abre WhatsApp com mensagem inicial

---

## ✅ Teste 3: QuoteForm + Lead Capture
1. Preencher formulário na PromoPage (seção "Entre em contato"):
   - [ ] Nome: "João Silva"
   - [ ] Telefone: "85 98888-8888"
   - [ ] Bairro: "Centro"
   - [ ] Serviço: "Disjuntor desarmando"
   - [ ] Urgência: "Esta semana"
   - [ ] Descrição: "Teste de lead"
   - [ ] Checkbox de fotos: marcar
   - [ ] Clique em "Falar no WhatsApp"

2. Validar:
   - [ ] WhatsApp abre com mensagem formatada (nome, telefone, serviço, etc.)
   - [ ] Mensagem começa com `*Orçamento para Martinho Construtor*`

---

## ✅ Teste 4: Dashboard + PIN Protection
1. Acessar `http://localhost:5173/#dashboard`
2. Validar tela de login:
   - [ ] Titulo "Acesso ao Painel"
   - [ ] Campo de PIN
   - [ ] Mensagem: "Para demo, deixe vazio ou use: 1234"

3. Acessar painel (deixar vazio ou digitar 1234):
   - [ ] Dashboard carrega
   - [ ] Exibe: "Leads Hoje", "Receita Estimada", "Taxa de Conversão"
   - [ ] Botão "Sair" no topo direito
   - [ ] Tabela mostra lead criado no Teste 3 (João Silva)
   - [ ] Lead deve aparecer com status "Novo"

---

## ✅ Teste 5: Dashboard Links (Navegação)
- [ ] PromoPage footer tem link "Painel de leads" → leva a #dashboard
- [ ] LandingPage footer tem link "Visualizar painel de leads →" → leva a #dashboard

---

## ✅ Teste 6: Google Review CTA
- [ ] No dashboard, existe seção "Gostou do serviço? Deixe uma avaliação!"
- [ ] Botão "⭐ Avaliar no Google" visível
- [ ] Clique abre Google Review em nova aba (link correto)

---

## ✅ Teste 7: Calculator → WhatsApp Export
1. Acessar `http://localhost:5173/#app` (calculator)
2. Criar circuitos (auto-gerar é mais rápido):
   - [ ] Botão "Gerar circuitos pelos pontos" funciona
   - [ ] Na seção "Exportar", botão WhatsApp com ícone aparece
   - [ ] Clique abre WhatsApp com resumo do projeto (potência, corrente, circuitos)

---

## ✅ Teste 8: SEO Tags
1. Abra DevTools (F12) → Elements
2. Procure na `<head>`:
   - [ ] `<title>` contém "Martinho Construtor | Eletricista"
   - [ ] `<meta name="description">` existe e tem conteúdo sobre serviços
   - [ ] `<meta property="og:title">` existe
   - [ ] `<meta property="og:description">` existe

---

## ✅ Teste 9: Landing Page Registration
1. Acessar `http://localhost:5173/#landing`
2. Preencher formulário de registro:
   - [ ] Nome: "Maria Santos"
   - [ ] WhatsApp: "85 99999-9999"
   - [ ] Clique em "Entrar no webapp"
   - [ ] Deverá redirecionar para #app

---

## ✅ Teste 10: localStorage Persistence
1. Abra DevTools (F12) → Application → LocalStorage
2. Verifique:
   - [ ] Chave `martinho_leads` contém array de leads (JSON)
   - [ ] Último lead criado está lá com status "new"
   - [ ] Chave `dashboard_auth` mostra autenticação

---

## 🎯 Fluxo Completo (End-to-End)
```
1. Home (#) 
   ↓
2. Preencher QuoteForm → WhatsApp
   ↓
3. Ir para Dashboard (#dashboard)
   ↓
4. Ver lead criado na tabela
   ↓
5. Ir para #app (Calculator)
   ↓
6. Exportar para WhatsApp
```

---

## 📝 Bugs / Issues Encontrados
(Adicione aqui qualquer problema encontrado durante os testes)

```
[ ] Item:
[ ] Item:
```

---

## ✅ Status Final
- [ ] Todos os testes passando
- [ ] Pronto para deploy
