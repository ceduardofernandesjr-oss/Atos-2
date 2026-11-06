# ATOS 2 — Cadastro de procedência e licença do acervo (Biblioteca › Livros e Artigos)

Registro interno. O catálogo público (`app/acervo/catalogo.json`) cita a edição impressa de cada obra. Os arquivos digitais de origem ficam registrados aqui porque a licença do Project Gutenberg (cláusula 1.C) permite redistribuir um texto de domínio público sem o cabeçalho e o rodapé dele **desde que se retirem as referências ao Project Gutenberg** do texto redistribuído.

Conferência feita em 06/11/2026 por Claude (curadoria inicial). Cada item deve receber também a revisão editorial humana pela administração do acervo.

## 1. Textos integrais em domínio público (leitura no app)

Obtidos por `git clone` do espelho público **GITenberg** no GitHub (`github.com/GITenberg/<repositório>`), que reproduz os arquivos do Project Gutenberg. Convertidos por `ferramentas/converter_acervo.py`:

- sai o cabeçalho e o rodapé de licença, as linhas de crédito de digitalização (“Produced by”, “E-text prepared by”), as ilustrações e o sumário;
- nenhuma outra palavra é alterada;
- `_itálico_` vira `{itálico}`;
- o conversor confere que as palavras dos parágrafos aparecem na mesma ordem do original e falha se algo se perder.

| id no app | Obra | Arquivo de origem | Direitos |
|---|---|---|---|
| confissoes-agostinho | Agostinho, *Confissões*, trad. E. B. Pusey | Project Gutenberg nº 3296 (`3296.txt`) | Obra antiga. O tradutor morreu em 1882. Domínio público no Brasil (Lei 9.610/98, art. 41) e nos EUA. |
| imitacao-de-cristo | Tomás de Kempis, *A imitação de Cristo*, trad. William Benham | nº 1653 (`1653.txt`) | Obra do século XV. O tradutor morreu em 1910. |
| liberdade-crista-lutero | Lutero, *Da liberdade cristã*, trad. R. S. Grignon (Wace & Buchheim, 1883) | nº 1911 (`1911.txt`) | Obra de 1520, tradução publicada em 1883. Edição conferida na CCEL (`ccel.org/ccel/l/luther/first_prin`, “Rights: Public Domain”). |
| galatas-lutero | Lutero, *Comentário a Gálatas*, trad. condensada de Theodore Graebner | nº 1549 (`1549.txt`) | Obra de 1535. O tradutor morreu em 1950 e a tradução está em domínio público no Brasil desde 01/01/2021. O Gutenberg a liberou nos EUA. |
| julgamento-morte-jesus-stalker | James Stalker, *The Trial and Death of Jesus Christ* (1894) | nº 21814 (`21814-8.txt`, latin-1; o `21814.txt` do espelho tinha só 4 KB) | O autor morreu em 1927. |
| vida-sao-paulo-stalker | James Stalker, *The Life of St. Paul* (ed. revista de 1912) | nº 21828 (`21828.txt`) | Autor (m. 1927) e autor da apresentação, W. W. White (m. 1944): os dois morreram há mais de 70 anos. Publicada nos EUA em 1912. |
| credo-apostolico-dodds | James Dodds, *Exposition of the Apostles’ Creed* (1896) | nº 13652 (`13652.txt`) | O autor morreu em 1907. |

### Descartados na verificação

- **The Practice of the Presence of God** (Irmão Lourenço), Gutenberg nº 5657: o arquivo está marcado “COPYRIGHTED Project Gutenberg eBook” (edição Lightheart, 2002). Não entrou.
- **The Pilgrim’s Progress**, nº 39452: é uma adaptação infantil (“Every Child Can Read”, ed. J. L. Hurlbut), não o texto de Bunyan. Não entrou.
- **Vida de Jesus**, nº 65165 (português): obra que nega a divindade de Cristo. Ficou fora da linha editorial cristocêntrica.
- UCP / RCAAP: o repositório exige verificação anti-robô e não pôde ser consultado. Nenhum item entrou.

## 2. Traduções do ATOS 2 (rascunhos em revisão)

Credo Apostólico (latim), Credo Niceno-Constantinopolitano (grego, 381), Definição de Calcedônia (grego, 451, trecho central) e Didaquê (grego, ed. Briênios, 1883). Os originais são de domínio público.

As traduções foram feitas com apoio de IA e marcadas `origem.ia = true`. Ficam com `situacao: "revisao"`, invisíveis para os leitores, até que um editor confira o texto com o original e aprove na administração do acervo.

## 3. Registros só com dados bibliográficos e link

| id | Fonte | Licença conferida |
|---|---|---|
| sermoes-vieira | Brasiliana USP, `digital.bbm.usp.br/handle/bbm/8466` (ed. Lisboa 1854–1858) | Obra em domínio público. A digitalização é da biblioteca, por isso a leitura é feita no site dela. |
| encarnacao-atanasio | CCEL, `ccel.org/ccel/athanasius/incarnation` | Obra e tradução (A. Robertson, m. 1931) em domínio público. A CCEL só permite copiar os arquivos que formata para uso não comercial e sem modificação, por isso só há link. |
| historia-eclesiastica-eusebio | CCEL, `ccel.org/ccel/schaff/npnf201` | Tradução de McGiffert (1890; m. 1933): domínio público. |
| historia-igreja-schaff-1 | CCEL, `ccel.org/ccel/schaff/hcc1` | “Rights: Public Domain” (Schaff, m. 1893). |
| artigo-principios-igreja-saudavel | Teocomunicação 48(2), 2018, DOI 10.15448/0103-314X.2018.2.32080 | CC BY 4.0 (declarada no PDF). |
| artigo-koinonia-atos | Pistis & Praxis 9(3), 2017, DOI 10.7213/2175-1838.09.003.AO02 | Creative Commons, sem versão indicada no PDF (Redalyc). |
| artigo-comunidade-primitiva-atos2 | Kerygma 20(1), 2025 (UNASP) | Sem licença no PDF. Acesso aberto só para leitura. |
| artigo-jesus-historico | Teocomunicação 54(1), 2024, DOI 10.15448/0103-314X.2024.1.45310 | CC BY 4.0 (declarada no PDF). |
| artigo-eclesiologia-santos-padres | Teocomunicação 42(2), 2012 | CC BY-NC-ND 3.0 (declarada no PDF). |
| artigo-paideia-pais-igreja | Revista Caminhando 9(1), 2005 (via CORE) | Sem licença no documento. Acesso aberto só para leitura. |

Nenhum artigo foi copiado para o app: a ficha mostra os dados, uma descrição escrita pelo ATOS 2 e o link para a publicação original.

## 4. Conteúdo já existente no app

As **95 Teses** (Mural, v1.7) aparecem também no acervo. O original latino de 1517 é de domínio público e a tradução é do ATOS 2.
