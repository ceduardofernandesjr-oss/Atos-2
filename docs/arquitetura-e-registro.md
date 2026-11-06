# ATOS 2 — Arquitetura e registro de desenvolvimento

Prévia: https://claude.ai/artifact/KM3ZGnNsWwF3RRgAJbGkri (privada; o proprietário compartilha pelo próprio claude.ai)
Última atualização: 06/11/2026 (v1.9 — estudo teológico: grego e hebraico, doutrinas e controvérsias, modo Bereano, níveis de profundidade)
Versão publicada: https://ceduardofernandesjr-oss.github.io/Atos-2/ (repositório `ceduardofernandesjr-oss/Atos-2`; o Pages publica o ramo `gh-pages`, cópia da pasta `app/`; o ramo `main` guarda o projeto e roda os testes no GitHub Actions)

## 1. Decisões

| Decisão | Motivo |
|---|---|
| Texto bíblico da **Bíblia Livre (BLIVRE)**, edição Textus Receptus, arquivos-fonte de 12/01/2025 | ACF, KJA e NTLH têm direitos reservados (SBTB; Abba Press/SBIA; SBB). A BLIVRE é completa, de base Almeida (1819) e tem licença CC BY 3.0 BR. ACF/KJA/NTLH aparecem como “licença pendente” e entram por importação quando autorizadas. |
| Bíblia em arquivos estáticos (um JSON por livro) | 4 MB, carregados sob demanda e guardados no aparelho para leitura sem internet. O banco guarda só dados do usuário. |
| App em JavaScript sem framework, motores puros testados em Node | Mesmo padrão do ACS Digital: regra de negócio em funções puras (referências, planos, busca, arte, sincronização). |
| **Local primeiro**, sincronização plugável | (v1.8) Projeto Supabase `atos2` (sa-east-1, id `cxzmijbcoxbicsfchkac`) criado depois de pausar o `acs-digital` a pedido do usuário em 05/11/2026 (restaurável por 90 dias). Antes: Supabase sem vaga (limite de 2 projetos gratuitos). Os dados vão primeiro ao IndexedDB; na prévia sincronizam com o banco do claude.ai por usuário; na produção, o mesmo contrato vai para o Supabase (`schema.sql`). |
| A IA cria **só o fundo** das artes | O versículo é composto pelo editor a partir da tradução. O SVG da IA passa por saneamento: sem `<text>`, scripts, links ou imagens externas. |
| Conteúdo de IA é identificado e revisado antes de publicar | Devocionais e reflexões de IA nascem como rascunho na área editorial (invisível aos leitores). Publicar exige marcar “Revisei o conteúdo”; o leitor vê o aviso “redigido com apoio de IA e revisado”. |
| Referências sempre validadas | Toda referência (versículo do dia, temas, personagens, galeria, planos, estudos com IA, devocionais) é conferida contra a contagem real de capítulos e versículos. |

## 2. Texto bíblico — fonte, conversão e correções

- Fonte: repositório oficial `github.com/blivre/BibliaLivre`, pasta `textos/f4/geral` (commit de 12/01/2025).
- Conversor próprio (`ferramentas/converter_blivre.py`) gera a edição TR a partir dos arquivos-base, porque o **gerador oficial tem defeitos** que corrompem o texto. Diferenças corrigidas em relação à saída oficial `tr/` (palavras):
  - At 2:38 — a saída oficial cortava “pecados; e recebereis o dom do Espírito Santo” (linha com marcação condicional no meio).
  - Rm 5:1 — vazava “RP, TR, NA e SBL: temos” no texto.
  - Mt 5:44, Mt 27:35, Lc 9:56 — notas de tradução vazavam para dentro do versículo.
  - Mt 14:22 (“seus”), Mc 10:46 (“mendigando”), Lc 4:8 (“escrito:”) — palavras do TR perdidas por erros de grafia nos marcadores.
- Correções de marcação (nenhuma palavra alterada): Mc 5:19 sem marcador de versículo; Lc 14:4 e Sl 144:14 notas mal fechadas; Jo 16:14 itálico aberto duas vezes; Lc 21:1, Lc 7:28 fechamentos sem barra; chaves soltas em Mc 14:70 e Rm 16:20.
- **At 28:29** não tem texto nos arquivos-fonte atuais da BLIVRE (TR). Não foi preenchido com outra revisão, para não misturar edições: aparece com aviso.
- **Gn 14:20** está incompleto na fonte: falta “E deu-lhe o dízimo de tudo” (presente no hebraico, na Almeida 1911 e na ONBV). Texto mantido; aviso (!) no leitor (v1.9, encontrado pela verificação das doutrinas). Vale avisar os mantenedores da BLIVRE, junto com Gn 19:26.
- **Gn 19:26** traz “estátua de sai” na fonte (provável erro de digitação de “sal”). O texto não foi alterado; o leitor mostra um aviso (!) — tabela `AVISOS` em `converter_blivre.py` (v1.7, encontrado pela verificação do quiz).
- Verificação (`ferramentas/verificar_biblia.py`): 66 livros, 1.189 capítulos, 31.102 versículos; versificação idêntica à KJV em todos os capítulos; ida e volta palavra por palavra sem divergência.
- Crédito exigido pela licença aparece em Perfil › Sobre e no seletor de traduções; artes e citações levam a sigla da tradução usada.

### 2.1 Almeida Revista e Corrigida, Lisboa, 1911 (ALM1911) — 03/11/2026

- Fonte: Projeto Gutenberg, ebook 62383 (EPUB enviado pelo usuário). Domínio público. Grafia de 1911 mantida (Christo, baptizado, Egypto, elle).
- Conversor `ferramentas/converter_almeida1911.py` (mapa de livros em `ferramentas/almeida1911_livros.json`): números de página retirados; referências cruzadas (nota tipo `ref`, mais de 20 mil) e leituras alternativas (tipo `alt`) viram notas; títulos de salmos vão para `titulos`; sumários de capítulo e letras do acróstico (Sl 119, Lm) viram cabeçalhos `cab`.
- Correção de estrutura: Os 11:5 vinha colado ao v. 4 depois de uma quebra de página na fonte; separado (nenhuma palavra alterada).
- Verificação (`ferramentas/verificar_traducao.py … gutenberg`): 31.105 versículos, nenhum vazio, ida e volta palavra por palavra sem divergência. Versificação difere da KJV só em Jz 5, 1Sm 20, 1Rs 22, 2Co 13 e 3Jo (numeração da própria edição).
- Pesquisa: na ALM1911 a busca aceita a grafia de hoje (“cristo” → Christo, “batismo” → baptismo, “igreja” → egreja, “fariseus” → phariseos, “ano” → anno, “salmo” → psalmo), com o destaque no lugar certo (`A2Busca` opção `grafiaAntiga`).
- Referências cruzadas ficam ocultas por padrão; ativar em Aparência da leitura.

### 2.1.1 Almeida 1911, ortografia atualizada (ALM1911AT) — 03/11/2026

- Edição derivada da ALM1911 (domínio público), gerada por `ferramentas/atualizar_grafia_1911.py`. Só a grafia muda (pt-BR, Acordo de 1990); palavras, ordem, pontuação, itálicos e versificação de 1911 ficam iguais — conferido em todos os versículos pelo teste `traducoes.test.js`.
- Como decide: vocabulário atual da BLIVRE + ONBV → tabela manual → regras (ph→f, th→t, y→i, consoantes dobradas, ct/pt mudos, ch grego, m antes de consoante, -ae/-aes → -ai/-ais, -eo → -eu, acentos) validadas no vocabulário → alinhamento com o mesmo versículo da BLIVRE (nomes próprios: David → Davi, Moysés → Moisés; e variantes de mesma pronúncia: visinho → vizinho) → dicionário pt-BR do LibreOffice (só para confirmar formas). Palavras de grafia antiga que aparecem 1–2 vezes nos textos modernos não contam como atuais (erros de digitação).
- Também: ênclise/mesóclise (vel-o-hei → vê-lo-ei, louvar-te-hei → louvar-te-ei), contrações (d’elle → dele, d’Israel → de Israel, lh’o → lho), crase (á → à), teem → têm, letras do Sl 119 e Lm como na BLIVRE (Aleph → Álefe), referências cruzadas com as abreviações do app (Psa. 132.11 → Sl 132:11). Posições das notas recalculadas.
- Resultado: 6.551 formas diferentes atualizadas (≈ 61 mil ocorrências). Relatório completo em `ferramentas/relatorio_grafia_1911.tsv` (antes, depois, motivo, ocorrências) para revisão.
- Limites conhecidos: palavras raras sem equivalente no vocabulário ficam como em 1911; algumas palavras antigas que ainda existem no dicionário (ex.: derribar, alimpar) foram mantidas, porque trocá-las seria mudar a palavra, não a grafia.
- Corrigido junto: os títulos “VELHO/NOVO TESTAMENTO” apareciam como cabeçalho de Gn 1:1 na ALM1911 (conversor ajustado).

### 2.2 Biblica® Open Nova Bíblia Viva (ONBV) — 03/11/2026

- Fonte: pacote USFM oficial `poronbv_usfm.zip` (enviado pelo usuário). Licença CC BY-SA 4.0: texto sem alteração de palavras, título mantido, aviso da marca Biblica® no crédito, adaptação de formato sob a mesma licença.
- Conversor genérico `ferramentas/converter_usfm.py` (serve também para ACF/NTLH/KJA quando houver licença e arquivo USFM).
- Verificação: 31.105 versículos, nenhum vazio, ida e volta sem divergência; versificação difere da KJV só em Jz 5, 1Sm 20 e 3Jo.

### 2.3 Como as traduções convivem no app

- A tradução escolhida (Bíblia › sigla ou Perfil) passa a ser a padrão do leitor, do versículo do dia, da pesquisa, dos devocionais, das artes novas e do “Guardar sem internet”. Uma arte guarda a tradução com que foi feita.
- Nunca se mistura texto de traduções: um versículo que não existe na numeração de uma edição aparece como tal no comparador.

## 3. Estrutura

```
app/
  index.html, css/app.css, manifest.webmanifest, sw.js, icones/, fundos/fotos/ (25 fotos × celular, computador, miniatura)
  biblia/{blivre,alm1911,alm1911at,onbv}/indice.json + <LIVRO>.json   caps[c][v]; {} = itálico; notas {t,o,tipo}; titulos; cab (cabeçalhos)
  js/nucleo/  referencias.js  conteudo.js  planos.js  busca.js  arte.js  sinc.js  quiz.js  mural.js  assistente.js  originais.js  doutrinas.js   (puros, testados)
  originais/  <LIVRO>.json (palavras por versículo), lexico-g.json, lexico-h.json, morfologia.json   (≈ 29 MB, carregados sob demanda)
  js/ui.js  dados.js  biblia.js  app.js
  js/telas/   inicio  cartao  leitor  pesquisa  fotos  estudio  biblioteca  planos  devocionais  perfil  explorar (assistente, quiz, mural)  teologia (originais, doutrinas, Bereano)
ferramentas/  converter_originais.py  preparar_fotos.py  converter_blivre.py  verificar_biblia.py  converter_usfm.py  converter_almeida1911.py  verificar_traducao.py  atualizar_grafia_1911.py  metadados/
test/         nucleo.test.js (16)  traducoes.test.js (7)  quiz.test.js (8)  teologia.test.js (3)  e2e.js (102)  e2e-banco.js (20)  e2e-nuvem.js (12, Supabase falso)
docs/         schema.sql (Supabase)
```

### Dados do usuário (coleções)
`favoritos` (id = JHN.3.16), `destaques`, `notas`, `colecoes`, `estudos`, `planos` (id = plano), `artes` (spec + miniatura), `modelos`, `galeriaFav`, `devSalvos`, `devLidos`, `leitura` (última, capítulos lidos, posição do áudio), `historico` (um documento por mês), `vdia`, `perfil`, `config`, `assistente` (até 30 estudos/pesquisas da IA, com a conversa), `quiz` (estatísticas, perguntas vistas, desafios do dia). Coleções com `_` (fotos, rascunho da arte) ficam só no aparelho.

### Banco da versão publicada (Supabase, v1.8)
- `js/config.js` (URL e chave publicável), `js/nuvem.js` (conta e adaptador com o mesmo formato do banco da prévia), `js/vendor/supabase.js` (supabase-js 2.119, MIT, carregado só fora do claude.ai).
- Tabelas: `perfis` (papel leitor/editor/administrador, criado por gatilho no cadastro), `convites_papel` (e-mail → papel, só pelo SQL/painel), `documentos_usuario` (gravação pela função `salvar_documento_usuario`, que só aceita versão mais nova), `conteudo_editorial` (áreas devocionais, reflexoes, galeria, rascunhos; devocional de IA só publicado com `revisadoEm`). Papel conferido por `privado.eh_editor()` (esquema não exposto).
- RLS conferida por SQL em 05/11/2026: leitor não publica, não grava em outra conta, não se promove a administrador; anônimo não chama a função de gravação e não vê rascunhos.
- Os 12 rascunhos de devocional foram copiados da prévia para `conteudo_editorial` (área rascunhos).
- Conta no app (Perfil › Conta): criar conta (senha com 8+ caracteres, letras e números; confirmação por e-mail), entrar, esqueci minha senha (link → nova senha), trocar senha, sair (opção de apagar a cópia do aparelho). Sem conta, tudo funciona só no aparelho; ao entrar, o que já existia no aparelho sobe para a conta.
- Fora do claude.ai não há IA: botões de IA (fundos, rascunhos, estudo com IA) somem e o assistente funciona em **modo guia** — temas curados + busca no texto; para cada passagem: outras traduções, ficha do livro, capítulo ao redor com destaque, notas da tradução, referências cruzadas da ALM1911AT (`A2Assistente.refsDaNota1911`, >97% válidas em João), temas e personagens, obras para aprofundar.
- Teste `test/e2e-nuvem.js` usa um Supabase falso (`test/supabase-falso.js`) com dois “aparelhos”: login, senha errada, envio do que estava no aparelho, sincronização e tempo real nos dois sentidos, exclusão, leitor sem permissão de publicar, sair apagando a cópia local, cadastro com senha fraca e confirmação por e-mail.
- Correção geral (v1.8): `UI.confirmar` sempre respondia “não” (o fechar da folha resolvia antes do botão). Afetava apagar dados, excluir itens e outras confirmações.

### Banco da prévia (claude.ai)
- `data/users/<id>/<coleção:id>` — privado por pessoa.
- `pub/conteudo/{devocionais,reflexoes,galeria}` — leitura de todos, escrita só proprietário/editores.
- `editorial/rascunhos/devocionais` — leitura e escrita só proprietário/editores.
- Regras conferidas no servidor: colaborador não publica, não lê rascunhos e não grava no espaço de outra pessoa.

## 4. Funcionalidades da v1

- **Início:** versículo do dia (ciclo de 371 passagens sem repetição; histórico dos anteriores), reflexão editorial, favoritar, compartilhar como imagem no mesmo visual do cartão (`js/telas/cartao.js`: Cartão com altura do texto, Feed 4:5, Stories e Quadrado; itálicos preservados; marca ATOS 2 no rodapé) ou só o texto, criar arte; atalhos de última leitura, plano, devocional e estúdio; lembretes.
- **Bíblia:** livros/capítulos, ir para referência, seleção de versículos, destaques (5 cores), favoritos, anotações, copiar, compartilhar (WhatsApp/cópia), comparar traduções, criar arte, notas dos tradutores, títulos dos salmos, itálicos, marcar capítulo lido, tamanho/fonte/tema, leitura em voz alta (voz do aparelho, velocidade, continua de onde parou).
- **Pesquisa:** palavras inteiras sem acento, variações, “expressão exata”, referência, escopo (AT/NT/Evangelhos/Atos e cartas), 14 temas e 32 personagens curados.
- **Planos:** 8 planos (Bíblia 365, NT 90, Evangelhos 30, Salmos 30, Provérbios 31, Conhecendo Jesus, Fundamentos da fé, Atos 28); cronograma equilibrado por versículos; iniciar, pausar (dias de pausa não contam atraso), retomar, marcar, atraso, término previsto, lembrete, leitura guiada com “Concluir dia”; vários ao mesmo tempo.
- **Devocionais:** 9 seções, 12 categorias, do dia, arquivo, busca por tema, salvos, compartilhar, arte; edição com rascunho de IA, revisão obrigatória e publicação agendada. 12 rascunhos iniciais (um por tema, de 03 a 14/11) aguardam revisão.
- **Estúdio:** versículo exato ou texto livre; fundo: as 25 fotos enviadas (Pixabay) ou Criar com IA (v1.5: removidos os fundos desenhados, cor/degradê e foto própria a pedido do usuário; artes antigas com esses fundos passam a usar a foto do píer); 6 fontes, cores, tamanho automático, alinhamento, largura, entrelinha, maiúsculas, sombra, aspas, escurecer fundo; arrastar o texto; formatos Feed 1080×1350, Stories 1080×1920, WhatsApp 1080×1080, Facebook 1200×630 e 1080×1080; baixar PNG, compartilhar, salvar, editar, duplicar, salvar como modelo; 25 modelos prontos, um por foto.
- **Papéis de parede Full HD:** formatos Papel de parede do celular 1080 × 1920 e do computador 1920 × 1080, com as fotos; 31 modelos (25 celular, 6 computador); no celular o texto fica entre 31% e 86% da altura, fora do relógio e dos atalhos, com guia tracejada só na prévia; galeria “Papéis de parede” com 12 versículos. (As 12 cenas desenhadas da v1.3 foram retiradas na v1.5.)
- **Fotos de fundo (v1.4):** 25 fotos do Pixabay enviadas pelo usuário (`ferramentas/preparar_fotos.py` → `app/fundos/fotos/<id>-cel.jpg` 1080×1920, `-pc.jpg` 1920×1080, `-mini.jpg` 360×640; ≈ 15,5 MB). Recortes por foto; o letreiro de banco da foto da cidade e as capas de livros da foto da vela ficaram de fora (a da vela não tem versão de computador). Ficaram fora do app: a foto da fogueira (pessoas reconhecíveis) e a do rapaz pulando (logotipo no tênis). Cada foto tem cor de texto, escurecimento e posição sugeridos. Licença de Conteúdo do Pixabay: sem atribuição obrigatória, mas proíbe distribuir a imagem sozinha — o app não baixa nem compartilha uma arte com foto sem texto; crédito em Perfil › Sobre e no painel. Galeria “Fotos da criação”: 16 versículos combinados com as fotos.
- **Galeria:** 14 categorias, 92 artes prontas renderizadas na hora, favoritar, baixar, compartilhar, personalizar.
- **Biblioteca:** favoritos com coleções, destaques por cor, anotações, estudos (manual ou montado com IA com referências conferidas), histórico, pesquisa em tudo o que foi salvo.
- **Assistente bíblico (v1.7, `#assistente`; também “Entender” na seleção de versículos):** pesquisa por tema (passagens com motivo, sugestões) e estudo de passagem (resumo, contexto histórico, cultura e costumes, sentido no texto, palavras-chave, passagens relacionadas, leituras divergentes entre cristãos, aplicação, perguntas, ficha do livro, obras para aprofundar) e perguntas de continuação. Segurança: a IA (capacidade `sample`) só lê a Bíblia pelas ferramentas do app — `ler_passagem`, `buscar_texto`, `introducao_livro` (66 fichas próprias, com cautela onde há debate) e `referencias_cruzadas` (notas da ALM1911); não escreve o texto bíblico (sempre o da tradução); referências inventadas são descartadas e informadas; obras só de lista fixa de 10 (Vida Nova, Vida, Mundo Cristão, Josefo, Eusébio), apresentadas como sugestão de leitura, nunca como citação; regras contra inventar datas, nomes e citações; neutralidade em temas em que cristãos divergem; sinal de crise abre acolhimento com CVV 188 e SAMU 192. Estudos ficam guardados (abrem sem nova chamada), podem ir para Biblioteca › Estudos e ser compartilhados.
- **Quiz bíblico (v1.7, `#quiz`):** 118 perguntas em 5 temas (Antigo Testamento, Evangelhos, Atos e cartas, Quem disse?, Números da Bíblia) e 3 níveis; cada resposta tem referência e palavras-chave conferidas no texto da BLIVRE pelo teste (`quiz.test.js`), e as citações nas perguntas seguem a redação da BLIVRE. Desafio do dia (5 perguntas, iguais para todos), rodada livre de 10 com filtros (prefere perguntas não vistas), versículo mostrado após cada resposta, pontuação com bônus de nível e sequência, resultado compartilhável, estatísticas.
- **Mural de curiosidades (v1.7, `#mural`):** 12 curiosidades históricas com fontes conferidas na web em 05/11/2026 (Almeida 1681/1748–1753/1819, capítulos e versículos, Septuaginta, Vulgata, Gutenberg, Qumran, Wartburg, Worms, o debate sobre a afixação das teses, Bereia, Antioquia), curiosidade do dia; **95 Teses** em tradução própria do latim de 1517 (domínio público) conferida com a tradução inglesa de 1915 (domínio público), com contexto histórico, 10 grupos temáticos, busca, glossário, passagens aludidas e compartilhamento; **Números da Bíblia** calculados da tradução escolhida (livros, capítulos, versículos, maior/menor capítulo, capítulo e versículos do meio — Sl 117 e Sl 103:1-2 na BLIVRE —, versículo mais longo e mais curtos, contador de palavras).
- **Estudo teológico (v1.9; sugestão do usuário, etapa 2 “inteligência teológica”):** o assistente passou a se chamar “Assistente Atos 2” e tem quatro modos — Estudar, Modo Bereano, Doutrinas, Grego e hebraico — e três níveis (básico, intermediário, avançado). Tudo funciona sem IA; na prévia do claude.ai, a IA usa os mesmos dados por ferramentas.
  - **Grego e hebraico:** dados do STEPBible (Tyndale House; CC BY 4.0) convertidos por `ferramentas/converter_originais.py`: grego só com as palavras do Textus Receptus (base da BLIVRE/Almeida), hebraico de Leningrado (Qere), sem acentos de cantilação, Unicode NFC. 441 mil palavras, 66 livros; só 10 versículos sem dados (Js 21:36-37, Jo 7:53, Rm 16:25-27, 2Co 13:13-14, Fp 1:16-17, por diferenças de edição/versificação). Morfologia traduzida para o português (4.222 códigos). Léxicos breves com sentido básico em inglês e ocorrências (até 150 por palavra). 87 palavras-chave com explicação em português redigida pelo ATOS 2 (`A2Originais.TERMOS`), conferidas contra o lema do léxico. Interlinear (seleção na Bíblia › “Original”), ficha da palavra com ocorrências e texto em português, busca por palavra em português, Strong, lema ou transliteração.
  - **Doutrinas e controvérsias** (`A2Doutrinas`): 19 temas (Trindade, batismo nas águas e com o Espírito, dons, salvação, predestinação e livre-arbítrio, justificação, fé e obras, santificação, arrependimento, dízimos, sábado, lei e graça, segunda vinda, milênio, arrebatamento, juízo final, céu e inferno, estado dos mortos), cada um com definição, passagens com palavra conferida na BLIVRE, contexto, leituras das tradições com textos, objeções e conclusão que começa por “Explícito no texto”.
  - **Modo Bereano:** sem IA — verifica se a frase está escrita, busca passagens com as palavras principais, liga ao tema curado e propõe perguntas de exame; com IA — classifica (explícito, conclusão, debatido, sem base clara, contraria o texto), textos a favor e que limitam (conferidos), contexto, leituras, e sempre mostra a conferência feita pelo app abaixo.
  - **Exegese no guia:** estrutura do capítulo pelos subtítulos da Almeida 1911, palavras importantes no original, texto interlinear (avançado), doutrinas ligadas ao capítulo. Com IA (avançado): seção de exegese (contexto literário e canônico, estrutura, destinatários e intenção) e palavras com Strong validado contra a passagem.
  - Limites: sem IA no site não há sermões, respostas abertas nem exegese redigida; glosas e tradução palavra por palavra em inglês; ACF, KJV e NTLH continuam sem licença, por isso o comparador usa BLIVRE, Almeida 1911 e ONBV.
- **Perfil:** nome, foto, estatísticas, tradução preferida, aparência, notificações (5 tipos com horário), sincronização, guardar a Bíblia sem internet, exportar dados, licenças, área editorial.

## 5. Limitações conhecidas da prévia

- Quatro edições ativas (BLIVRE, ALM1911, ALM1911AT, ONBV); ACF, KJA e NTLH aparecem como pendentes de licença.
- Áudio por voz sintética do aparelho; narração licenciada fica para depois.
- Notificações do sistema e instalação como app só na versão publicada (GitHub Pages); na prévia os lembretes aparecem dentro do app.
- Login próprio só na versão publicada; na prévia a conta é a do claude.ai. E-mails de confirmação usam o envio padrão do Supabase (limite baixo por hora; textos em inglês até personalizar os modelos).
- Fundos limitados às 25 fotos da biblioteca e ao Criar com IA (sem foto própria nem cor sólida, por decisão do usuário).

## 6. Próximos passos

1. (Feito em 05/11: repositório `Atos-2`, Pages pelo ramo `gh-pages`.)
2. No Supabase: Authentication › URL Configuration — Site URL e Redirect URL = endereço do GitHub Pages; informar o e-mail do administrador (`convites_papel`).
3. Pedir autorização à SBTB (ACF), SBB (NTLH) e ao detentor da edição King James escolhida; ao receber os arquivos USFM, usar `converter_usfm.py` e ativar a tradução.
4. Revisar e publicar os 12 devocionais iniciais; definir o calendário editorial.
5. Revisar as 95 Teses traduzidas, as fichas dos livros, as 87 explicações de palavras e os 19 temas de doutrina (redação própria).
6. Etapas 1 e 3 da sugestão do assistente (histórico de conversas completo, sermões, devocionais, exportar PDF) — dependem de IA no site para a parte gerada.
7. Área de estudos doutrinários por tema (batismo, salvação, arrependimento, Espírito Santo, igreja primitiva, perseverança).
