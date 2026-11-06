# ATOS 2 — Jornada da Sabedoria e banco de perguntas (v2.7, 06/11/2026)

## Banco de perguntas
- **1.087 perguntas cadastradas** em `app/quiz/<seção>.json` (índice em `app/quiz/indice.json`) e na tabela `public.sabedoria_perguntas` do Supabase.
- **Seções (10):** Pentateuco 140 · Históricos 153 · Poéticos e sabedoria 95 · Profetas maiores 78 · Profetas menores 91 · Evangelhos 188 · Atos 80 · Cartas de Paulo 127 · Cartas gerais 83 · Apocalipse 52.
- **Dificuldades:** Fácil 153 · Intermediário 448 · Difícil 336 · Especialista 150.
- **Formatos:** múltipla escolha 667 · complete o versículo 121 · em qual livro 96 · qual a referência 80 · verdadeiro ou falso 56 · identifique o personagem 32 · quem sou eu 21 · relacione 14.
- **Temas (14):** personagens, mulheres, reis e profetas, discípulos e apóstolos, milagres, parábolas, genealogias, lugares, acontecimentos, doutrinas, ensinamentos de Jesus, profecias, contexto histórico-cultural, conhecimento geral.
- **Cada pergunta tem:** id, seção, tema, dificuldade, formato, pergunta, opções, resposta, referência, livro, capítulo, versículo, explicação e chave de conferência.
- As 118 perguntas antigas foram mantidas com os mesmos ids, para não perder o histórico de quem já jogou.

### Como o banco é conferido
- **Fontes.** As perguntas são escritas em `ferramentas/quiz/fontes/*.js`, e `node ferramentas/quiz/gerar.js` monta os JSON.
- **O gerador recusa uma pergunta quando:**
  - a chave não está no texto da referência na Bíblia Livre;
  - a referência é inválida;
  - há opções repetidas ou a explicação é curta;
  - o texto repete o de outra pergunta.
- **Também avisa** quando duas perguntas têm o mesmo versículo e a mesma resposta.
- **Formatos montados sobre o texto real da BLIVRE:**
  - Complete o versículo: a palavra precisa aparecer uma única vez no versículo.
  - Em qual livro: o trecho precisa existir só naquele livro. Por isso textos repetidos, como Sl 18:2 e 2Sm 22:2, ficam de fora.
  - Qual a referência: o trecho precisa ser exclusivo daquele versículo, e os distratores não podem contê-lo.
- **Capítulos e ordem dos livros:** as respostas são calculadas do índice da BLIVRE.
- **`test/quiz.test.js` refaz a conferência a partir dos JSON publicados.** Ele confere:
  - pelo menos 1.000 perguntas e pelo menos 40 por seção;
  - todas as dificuldades, formatos e temas presentes;
  - nenhum id ou texto repetido;
  - livro, capítulo e versículo válidos;
  - todas as chaves no texto bíblico.
- **Critérios de redação:**
  - nada de versículos ou referências inventados;
  - em temas debatidos (por exemplo, Apocalipse 20 e 13:18), a pergunta trata só do que o texto diz;
  - títulos de salmos e tradições sem base no texto não viraram perguntas.

### Como acrescentar perguntas sem mudar o aplicativo
- **Pelo repositório:** escreva novas linhas numa fonte de `ferramentas/quiz/fontes/` e rode `node ferramentas/quiz/gerar.js`. Depois rode os testes e publique.
- **Pelo banco (editores):** insira uma linha em `public.sabedoria_perguntas` com `origem = 'editor'`.
  - O campo `dados` leva a pergunta completa, no mesmo formato dos JSON.
  - O app carrega essas perguntas ao abrir o quiz com o Supabase configurado.
  - O servidor as aceita na contagem de pontos.

## Sorteio inteligente (`A2Quiz.selecionar`)
- **Peso de cada pergunta:**
  - inédita: 30;
  - só errada: 10;
  - acertada, mas com mais erros do que acertos: 3;
  - já dominada: 0,3.
- **Ajustes ao peso:**
  - pergunta vista nos últimos 3 dias pesa 4 vezes menos;
  - a dificuldade preferida sobe com o nível;
  - seções com mais erros ganham peso;
  - livros que a pessoa leu (pelo histórico) também ganham peso.
- **Montagem da rodada:**
  - nunca entram duas perguntas do mesmo versículo;
  - entram no máximo 3 perguntas do mesmo livro;
  - a rodada vai da mais fácil à mais difícil.
- **Desafio do dia:** 5 perguntas de 5 seções diferentes, iguais para todos.

## Níveis

| Nível | Nome | Pontos | Emblema |
|---|---|---|---|
| 1 | Aprendiz das Escrituras | 0–99 | lâmpada |
| 2 | Discípulo | 100–249 | pergaminho |
| 3 | Conhecedor da Palavra | 250–499 | livro aberto |
| 4 | Servo Fiel | 500–849 | ramo de oliveira |
| 5 | Evangelista | 850–1.299 | pomba |
| 6 | Mestre das Escrituras | 1.300–1.899 | tábuas |
| 7 | Ancião na Palavra | 1.900–2.699 | cajado |
| 8 | Guardião da Palavra | 2.700+ | coroa |

- **Emblemas:** desenhos próprios em SVG, com a moldura evoluindo em quatro etapas:
  1. areia com traço azul;
  2. azul com aro dourado;
  3. aro duplo com pontos;
  4. coroa de louros dourada com estrela.
- **Aviso exibido no painel e na tela de novo nível:** “Os títulos da Jornada da Sabedoria são conquistas simbólicas de conhecimento bíblico. Não representam ordenação, autoridade espiritual nem cargo eclesiástico.”

## Pontos (mesmas regras em `app/js/nucleo/sabedoria.js` e na função SQL)
- **+10 por resposta correta**, só na primeira vez que a pessoa acerta aquela pergunta.
- **+15 a cada 5 acertos seguidos** na mesma rodada, até 6 vezes por dia.
- **+20 por quiz concluído** com 5 ou mais respostas, até 5 por dia.
- **+30 no desafio avançado:** 10 perguntas difíceis ou de especialista, com pelo menos 7 acertos, uma vez por dia.
- **Desafios especiais** ficam na tabela `public.sabedoria_desafios`, que define pontos, número de perguntas, acertos mínimos, seções, dificuldade mínima, período (dia ou único) e datas. Iniciais:
  - Desafio do dia: +25, com 3 acertos em 5;
  - Desafio dos Profetas: +50 uma vez, com 8 acertos em 10;
  - Desafio dos Evangelhos: +50 uma vez, com 8 acertos em 10.
- **Limites:**
  - até 40 rodadas por dia;
  - até 15 respostas por rodada;
  - rodada repetida é recusada (o id é gerado no aparelho e é a chave primária);
  - pergunta inexistente, repetida na rodada ou com data futura é recusada.
- **Rodadas enviadas com mais de 1 dia de atraso** (por exemplo, jogadas sem internet) contam só os acertos inéditos: não valem bônus nem dias seguidos.
- **Pontos são cumulativos** e o nível nunca regride (`nivel = greatest(nivel, nível dos pontos)`).

## Medalhas
| Medalha | Como conquistar |
|---|---|
| Primeiro Passo | 1º quiz |
| Mente Atenta | 10 acertos seguidos |
| Estudioso | 50 quizzes |
| Conhecedor | 100 respostas corretas |
| Perseverante | 7 dias seguidos |
| Dedicado | 30 dias seguidos |
| Guardião | nível 8 |

- Cada medalha aparece bloqueada (com cadeado e progresso, como “3 de 10”) ou conquistada (com a data).

## Domínio bíblico
- **Por seção, separado do nível:** mostra a porcentagem das perguntas da seção já acertadas ao menos uma vez e a taxa de acertos nas tentativas.
- **Graus:** Iniciante (até 14%), Em formação (15%), Intermediário (40%), Avançado (70%), Domínio pleno (90%).

## Telas
- **Quiz:**
  - cartão da jornada com emblema, nível, pontos, barra animada, pontos que faltam e medalhas;
  - desafio do dia;
  - Rodada da jornada (sorteio inteligente);
  - desafio avançado;
  - desafios especiais;
  - rodada livre com filtros por parte da Bíblia, dificuldade e formato;
  - estatísticas antigas mantidas.
- **Durante a rodada:**
  - cada formato tem sua apresentação: lacuna no versículo, botões V e F, pares do “relacione”;
  - depois de cada resposta aparecem a explicação, o versículo na tradução da pessoa e “+10” quando o acerto é inédito.
- **Resultado:** pontos por tipo, medalhas novas, barra animada do antes para o depois e situação da confirmação no servidor.
- **Tela de novo nível:** fundo azul com brilho dourado, emblema que entra com anéis, nome, descrição, mensagem de parabéns e aviso. Respeita a preferência de reduzir movimento.
- **Perfil:**
  - selo do nível no cartão de destaque;
  - seção “Jornada da Sabedoria” com o cartão e as medalhas.
- **Painel completo (“Ver jornada”):**
  - foto, nome e data de início;
  - emblema e descrição do nível;
  - pontos e barra;
  - aviso;
  - 7 medalhas;
  - 8 estatísticas;
  - domínio nas 10 seções;
  - galeria dos 8 níveis (os bloqueados aparecem em cinza com cadeado);
  - histórico de evolução;
  - regras de pontuação.

## Banco de dados (Supabase, migração `jornada_da_sabedoria`, script em `docs/sabedoria.sql`)
- **Perguntas e desafios:** `sabedoria_perguntas` e `sabedoria_desafios`.
  - Leitura pública das linhas ativas.
  - Escrita só por editores (`privado.eh_editor()`).
- **Progresso de cada pessoa:**
  - `sabedoria`: total, nível, data de início, quizzes, respostas, acertos, sequência atual e máxima, dias seguidos, maior série, medalhas, desafios únicos e contadores do dia;
  - `sabedoria_respostas`: acertos e erros por pergunta;
  - `sabedoria_rodadas`: histórico dos quizzes;
  - `sabedoria_eventos`: evolução (rodadas, níveis e medalhas).
- **RLS:** cada pessoa só lê as próprias linhas. Não há política de inserção, alteração ou exclusão, e esses privilégios foram revogados de `anon` e `authenticated`.
- **Quem calcula e grava:**
  - `public.sabedoria_registrar_rodada(p_id, p_modo, p_especial, p_dia, p_respostas)` (SECURITY DEFINER, `search_path` vazio, só `authenticated`) valida as respostas com o gabarito do servidor, calcula pontos, bônus, dias seguidos, nível e medalhas, e grava tudo.
  - `public.sabedoria_estado()` devolve o estado completo numa chamada.
- **Pelo aplicativo, a pessoa não consegue** mudar pontos, nível ou medalhas, nem registrar perguntas inventadas.

## Sem conta e na prévia
- O aparelho calcula com as mesmas regras e guarda em `sabedoria`.
- As rodadas ficam em `_sabedoriaFila`, até 200.
- Ao entrar numa conta, a fila é enviada e o servidor recalcula.
- Na prévia do claude.ai, o estado é sincronizado pelo banco da prévia.
- O teste `test/e2e-nuvem.js` usa um servidor falso com o mesmo motor e confere:
  - pontos confirmados pelo servidor;
  - recusa de pergunta inventada;
  - mesmos pontos no segundo aparelho.
