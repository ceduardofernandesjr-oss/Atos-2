# ATOS 2

*De volta à doutrina dos apóstolos* — Bíblia, planos de leitura, devocionais, artes com versículos, assistente de estudo, quiz bíblico e mural de curiosidades (com as 95 Teses de Lutero).

**App:** https://ceduardofernandesjr-oss.github.io/Atos-2/

- `app/` — o aplicativo (PWA em JavaScript puro). É o que vai para o GitHub Pages.
- `docs/arquitetura-e-registro.md` — decisões, fontes, licenças e registro do desenvolvimento.
- `docs/schema.sql` — banco no Supabase (contas, sincronização, conteúdo editorial).
- `ferramentas/` — conversores e verificadores das traduções e das fotos.
- `test/` — testes: `node --test test/*.test.js` (motores) e `node test/e2e.js` (navegador, com Playwright e o app servido em `localhost:8765`).

## Textos bíblicos e licenças

- Bíblia Livre (BLIVRE) — CC BY 3.0 BR, © Diego Santos, Mario Sérgio e Marco Teles.
- Almeida 1911 e Almeida 1911 com ortografia atualizada — domínio público (Projeto Gutenberg).
- Biblica® Open Nova Bíblia Viva — CC BY-SA 4.0. Biblica® é marca registrada da Biblica, Inc.
- Fotos de fundo — Pixabay (Licença de Conteúdo do Pixabay): usadas dentro do app; não redistribua as imagens isoladamente.
- 95 Teses — tradução própria a partir do texto latino de 1517 (domínio público).
