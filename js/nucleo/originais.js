/*
 * ATOS 2 — Idiomas originais. Dados do STEPBible (CC BY 4.0, www.STEPBible.org), convertidos por
 * ferramentas/converter_originais.py: grego do Textus Receptus (base da BLIVRE e da Almeida) e
 * hebraico de Leningrado. A tradução palavra por palavra e as glosas dos léxicos são em inglês;
 * para palavras-chave há uma explicação em português (TERMOS), redigida pelo ATOS 2 com cautela.
 * Navegador: window.A2Originais · Node: module.exports
 */
(function (root) {
  'use strict';

  // Explicações em português das palavras-chave (chave = número de Strong sem a letra final)
  var TERMOS = {
    G0025: 'Amar. Verbo mais usado no Novo Testamento para o amor que se decide e se doa, inclusive o amor de Deus (Jo 3:16) e o amor ao próximo. Não se separa rigidamente de φιλέω: o contexto decide o tom.',
    G0026: 'Amor. Pouco comum no grego fora da Bíblia e muito usado no Novo Testamento para o amor de Deus e o amor cristão. 1 Coríntios 13 o descreve pelo que ele faz.',
    G5368: 'Amar, ter afeição de amigo; às vezes, beijar. Em João 21:15-17 alterna com ἀγαπάω; intérpretes discutem se a troca muda o sentido ou é só variação de estilo.',
    G4102: 'Fé, confiança; também fidelidade. Pode indicar o ato de confiar, aquilo em que se crê (“a fé”, Jd 3) ou a fidelidade de alguém. O contexto mostra qual.',
    G4100: 'Crer, confiar. Em João aparece muitas vezes como “crer em” (εἰς), indicando confiança pessoal, não só concordar com uma ideia.',
    G5485: 'Graça, favor; também gratidão. Favor que não se merece; no Novo Testamento, sobretudo o favor de Deus em Cristo (Ef 2:8).',
    G1343: 'Justiça, retidão. Pode indicar a conduta reta, a justiça de Deus ou a condição de justo diante de Deus. Em Romanos é palavra central e muito estudada (Rm 1:17; 3:21-26).',
    G1344: 'Justificar, declarar justo. Termo de tribunal: absolver, declarar alguém justo. Em Paulo aparece ligado à fé (Rm 5:1); em Tiago 2:21-24, à fé que se mostra em obras. Como os dois usos se relacionam é tema clássico de estudo.',
    G3056: 'Palavra, mensagem, relato, razão. Em João 1:1-14 designa o próprio Cristo, o Verbo.',
    G4151: 'Espírito; vento; sopro. Pode ser o vento (Jo 3:8), o espírito humano ou o Espírito Santo. O contexto e as palavras ao redor indicam o sentido.',
    G4561: 'Carne. O corpo, o ser humano (Jo 1:14) ou, em Paulo, a natureza humana voltada contra Deus (Gl 5:16-17).',
    G0266: 'Pecado. A ideia de errar o alvo; no Novo Testamento, ofensa contra Deus e também um poder que escraviza (Rm 6).',
    G3341: 'Arrependimento. Mudança de mente que leva a uma mudança de vida (Mt 3:8).',
    G3340: 'Arrepender-se. Mudar de mente e de direção diante de Deus (Mc 1:15; At 2:38).',
    G0907: 'Batizar. Sentido básico: mergulhar, imergir; às vezes, lavar (Lc 11:38). A forma e o significado do batismo cristão são entendidos de modos diferentes pelas tradições.',
    G1577: 'Assembleia, igreja. Reunião de pessoas convocadas; usada para a assembleia da cidade (At 19:32) e para a igreja, local ou em sentido amplo.',
    G2098: 'Evangelho, boa notícia. Anúncio da obra de Deus em Jesus Cristo (Mc 1:1; 1Co 15:1-4).',
    G4991: 'Salvação, livramento.',
    G4982: 'Salvar, livrar; também curar. Pode indicar a salvação eterna ou um livramento e cura física (Mc 5:34).',
    G0629: 'Redenção. Libertação mediante resgate (Rm 3:24; Ef 1:7).',
    G2434: 'Propiciação ou expiação (1Jo 2:2; 4:10). Tradutores divergem entre os dois termos: um destaca o afastamento da ira de Deus; o outro, a remoção do pecado.',
    G2643: 'Reconciliação. Restabelecer a paz entre partes afastadas (2Co 5:18-19).',
    G0038: 'Santificação. Ser separado para Deus e o processo de viver nessa condição (1Ts 4:3).',
    G0040: 'Santo, separado para Deus. No plural, “os santos” designa os cristãos (Rm 1:7).',
    G1680: 'Esperança. Expectativa confiante, não um simples desejo (Rm 5:5).',
    G1515: 'Paz. Muitas vezes corresponde ao hebraico shalom: bem-estar completo, não apenas ausência de conflito.',
    G5547: 'Cristo, “ungido”. Tradução grega de Messias (Jo 1:41).',
    G2962: 'Senhor. Na Septuaginta, traduz o nome de Deus (YHWH); no Novo Testamento também é aplicado a Jesus (Fp 2:11).',
    G2222: 'Vida. Em João, a “vida eterna” é a vida que vem de Deus e começa já agora (Jo 17:3).',
    G0166: 'Eterno. Literalmente “da era”; usado para a vida da era vindoura e para o que não tem fim.',
    G0932: 'Reino, reinado. Indica mais o governo do rei do que um território.',
    G3875: 'Consolador, advogado: alguém chamado para estar ao lado. Usado para o Espírito Santo (Jo 14:16) e para Jesus (1Jo 2:1).',
    G5486: 'Dom (dado pela graça). Usado para os dons espirituais (1Co 12) e para o dom da vida eterna (Rm 6:23).',
    G0225: 'Verdade. O que é real e confiável; Jesus se apresenta como a verdade (Jo 14:6).',
    G1391: 'Glória: esplendor, honra, reputação. Na Septuaginta, traduz o hebraico kavod.',
    G4335: 'Oração.',
    G1656: 'Misericórdia. Na Septuaginta, traduz com frequência o hebraico chesed.',
    G3101: 'Discípulo, aprendiz: quem segue e aprende de um mestre.',
    G0652: 'Apóstolo, enviado: alguém enviado com autoridade de quem o enviou.',
    G4396: 'Profeta: quem fala da parte de Deus.',
    G1242: 'Aliança; também testamento (Hb 9:16-17). Na Septuaginta traduz o hebraico berit.',
    G3551: 'Lei. Muitas vezes a Lei de Moisés; às vezes, um princípio que age (Rm 7:21-23).',
    G2041: 'Obra, ação, trabalho.',
    G2842: 'Comunhão, participação, partilha (At 2:42; 1Jo 1:3).',
    G1322: 'Ensino, doutrina: o conteúdo do que é ensinado (At 2:42).',
    G0386: 'Ressurreição.',
    G3952: 'Vinda, presença. Usada para a volta de Cristo (1Ts 4:15).',
    G2920: 'Julgamento, juízo.',
    G1067: 'Geena. Nome do vale de Hinom, ao sul de Jerusalém; nos lábios de Jesus, o lugar do castigo final (Mt 10:28).',
    G0086: 'Hades. A morada dos mortos; equivalente grego do hebraico Sheol. Como entender esse estado é discutido entre os cristãos.',
    G3857: 'Paraíso: jardim; usado para a presença de Deus (Lc 23:43; 2Co 12:4).',
    G5207: 'Filho. Também indica pertença ou característica (“filhos da luz”).',
    G2316: 'Deus.',
    G3772: 'Céu. Pode ser o céu visível ou a habitação de Deus.',
    H0430: 'Deus. A forma é plural, mas quando se refere ao Deus de Israel vem normalmente com verbo no singular (Gn 1:1). Também pode significar “deuses”.',
    H3068: 'O nome próprio de Deus (YHWH; Êx 3:14-15). Em português costuma ser traduzido por “SENHOR”, em maiúsculas. A pronúncia original não é conhecida com certeza.',
    H2617: 'Amor leal, bondade fiel, misericórdia. Amor que se mantém fiel ao compromisso da aliança; difícil de traduzir com uma só palavra (Sl 136).',
    H7965: 'Paz, bem-estar, inteireza. Mais amplo que ausência de guerra: indica vida plena e relações em ordem.',
    H1285: 'Aliança, pacto: compromisso solene entre partes, como as alianças de Deus com Noé, Abraão, Israel e Davi.',
    H8451: 'Instrução, ensino, lei. Além de mandamentos, inclui o ensino de Deus ao seu povo (Sl 1:2).',
    H6666: 'Justiça, retidão; também atos de justiça. Conduta conforme o que é reto diante de Deus (Gn 15:6).',
    H6664: 'Justiça, retidão, o que é correto.',
    H0539: 'Firmar, ser fiel; na forma causativa, crer, confiar (Gn 15:6). Da mesma raiz vem “amém”.',
    H0530: 'Fidelidade, firmeza, constância (Hc 2:4).',
    H7307: 'Espírito; vento; fôlego. O contexto indica o sentido (Gn 1:2; Ez 37).',
    H5315: 'Alma, vida, pessoa. Indica o ser vivo inteiro, não uma parte separada do corpo; às vezes, garganta, desejo ou apetite.',
    H3820: 'Coração. Centro do pensamento, da vontade e das emoções, mais que só sentimentos (Pv 4:23).',
    H2403: 'Pecado; também a oferta pelo pecado (Lv 4).',
    H5771: 'Iniquidade, culpa; às vezes, o castigo que ela traz.',
    H3722: 'Fazer expiação, purificar, cobrir a culpa (Lv 16).',
    H7725: 'Voltar, retornar; em sentido espiritual, arrepender-se, voltar para Deus (Jr 3:12).',
    H6942: 'Santificar, consagrar: separar para Deus.',
    H6944: 'Santidade; coisa santa, lugar santo.',
    H6918: 'Santo (Is 6:3).',
    H3519: 'Glória. A raiz traz a ideia de peso: honra, importância, esplendor.',
    H4899: 'Ungido; Messias. Usado para reis, sacerdotes e para o rei prometido (Sl 2:2).',
    H1350: 'Resgatar, redimir. O “resgatador” era o parente que recuperava a terra ou a pessoa da família (Rt 4).',
    H8085: 'Ouvir, escutar; muitas vezes também obedecer (Dt 6:4).',
    H0157: 'Amar.',
    H3372: 'Temer; reverenciar. O “temor do Senhor” é respeito reverente, não pavor (Pv 1:7).',
    H7585: 'Sheol: a morada dos mortos. Como entender esse estado é discutido entre os cristãos.',
    H2580: 'Graça, favor (Gn 6:8).',
    H7356: 'Compaixão, misericórdias. Ligado à palavra para ventre materno: cuidado entranhado.',
    H1288: 'Abençoar; também bendizer a Deus (Sl 103:1).',
    H3467: 'Salvar, livrar. Da mesma raiz vêm os nomes Josué e Jesus.',
    H0571: 'Verdade, fidelidade, confiabilidade.',
    H4941: 'Juízo, justiça, direito; também costume ou ordenança.'
  };

  function base(strong) { return String(strong || '').replace(/[A-Za-z]$/, ''); }
  function termo(strong) { return TERMOS[base(strong)] || null; }
  function idioma(strong) { return String(strong || '').charAt(0) === 'G' ? 'grego' : 'hebraico'; }
  function lexicoDe(strong) { return idioma(strong) === 'grego' ? 'lexico-g' : 'lexico-h'; }
  // "JHN 3:16" → {livro, cap, v1, v2}
  function refDaOcorrencia(s) { var m = /^([1-3A-Z]{3}) (\d+):(\d+)$/.exec(s); return m ? { livro: m[1], cap: +m[2], v1: +m[3], v2: +m[3], cap2: +m[2] } : null; }
  // Palavras de um versículo prontas para exibir (morfologia em português)
  function palavras(dadosLivro, cap, v, morfologia) {
    return ((dadosLivro && dadosLivro.v) || {})[cap + ':' + v] ? dadosLivro.v[cap + ':' + v].map(function (w) {
      return { original: w[0], translit: w[1], strong: w[2], codigo: w[3], morfologia: (morfologia && morfologia[w[3]]) || w[3], traducao: w[4] };
    }) : [];
  }
  // Classe gramatical do léxico ("G:V", "H:N-M") em português
  var CLASSES = { V: 'verbo', N: 'substantivo', 'N-M': 'substantivo masculino', 'N-F': 'substantivo feminino', 'N-N': 'substantivo neutro', A: 'adjetivo', ADV: 'advérbio',
    CONJ: 'conjunção', PREP: 'preposição', PRT: 'partícula', 'N-M-P': 'nome de pessoa', 'N-F-P': 'nome de pessoa', 'N-M-L': 'nome de lugar', 'N-F-L': 'nome de lugar', 'N-LI': 'letra',
    INJ: 'interjeição', 'N-M/F': 'substantivo', 'N-M/N': 'substantivo', T: 'artigo', R: 'pronome', P: 'pronome', D: 'pronome demonstrativo' };
  function classe(c) { var k = String(c || '').replace(/^[A-Z]:/, ''); return CLASSES[k] || CLASSES[k.split('-')[0]] || k; }

  var CREDITO = 'Textos originais, morfologia e léxicos: STEP Bible (www.STEPBible.org), dados de Tyndale House, Cambridge — licença CC BY 4.0. Grego: palavras do Textus Receptus; hebraico: Códice de Leningrado. Morfologia traduzida para o português e explicações de palavras-chave pelo ATOS 2; traduções palavra por palavra e glosas em inglês, como na fonte.';

  var API = { TERMOS: TERMOS, termo: termo, base: base, idioma: idioma, lexicoDe: lexicoDe, refDaOcorrencia: refDaOcorrencia, palavras: palavras, classe: classe, CREDITO: CREDITO };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Originais = API;
})(typeof window !== 'undefined' ? window : this);
