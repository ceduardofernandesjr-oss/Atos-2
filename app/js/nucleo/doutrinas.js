/*
 * ATOS 2 — Doutrinas e controvérsias. Redação própria, com a regra do app: mostrar onde está escrito,
 * o contexto e como cada tradição chega à sua leitura, sem favorecer denominação.
 * Cada passagem traz uma palavra que precisa constar no texto da Bíblia Livre (conferida em test/).
 * Navegador: window.A2Doutrinas · Node: module.exports
 */
(function (root) {
  'use strict';

  var GRUPOS = ['Deus', 'Salvação', 'Igreja e Espírito', 'Vida cristã', 'Últimas coisas'];

  // p: [referência, palavra que consta no texto (BLIVRE), nota]
  var DOUTRINAS = [
    { id: 'trindade', nome: 'Trindade', grupo: 'Deus',
      definicao: 'Ensino de que há um só Deus, que existe eternamente como Pai, Filho e Espírito Santo. A palavra “Trindade” não aparece na Bíblia: é um termo criado depois para resumir o que os cristãos entendem das Escrituras.',
      p: [['Dt 6:4', 'único', 'Há um só Deus (o “Shemá”).'], ['Mt 28:19', 'nome', 'Um só “nome” para Pai, Filho e Espírito Santo.'], ['Jo 1:1', 'deus', 'O Verbo estava com Deus e era Deus.'],
          ['Jo 20:28', 'deus', 'Tomé chama Jesus de “meu Deus”.'], ['At 5:3-4', 'espírito santo', 'Mentir ao Espírito Santo é mentir a Deus.'], ['Mt 3:16-17', 'espírito', 'Pai, Filho e Espírito no batismo de Jesus.'], ['2Co 13:14', 'comunhão', 'Bênção que menciona os três.']],
      contexto: 'O Antigo Testamento insiste no monoteísmo diante dos deuses das nações (Dt 6:4). O Novo Testamento, escrito por judeus monoteístas, fala de Jesus e do Espírito com títulos e obras de Deus, sem abandonar a fé em um só Deus. A formulação “três pessoas, uma essência” vem dos concílios de Niceia (325) e Constantinopla (381).',
      leituras: [
        { nome: 'Trinitarismo', quem: 'Igrejas católica, ortodoxa e a grande maioria das protestantes', resumo: 'Um só Deus em três pessoas distintas, iguais e eternas. Jesus é plenamente Deus e plenamente homem.', textos: ['Mt 28:19', 'Jo 1:1', 'Jo 20:28', 'Hb 1:8'] },
        { nome: 'Unicismo', quem: 'Pentecostais unicistas', resumo: 'Um só Deus que se revela como Pai, Filho e Espírito, sem três pessoas distintas; batizam em nome de Jesus.', textos: ['Dt 6:4', 'Is 9:6', 'Cl 2:9', 'At 2:38'] },
        { nome: 'Antitrinitarismo', quem: 'Unitaristas, Testemunhas de Jeová e outros grupos', resumo: 'Só o Pai é o Deus verdadeiro; o Filho é distinto e subordinado ao Pai.', textos: ['Jo 17:3', '1Co 8:6', 'Jo 14:28'] }],
      objecoes: ['A palavra “Trindade” não está na Bíblia. Os trinitários respondem que o conceito vem de reunir o que diversos textos afirmam.',
        'Textos em que o Filho se submete ao Pai (Jo 14:28) são lidos pelos trinitários como referência à condição humana e à missão do Filho.',
        'Textos em que Pai, Filho e Espírito aparecem ao mesmo tempo e se relacionam (Mt 3:16-17; Jo 17) são um desafio para o unicismo.',
        'Textos que chamam Jesus de Deus (Jo 1:1; 20:28) são um desafio para o antitrinitarismo.'],
      conclusao: 'Explícito no texto: Deus é um só, e o Pai, o Filho e o Espírito Santo aparecem com nomes, obras e honra de Deus. A doutrina da Trindade é a conclusão que a maior parte da igreja tirou desses dados desde os primeiros séculos; é uma síntese teológica, não uma frase literal da Bíblia.',
      termos: ['G2316', 'H0430', 'G4151'] },

    { id: 'batismo-aguas', nome: 'Batismo nas águas', grupo: 'Igreja e Espírito',
      definicao: 'Rito ordenado por Jesus (Mt 28:19) e praticado pela igreja desde o dia de Pentecostes (At 2:41). Todos os cristãos o praticam; divergem sobre quem deve ser batizado, como e o que ele realiza.',
      p: [['Mt 28:19', 'batizando', 'A ordem de Jesus.'], ['At 2:38', 'batizado', 'Arrependimento, batismo e perdão no primeiro sermão.'], ['At 8:36-38', 'água', 'O eunuco etíope desce à água.'],
          ['Rm 6:3-4', 'batismo', 'Batismo como sepultamento e ressurreição com Cristo.'], ['Cl 2:11-12', 'batismo', 'Batismo e circuncisão de Cristo.'], ['1Pe 3:21', 'batismo', 'O batismo “agora vos salva”.'], ['At 16:33', 'batizado', 'O carcereiro e “todos os seus”.']],
      contexto: 'O verbo grego βαπτίζω significa mergulhar ou lavar. Em Atos, o batismo vem logo depois da fé e do arrependimento. Os textos citados por cada lado são poucos e curtos, por isso as conclusões dependem também de como se relacionam com a aliança do Antigo Testamento.',
      leituras: [
        { nome: 'Batismo de crentes', quem: 'Batistas, pentecostais e muitas igrejas evangélicas', resumo: 'Só quem professa fé deve ser batizado, de preferência por imersão; o batismo é um testemunho público de obediência e união com Cristo.', textos: ['At 2:41', 'At 8:36-38', 'Rm 6:4'] },
        { nome: 'Batismo infantil', quem: 'Católicos, ortodoxos, luteranos, anglicanos, presbiterianos e reformados', resumo: 'Os filhos dos crentes também recebem o sinal da aliança, como a circuncisão no Antigo Testamento; Atos menciona batismo de “casas” inteiras.', textos: ['Cl 2:11-12', 'At 16:15', 'At 16:33', 'At 2:39'] },
        { nome: 'Meio de graça ou símbolo', quem: 'Visões sacramentais × visões de ordenança', resumo: 'Católicos, ortodoxos e luteranos veem no batismo uma ação de Deus que concede graça; muitos evangélicos o veem como sinal da graça já recebida pela fé.', textos: ['At 2:38', '1Pe 3:21', 'Ef 2:8-9'] }],
      objecoes: ['Não há no Novo Testamento um caso explícito de batismo de criança, nem uma proibição explícita.',
        'Fórmula: Mateus 28:19 fala em “nome do Pai, do Filho e do Espírito Santo”; Atos fala em batizar “em nome de Jesus”. Trinitários entendem Atos como indicação de autoridade; unicistas usam só o nome de Jesus.',
        'Modo: a imersão combina com o sentido do verbo e com Rm 6:4; um escrito cristão antigo, a Didaqué, já admitia derramar água quando faltava água corrente.'],
      conclusao: 'Explícito no texto: Jesus mandou batizar, e o batismo está ligado ao arrependimento, à fé e à união com Cristo. Quem deve ser batizado, o modo e o que o batismo realiza são conclusões que dependem de como se juntam os textos; aqui cristãos fiéis divergem.',
      termos: ['G0907'] },

    { id: 'batismo-espirito', nome: 'Batismo com o Espírito Santo', grupo: 'Igreja e Espírito',
      definicao: 'Expressão usada por João Batista para a obra de Jesus (Mt 3:11) e cumprida no Pentecostes (At 1:5; 2:4). A questão é se ela descreve a conversão de todo cristão ou uma experiência posterior.',
      p: [['Mt 3:11', 'espírito santo', 'João anuncia quem batizará com o Espírito.'], ['At 1:5', 'batizados', 'Promessa de Jesus antes do Pentecostes.'], ['At 2:4', 'cheios', 'Pentecostes e línguas.'],
          ['At 8:15-17', 'espírito', 'Samaria: intervalo entre crer e receber o Espírito.'], ['At 10:44-46', 'línguas', 'Casa de Cornélio: ao mesmo tempo que ouviam.'], ['At 19:6', 'línguas', 'Discípulos em Éfeso.'],
          ['1Co 12:13', 'batizados', 'Todos fomos batizados em um Espírito.'], ['1Co 12:30', 'línguas', '“Falam todos em línguas?”'], ['Ef 5:18', 'enchei', 'Ordem para ser cheio do Espírito.']],
      contexto: 'Atos é uma narrativa da expansão da igreja (Jerusalém, Samaria, gentios, discípulos de João). Uma pergunta importante de interpretação é se narrativas como essas estabelecem um padrão para hoje ou descrevem uma fase de transição. As cartas de Paulo tratam do tema de forma mais ensinada (1Co 12).',
      leituras: [
        { nome: 'Pentecostal clássica', quem: 'Assembleias de Deus e outras pentecostais', resumo: 'Experiência posterior à conversão, para poder no testemunho, com o falar em línguas como sinal inicial.', textos: ['At 2:4', 'At 10:46', 'At 19:6', 'At 1:8'] },
        { nome: 'Carismática', quem: 'Renovação carismática em várias igrejas', resumo: 'Experiência de renovação e poder do Espírito, sem exigir línguas como sinal obrigatório.', textos: ['At 8:17', 'Ef 5:18'] },
        { nome: 'Na conversão', quem: 'Reformados, batistas e muitos evangélicos', resumo: 'Todo cristão é batizado com o Espírito ao crer; depois há novos enchimentos ao longo da vida.', textos: ['1Co 12:13', 'Rm 8:9', 'Ef 5:18'] },
        { nome: 'Sacramental', quem: 'Católicos, ortodoxos e anglicanos', resumo: 'O dom do Espírito está ligado ao batismo e, em algumas tradições, à confirmação (crisma).', textos: ['At 2:38', 'At 8:17'] }],
      objecoes: ['Em Atos a ordem varia: em Samaria há intervalo (8:15-17), na casa de Cornélio tudo acontece junto (10:44-46). Isso pesa contra um padrão único em qualquer direção.',
        'Paulo pergunta “falam todos em línguas?” (1Co 12:30), esperando “não” como resposta; pentecostais respondem que ele fala do dom no culto, não do sinal do batismo.',
        '1 Coríntios 12:13 diz que todos foram batizados em um Espírito; quem defende a segunda experiência entende ali a conversão, distinta do revestimento de poder.'],
      conclusao: 'Explícito no texto: Jesus batiza com o Espírito, todos os crentes têm o Espírito (Rm 8:9) e devem buscar ser cheios dele (Ef 5:18). Se o “batismo com o Espírito” é a conversão ou uma experiência posterior com línguas é conclusão de interpretação.',
      termos: ['G4151', 'G0907'] },

    { id: 'dons', nome: 'Dons espirituais', grupo: 'Igreja e Espírito',
      definicao: 'Capacidades dadas pelo Espírito Santo para o bem comum da igreja (1Co 12:7). O debate principal é se todos os dons do Novo Testamento continuam hoje.',
      p: [['1Co 12:4-7', 'dons', 'Diversidade de dons, mesmo Espírito, para o proveito comum.'], ['1Co 12:8-10', 'profecia', 'Lista que inclui curas, profecia e línguas.'], ['Rm 12:6-8', 'dons', 'Outra lista: servir, ensinar, exortar, contribuir.'],
          ['Ef 4:11-12', 'apóstolos', 'Ministérios para edificar o corpo.'], ['1Pe 4:10', 'dom', 'Cada um sirva com o dom que recebeu.'], ['1Co 13:8-10', 'línguas', 'Profecias e línguas passarão quando vier o “perfeito”.'],
          ['1Co 14:1', 'profetizeis', 'Busquem os dons, especialmente profetizar.'], ['1Co 14:39-40', 'línguas', 'Não proibir línguas; tudo com ordem.']],
      contexto: 'Paulo escreve a Corinto, uma igreja com muitos dons e muita desordem. Ele não suprime os dons; ele os ordena pelo amor (cap. 13) e pela edificação (cap. 14). As listas não parecem completas e variam de carta para carta.',
      leituras: [
        { nome: 'Continuísmo', quem: 'Pentecostais, carismáticos e muitos outros', resumo: 'Todos os dons continuam até a volta de Cristo, que seria o “perfeito” de 1Co 13:10.', textos: ['1Co 13:10-12', '1Co 14:1', '1Co 14:39'] },
        { nome: 'Cessacionismo', quem: 'Muitos reformados e alguns batistas', resumo: 'Dons de revelação e de sinal (profecia, línguas, curas como sinais) serviram para fundamentar a igreja apostólica e cessaram com ela; os demais continuam.', textos: ['Ef 2:20', 'Hb 2:3-4', '2Co 12:12'] },
        { nome: 'Aberto, mas cauteloso', quem: 'Diversos evangélicos', resumo: 'Não há texto que afirme claramente o fim dos dons, mas pede-se discernimento e submissão à Escritura.', textos: ['1Ts 5:19-21', '1Jo 4:1'] }],
      objecoes: ['O que é “o perfeito” em 1Co 13:10? A volta de Cristo, o cânon completo ou a maturidade da igreja? O versículo 12 (“face a face”) costuma ser usado pelos continuístas.',
        'Cessacionistas apontam a raridade de alguns dons na história posterior; continuístas apontam relatos ao longo dos séculos e a ausência de texto explícito.',
        'Os dois lados concordam que dons devem edificar, ser exercidos com amor e ser avaliados pela Escritura (1Co 14:29).'],
      conclusao: 'Explícito no texto: o Espírito distribui dons a cada cristão para o bem comum, e todos devem ser exercidos com amor e ordem. Se alguns dons cessaram é conclusão de interpretação; nenhum texto o afirma diretamente, e o sentido de 1Co 13:10 é discutido.',
      termos: ['G5486', 'G4151'] },

    { id: 'salvacao', nome: 'Salvação', grupo: 'Salvação',
      definicao: 'Livramento do pecado e da condenação e reconciliação com Deus por meio de Jesus Cristo. Todos os cristãos afirmam que ela vem da graça de Deus em Cristo; divergem sobre como é recebida e se pode ser perdida.',
      p: [['Ef 2:8-9', 'graça', 'Pela graça, por meio da fé, não de obras.'], ['Jo 3:16', 'eterna', 'Quem crê tem a vida eterna.'], ['At 4:12', 'nome', 'Não há salvação em nenhum outro.'],
          ['Rm 10:9-10', 'salvo', 'Confessar e crer.'], ['Tt 3:5', 'misericórdia', 'Não por obras de justiça, mas por misericórdia.'], ['Fp 2:12-13', 'salvação', 'Desenvolver a salvação, porque Deus opera.'],
          ['Jo 10:28', 'perecerão', 'Ninguém as arrebatará da minha mão.'], ['Hb 6:4-6', 'iluminados', 'Advertência sobre os que caem.']],
      contexto: 'O Novo Testamento fala da salvação no passado (fomos salvos, Ef 2:8), no presente (estamos sendo salvos, 1Co 1:18) e no futuro (seremos salvos, Rm 5:9). Muitas divergências vêm de enfatizar um desses aspectos.',
      leituras: [
        { nome: 'Somente pela fé', quem: 'Protestantes', resumo: 'A salvação é recebida pela fé, sem mérito humano; as obras são fruto dela.', textos: ['Ef 2:8-10', 'Rm 3:28', 'Gl 2:16'] },
        { nome: 'Graça, fé e sacramentos', quem: 'Católicos e ortodoxos', resumo: 'A salvação é dom da graça, recebida pela fé e pelos sacramentos e vivida em cooperação com Deus na igreja.', textos: ['Jo 3:5', 'Tg 2:24', 'Fp 2:12'] },
        { nome: 'Perseverança dos santos', quem: 'Reformados e muitos batistas', resumo: 'Quem foi verdadeiramente salvo será guardado por Deus até o fim.', textos: ['Jo 10:28-29', 'Rm 8:38-39', 'Fp 1:6'] },
        { nome: 'Possibilidade de apostasia', quem: 'Arminianos, wesleyanos, muitos pentecostais, católicos e ortodoxos', resumo: 'Quem crê está seguro em Cristo, mas pode abandonar a fé de forma definitiva.', textos: ['Hb 6:4-6', '2Pe 2:20-21', 'Hb 3:12-14'] }],
      objecoes: ['Como entender Tiago 2:24 ao lado de Romanos 3:28 (ver “Fé e obras”).',
        'As advertências de Hebreus são lidas por uns como perda real possível e por outros como meio pelo qual Deus guarda os seus ou como descrição de quem nunca creu de verdade.',
        'O alcance da obra de Cristo: por todos (1Jo 2:2; 1Tm 2:6) ou de forma eficaz pelos eleitos (Jo 10:11). Ver “Predestinação e livre-arbítrio”.'],
      conclusao: 'Explícito no texto: a salvação é obra da graça de Deus em Cristo, recebida pela fé, e produz vida nova. Como os sacramentos se relacionam com a fé e se a salvação pode ser perdida são conclusões em que cristãos fiéis divergem.',
      termos: ['G4991', 'G4982', 'G5485', 'G4102'] },

    { id: 'predestinacao', nome: 'Predestinação e livre-arbítrio', grupo: 'Salvação',
      definicao: 'Como a escolha soberana de Deus se relaciona com a decisão humana de crer. A Bíblia usa as palavras “eleição” e “predestinação”; o debate é sobre o que elas significam.',
      p: [['Rm 8:29-30', 'predestinou', 'A cadeia: conheceu, predestinou, chamou, justificou, glorificou.'], ['Ef 1:4-5', 'predestinou', 'Escolhidos nele antes da fundação do mundo.'], ['Jo 6:44', 'trouxer', 'Ninguém vem se o Pai não o trouxer.'],
          ['Rm 9:15-16', 'misericórdia', 'Não depende de quem quer, mas de Deus.'], ['1Tm 2:4', 'salvem', 'Deus quer que todos sejam salvos.'], ['2Pe 3:9', 'pereça', 'Não quer que ninguém pereça.'],
          ['Js 24:15', 'escolhei', 'Escolhei hoje a quem sirvais.'], ['Ap 22:17', 'quiser', 'Quem quiser, tome de graça.']],
      contexto: 'Romanos 9–11 trata do lugar de Israel e dos gentios no plano de Deus; parte do debate é se Paulo fala ali da salvação de indivíduos ou do papel de povos na história. Em Efésios 1, a eleição é “em Cristo”.',
      leituras: [
        { nome: 'Calvinista (reformada)', quem: 'Presbiterianos, reformados e muitos batistas', resumo: 'Deus elege incondicionalmente pessoas para a salvação e as atrai de forma eficaz; a fé é fruto dessa graça.', textos: ['Rm 9:15-16', 'Jo 6:44', 'Ef 1:4-5'] },
        { nome: 'Arminiana (wesleyana)', quem: 'Metodistas, muitos pentecostais e batistas', resumo: 'Deus elege em Cristo os que, por sua presciência, crerão; uma graça que antecede capacita todos a responder, mas pode ser resistida.', textos: ['1Tm 2:4', 'Rm 8:29', 'At 7:51'] },
        { nome: 'Sinergismo católico e ortodoxo', quem: 'Católicos e ortodoxos', resumo: 'A graça de Deus vem primeiro e possibilita a resposta livre do ser humano, que coopera com ela.', textos: ['Fp 2:12-13', '1Co 15:10'] }],
      objecoes: ['Calvinistas precisam explicar textos sobre Deus querer a salvação de todos (1Tm 2:4); costumam distinguir vontades de Deus.',
        'Arminianos precisam explicar textos sobre eleição e sobre Deus atrair (Jo 6:44); costumam entender que a atração é para todos (Jo 12:32).',
        'Os dois lados afirmam a soberania de Deus e a responsabilidade humana; divergem sobre como elas se articulam.'],
      conclusao: 'Explícito no texto: Deus elege e predestina, e as pessoas são chamadas a escolher e são responsáveis. Como as duas coisas se relacionam é conclusão teológica, debatida há séculos entre cristãos que levam a Bíblia a sério.',
      termos: [] },

    { id: 'justificacao', nome: 'Justificação', grupo: 'Salvação',
      definicao: 'O ato em que Deus declara justo o pecador. É um dos temas centrais da Reforma do século XVI e de Romanos e Gálatas.',
      p: [['Rm 3:23-24', 'justificados', 'Justificados gratuitamente pela graça.'], ['Rm 3:28', 'fé', 'Justificado pela fé sem as obras da lei.'], ['Rm 4:3-5', 'justiça', 'Abraão creu, e isso lhe foi contado como justiça.'],
          ['Gn 15:6', 'justiça', 'O texto que Paulo cita.'], ['Rm 5:1', 'paz', 'Justificados pela fé, temos paz com Deus.'], ['Gl 2:16', 'obras', 'Não pelas obras da lei, mas pela fé em Cristo.'],
          ['Tg 2:24', 'obras', 'Justificado pelas obras e não somente pela fé.'], ['Fp 3:9', 'justiça', 'A justiça que vem de Deus pela fé.']],
      contexto: 'Em Gálatas e Romanos, Paulo responde a quem exigia dos gentios a circuncisão e a Lei de Moisés. O verbo δικαιόω é linguagem de tribunal: declarar justo. Gênesis 15:6 é o texto-base de Paulo (Rm 4) e de Tiago (Tg 2:23).',
      leituras: [
        { nome: 'Protestante', quem: 'Luteranos, reformados e evangélicos em geral', resumo: 'Declaração de Deus, como num tribunal: a justiça de Cristo é atribuída a quem crê, somente pela fé.', textos: ['Rm 4:5', 'Rm 3:28', '2Co 5:21'] },
        { nome: 'Católica', quem: 'Igreja Católica (Concílio de Trento)', resumo: 'Pela graça, Deus perdoa e também renova interiormente; a fé atua pelo amor, e a justiça cresce com as boas obras feitas na graça.', textos: ['Gl 5:6', 'Tg 2:24', 'Rm 5:5'] },
        { nome: 'Nova perspectiva sobre Paulo', quem: 'Estudiosos como E. P. Sanders, James Dunn e N. T. Wright', resumo: '“Obras da lei” seriam sobretudo marcas de identidade judaica (circuncisão, comidas, sábado); justificação inclui ser reconhecido como parte do povo de Deus.', textos: ['Gl 2:11-16', 'Rm 3:29-30'] }],
      objecoes: ['Em 1999, luteranos e católicos assinaram uma Declaração Conjunta sobre a Doutrina da Justificação, afirmando consenso em pontos básicos e reconhecendo diferenças que permanecem.',
        'A relação com Tiago 2 é tratada em “Fé e obras”.',
        'Críticos da nova perspectiva dizem que Paulo também combate a ideia de mérito em geral (Rm 4:4-5).'],
      conclusao: 'Explícito no texto: Deus justifica o ímpio pela graça, por meio da fé em Cristo, e não pelas obras da lei. Se a justificação é só declaração ou inclui renovação interior, e o sentido exato de “obras da lei”, são pontos de interpretação.',
      termos: ['G1344', 'G1343', 'G4102'] },

    { id: 'fe-obras', nome: 'Fé e obras', grupo: 'Salvação',
      definicao: 'Como a fé que salva se relaciona com as boas obras. Paulo e Tiago parecem dizer coisas opostas; a maior parte dos intérpretes entende que eles respondem a problemas diferentes.',
      p: [['Ef 2:8-10', 'obras', 'Salvos pela fé, criados para as boas obras.'], ['Rm 4:5', 'ímpio', 'Deus torna justo o ímpio que crê.'], ['Tg 2:17', 'morta', 'A fé sem obras é morta.'],
          ['Tg 2:24', 'obras', 'Justificado pelas obras e não somente pela fé.'], ['Gl 5:6', 'amor', 'A fé que atua pelo amor.'], ['Mt 7:21', 'vontade', 'Não basta dizer “Senhor, Senhor”.'], ['Tt 3:8', 'obras', 'Os que creem se apliquem às boas obras.']],
      contexto: 'Paulo combate a ideia de ganhar a aceitação de Deus pelas obras da Lei (Gl 2). Tiago combate uma fé apenas de palavras, que não ajuda o irmão necessitado (Tg 2:15-16). Os dois citam Abraão e Gênesis 15:6.',
      leituras: [
        { nome: 'Obras como fruto e evidência', quem: 'Protestantes', resumo: 'Somos salvos só pela fé, mas a fé que salva nunca fica só: produz obras. Tiago fala de mostrar a fé diante dos outros.', textos: ['Ef 2:10', 'Tg 2:18', 'Gl 5:22'] },
        { nome: 'Fé que coopera', quem: 'Católicos e ortodoxos', resumo: 'A fé viva atua pelo amor, e as obras feitas na graça fazem parte do caminho da salvação.', textos: ['Gl 5:6', 'Tg 2:22', 'Mt 25:34-40'] }],
      objecoes: ['A palavra “justificar” em Tiago pode ter o sentido de “mostrar-se justo”, diferente do uso de Paulo; nem todos concordam.',
        'Todas as tradições rejeitam a ideia de comprar a salvação por méritos humanos e também a de uma fé que não muda a vida.'],
      conclusao: 'Explícito no texto: a salvação é pela graça, por meio da fé, e a fé verdadeira se mostra em obras. A forma exata de unir Paulo e Tiago é interpretação, com mais acordo entre as tradições do que costuma parecer.',
      termos: ['G4102', 'G2041', 'G1344'] },

    { id: 'santificacao', nome: 'Santificação', grupo: 'Vida cristã',
      definicao: 'Ser separado para Deus e transformado à semelhança de Cristo. O Novo Testamento fala dela como algo já realizado e como um processo.',
      p: [['1Ts 4:3', 'santificação', 'Esta é a vontade de Deus.'], ['Hb 12:14', 'santificação', 'Sem ela ninguém verá o Senhor.'], ['1Co 6:11', 'santificados', 'Já fostes santificados.'],
          ['2Co 3:18', 'transformados', 'Transformados de glória em glória.'], ['1Pe 1:15-16', 'santos', 'Sede santos.'], ['1Ts 5:23', 'santifique', 'Que Deus vos santifique por completo.'], ['1Jo 1:8', 'pecado', 'Se dissermos que não temos pecado…']],
      contexto: 'Em 1 Coríntios, Paulo chama de “santificados” uma igreja cheia de problemas (1Co 1:2; 6:11): a santidade é, primeiro, pertencer a Deus, e depois viver de acordo com isso.',
      leituras: [
        { nome: 'Posicional e progressiva', quem: 'Reformados e muitos evangélicos', resumo: 'O cristão já é santo em Cristo e cresce em santidade a vida toda, sem chegar à perfeição nesta vida.', textos: ['1Co 6:11', '2Co 3:18', 'Fp 3:12'] },
        { nome: 'Inteira santificação', quem: 'Tradição wesleyana e de santidade', resumo: 'Além do crescimento, é possível uma obra da graça que purifica o coração para amar a Deus plenamente.', textos: ['1Ts 5:23', '1Jo 3:9', 'Mt 5:48'] },
        { nome: 'Divinização (theosis)', quem: 'Ortodoxos e, de outra forma, católicos', resumo: 'Participação crescente na vida de Deus pela graça, pelos sacramentos e pela vida de oração.', textos: ['2Pe 1:4', '2Co 3:18'] }],
      objecoes: ['1 João 1:8 e 3:9 parecem opostos: um diz que todos têm pecado, outro que quem é nascido de Deus não peca. Muitos entendem 3:9 como prática contínua de pecado.',
        'Todas as leituras concordam que a santificação é obra de Deus com participação ativa do cristão (Fp 2:12-13).'],
      conclusao: 'Explícito no texto: Deus quer a santificação do seu povo, que já foi santificado em Cristo e é transformado aos poucos. Se é possível alguma perfeição nesta vida é ponto de interpretação.',
      termos: ['G0038', 'G0040', 'H6942'] },

    { id: 'arrependimento', nome: 'Arrependimento', grupo: 'Vida cristã',
      definicao: 'Mudança de mente e de direção diante de Deus, que leva a abandonar o pecado e a se voltar para ele. Foi o primeiro tema das 95 Teses de Lutero.',
      p: [['Mc 1:15', 'arrependei', 'A pregação inicial de Jesus.'], ['At 2:38', 'arrependei', 'Pedro no Pentecostes.'], ['At 3:19', 'arrependei', 'Arrependei-vos e convertei-vos.'],
          ['Lc 15:7', 'arrepende', 'Alegria no céu por um pecador.'], ['2Co 7:10', 'tristeza', 'Tristeza segundo Deus.'], ['Mt 3:8', 'frutos', 'Frutos dignos de arrependimento.'], ['1Jo 1:9', 'confessarmos', 'Confissão e perdão.']],
      contexto: 'No Antigo Testamento, a palavra mais comum é “voltar” (שׁוּב): voltar para Deus. No Novo, μετάνοια indica mudança de mente que aparece na vida (Mt 3:8).',
      leituras: [
        { nome: 'Arrependimento e fé juntos', quem: 'Visão comum a muitas tradições', resumo: 'Arrepender-se e crer são dois lados da mesma resposta ao evangelho.', textos: ['Mc 1:15', 'At 20:21'] },
        { nome: 'Penitência sacramental', quem: 'Católicos e ortodoxos', resumo: 'Além do arrependimento interior, há a confissão ao sacerdote no sacramento da penitência (reconciliação).', textos: ['Jo 20:23', 'Tg 5:16'] },
        { nome: 'Confissão direta a Deus', quem: 'Protestantes', resumo: 'Confessa-se a Deus diretamente; a confissão mútua entre irmãos é saudável, mas não é sacramento.', textos: ['1Jo 1:9', 'Tg 5:16', '1Tm 2:5'] }],
      objecoes: ['A ordem entre regeneração, arrependimento e fé é discutida entre reformados e arminianos.',
        'A tese 1 de Lutero (1517) lembra que, para Jesus, toda a vida do cristão é arrependimento, e não só um ato ritual.'],
      conclusao: 'Explícito no texto: Jesus e os apóstolos chamam todos ao arrependimento, que aparece em mudança de vida, e Deus perdoa quem confessa. A forma da confissão (sacramental ou direta) é ponto de divergência.',
      termos: ['G3341', 'G3340', 'H7725'] },

    { id: 'dizimos', nome: 'Dízimos e ofertas', grupo: 'Vida cristã',
      definicao: 'O dízimo é a décima parte. Na Lei de Moisés, sustentava os levitas, as festas e os pobres. A pergunta é se ele continua obrigatório para o cristão.',
      p: [['Hb 7:4', 'dízimo', 'Abraão deu o dízimo a Melquisedeque, antes da Lei (Gn 14:20).'], ['Lv 27:30', 'dízimo', 'O dízimo pertence ao SENHOR.'], ['Nm 18:21', 'levi', 'Dízimo como herança dos levitas.'],
          ['Dt 14:28-29', 'dízimo', 'Dízimo para o levita, o estrangeiro, o órfão e a viúva.'], ['Ml 3:10', 'dízimos', 'Trazei todos os dízimos à casa do tesouro.'], ['Mt 23:23', 'dízimo', 'Jesus aos fariseus: fazer isto sem omitir aquilo.'],
          ['1Co 16:2', 'semana', 'Separar no primeiro dia da semana, conforme a prosperidade.'], ['2Co 9:7', 'alegria', 'Cada um como propôs no coração; Deus ama quem dá com alegria.']],
      contexto: 'Malaquias fala a Israel no tempo do segundo templo, sob a aliança de Moisés; a “casa do tesouro” eram os depósitos do templo (Ne 13:12). Em Mateus 23:23, Jesus fala a fariseus que ainda viviam sob a Lei. As cartas não mencionam o dízimo como regra para as igrejas, mas tratam muito de generosidade.',
      leituras: [
        { nome: 'Dízimo obrigatório', quem: 'Muitas igrejas evangélicas e pentecostais', resumo: 'O dízimo é anterior à Lei (Abraão), foi confirmado por Jesus e continua como princípio de fidelidade.', textos: ['Gn 14:20', 'Ml 3:10', 'Mt 23:23'] },
        { nome: 'Dízimo como referência', quem: 'Diversos evangélicos', resumo: 'Não é lei para o cristão, mas um bom ponto de partida para a generosidade proporcional.', textos: ['1Co 16:2', '2Co 8:3'] },
        { nome: 'Generosidade voluntária', quem: 'Muitos estudiosos e várias tradições', resumo: 'O dízimo fazia parte da Lei de Moisés; o Novo Testamento ensina dar com alegria, com regularidade e proporção, sem fixar percentual.', textos: ['2Co 9:7', 'At 4:34-35', 'Gl 6:6'] }],
      objecoes: ['Abraão deu o dízimo uma vez, dos despojos de guerra; isso basta para estabelecer uma regra permanente?',
        'Mt 23:23 foi dito antes da cruz, a judeus sob a Lei; os defensores do dízimo respondem que Jesus não o revogou.',
        'O Novo Testamento ensina sustentar quem ensina a Palavra (1Co 9:14; Gl 6:6) e cuidar dos pobres, o que os dois lados aceitam.'],
      conclusao: 'Explícito no texto: o dízimo era parte da Lei e da prática de Israel; o Novo Testamento manda contribuir com generosidade, regularidade e alegria para a igreja e os necessitados. Se o dízimo é obrigatório para o cristão é ponto de interpretação.',
      termos: [] },

    { id: 'sabado', nome: 'Sábado', grupo: 'Vida cristã',
      definicao: 'O sétimo dia, separado para descanso na criação e nos Dez Mandamentos. A questão é se o cristão deve guardar o sábado, o domingo ou nenhum dia como lei.',
      p: [['Gn 2:2-3', 'sétimo', 'Deus descansa no sétimo dia.'], ['Êx 20:8-11', 'repouso', 'Quarto mandamento, ligado à criação.'], ['Dt 5:15', 'egito', 'O mesmo mandamento ligado à libertação do Egito.'],
          ['Mc 2:27-28', 'sábado', 'O sábado foi feito por causa do homem.'], ['At 20:7', 'semana', 'Reunião no primeiro dia da semana.'], ['Cl 2:16-17', 'sábados', 'Sábados como sombra das coisas futuras.'],
          ['Rm 14:5-6', 'dia', 'Um faz diferença entre dia e dia, outro não.'], ['Hb 4:9-10', 'repouso', 'Resta um repouso para o povo de Deus.'], ['Ap 1:10', 'dia', '“Dia do Senhor”.']],
      contexto: 'O sábado era sinal da aliança com Israel (Êx 31:13-17). Jesus o guardou e corrigiu interpretações rígidas. Os primeiros cristãos se reuniam no primeiro dia, dia da ressurreição; a relação entre esse costume e o mandamento é o centro do debate.',
      leituras: [
        { nome: 'Sábado do sétimo dia', quem: 'Adventistas do Sétimo Dia, Batistas do Sétimo Dia e outros', resumo: 'O mandamento é parte da lei moral, vem da criação e continua obrigatório no sétimo dia.', textos: ['Gn 2:2-3', 'Êx 20:8-11', 'Mt 5:17-18'] },
        { nome: 'Domingo como sábado cristão', quem: 'Tradição reformada e puritana', resumo: 'O princípio moral de um dia em sete continua, transferido para o domingo por causa da ressurreição.', textos: ['At 20:7', 'Ap 1:10', 'Hb 4:9'] },
        { nome: 'Cumprido em Cristo', quem: 'Católicos, luteranos e muitos evangélicos', resumo: 'O domingo é dia de culto e celebração da ressurreição; o descanso do sábado encontra cumprimento em Cristo.', textos: ['Cl 2:16-17', 'Rm 14:5-6', 'Hb 4:9-10'] }],
      objecoes: ['Colossenses 2:16 menciona “sábados”; sabatistas entendem ali sábados cerimoniais, não o semanal; outros discordam.',
        'Não há ordem explícita no Novo Testamento para mudar o dia; também não há ordem explícita para os gentios guardarem o sábado (At 15).',
        'Todas as leituras valorizam o descanso, o culto e a confiança em Deus que o sábado ensina.'],
      conclusao: 'Explícito no texto: o sábado foi dado na criação e na Lei, Jesus é Senhor do sábado, e os primeiros cristãos se reuniam no primeiro dia. Se o cristão deve guardar o sábado, o domingo ou nenhum dia como lei é interpretação.',
      termos: [] },

    { id: 'lei-graca', nome: 'Lei e graça', grupo: 'Vida cristã',
      definicao: 'Qual é o lugar da Lei de Moisés na vida de quem foi salvo pela graça em Cristo.',
      p: [['Mt 5:17-18', 'cumprir', 'Não vim abolir, mas cumprir.'], ['Jo 1:17', 'graça', 'A lei por Moisés; a graça e a verdade por Jesus.'], ['Rm 6:14', 'graça', 'Não estais debaixo da lei, mas da graça.'],
          ['Rm 3:31', 'lei', 'Anulamos a lei pela fé? De maneira nenhuma.'], ['Rm 7:12', 'santa', 'A lei é santa.'], ['Gl 3:24-25', 'tutor', 'A lei como tutor até Cristo.'],
          ['Jr 31:33', 'lei', 'Na nova aliança, a lei escrita no coração.'], ['Rm 13:8-10', 'amor', 'O amor cumpre a lei.']],
      contexto: 'Paulo escreve a igrejas com judeus e gentios, onde a questão prática era se os gentios deviam guardar circuncisão, comidas e festas (At 15; Gl 2). Ele critica o uso da Lei para se justificar, mas chama a Lei de santa.',
      leituras: [
        { nome: 'Três usos e três partes da lei', quem: 'Tradição reformada', resumo: 'Distingue lei moral, civil e cerimonial; a lei moral (resumida nos Dez Mandamentos) continua como regra de vida.', textos: ['Mt 5:17-19', 'Rm 3:31', 'Rm 7:12'] },
        { nome: 'Lei e evangelho', quem: 'Tradição luterana', resumo: 'A lei mostra o pecado e conduz a Cristo; o evangelho anuncia o perdão. As duas palavras não devem ser confundidas.', textos: ['Rm 3:20', 'Gl 3:24'] },
        { nome: 'Lei de Cristo', quem: 'Dispensacionalistas e teologia da nova aliança', resumo: 'A Lei de Moisés foi dada a Israel e cumprida em Cristo; o cristão vive pela “lei de Cristo”, expressa no Novo Testamento.', textos: ['1Co 9:20-21', 'Gl 6:2', 'Hb 8:13'] }],
      objecoes: ['A divisão entre lei moral, civil e cerimonial não aparece com esses nomes na Bíblia; seus defensores dizem que ela reflete o próprio uso dos textos.',
        'Quem diz que a Lei toda foi cumprida precisa explicar por que nove dos Dez Mandamentos são repetidos no Novo Testamento e Mt 5:19.'],
      conclusao: 'Explícito no texto: ninguém é justificado pelas obras da lei, a lei é santa e se cumpre no amor, e Cristo é o cumprimento da lei. Quanto da Lei de Moisés obriga diretamente o cristão é interpretação.',
      termos: ['G3551', 'G5485', 'H8451'] },

    { id: 'segunda-vinda', nome: 'Segunda vinda de Cristo', grupo: 'Últimas coisas',
      definicao: 'A volta pessoal e visível de Jesus no fim da história para julgar, ressuscitar os mortos e consumar o reino. É afirmada por todas as tradições cristãs e pelos credos antigos.',
      p: [['At 1:11', 'virá', 'Virá do mesmo modo como o vistes ir.'], ['Jo 14:3', 'virei', 'Virei outra vez e vos receberei.'], ['Mt 24:30', 'vindo', 'O Filho do homem vindo sobre as nuvens.'],
          ['Mt 24:36', 'dia', 'Ninguém sabe o dia nem a hora.'], ['1Ts 4:16-17', 'descerá', 'O Senhor descerá do céu.'], ['Hb 9:28', 'segunda', 'Aparecerá segunda vez.'], ['Ap 22:20', 'venho', 'Certamente cedo venho.'], ['2Pe 3:10', 'ladrão', 'Virá como ladrão.']],
      contexto: 'Os discípulos perguntaram sobre a destruição do templo e sobre a vinda de Jesus (Mt 24:3); parte da conversa trata do ano 70 d.C. e parte do fim da história, e os intérpretes divergem sobre onde passa a linha.',
      leituras: [
        { nome: 'Volta futura', quem: 'Praticamente todas as igrejas', resumo: 'Cristo voltará de forma pessoal e visível; a ordem dos acontecimentos é debatida (ver Milênio e Arrebatamento).', textos: ['At 1:11', 'Hb 9:28'] },
        { nome: 'Preterismo parcial', quem: 'Alguns reformados e outros', resumo: 'Muitas profecias de Mt 24 se cumpriram em 70 d.C., mas a volta final ainda é futura.', textos: ['Mt 24:34', 'Lc 21:20'] },
        { nome: 'Preterismo pleno', quem: 'Minoria, rejeitada pelos credos históricos', resumo: 'Considera que a volta de Cristo já aconteceu em 70 d.C.', textos: ['Mt 16:28'] }],
      objecoes: ['Jesus disse que ninguém sabe o dia (Mt 24:36); previsões de datas sempre falharam.', '“Esta geração não passará” (Mt 24:34) é um dos versículos mais discutidos.'],
      conclusao: 'Explícito no texto: Jesus voltará visivelmente, em dia que ninguém conhece, e os cristãos devem viver preparados. A sequência dos eventos finais é interpretação.',
      termos: ['G3952'] },

    { id: 'milenio', nome: 'Milênio', grupo: 'Últimas coisas',
      definicao: 'Os “mil anos” em que Satanás é preso e os santos reinam com Cristo (Ap 20). As interpretações divergem sobre quando e como isso acontece.',
      p: [['Ap 20:1-3', 'mil anos', 'Satanás preso por mil anos.'], ['Ap 20:4-6', 'mil anos', 'Reinarão com Cristo mil anos.'], ['Is 11:6-9', 'lobo', 'Paz na criação.'],
          ['Is 65:20', 'cem anos', 'Vida longa e morte ainda presente.'], ['1Co 15:24-26', 'reine', 'Cristo reina até pôr os inimigos debaixo dos pés.'], ['2Pe 3:8', 'mil anos', 'Um dia como mil anos.']],
      contexto: 'Apocalipse é literatura apocalíptica, cheia de símbolos e números (sete, doze, mil). Apocalipse 20 é o único texto que fala em mil anos; a pergunta é se o número é literal e se o capítulo vem depois do capítulo 19 na ordem do tempo.',
      leituras: [
        { nome: 'Pré-milenismo', quem: 'Pré-milenistas históricos e dispensacionalistas', resumo: 'Cristo volta antes de um reino de mil anos na terra.', textos: ['Ap 19:11-20:6', 'Is 11:6-9'] },
        { nome: 'Amilenismo', quem: 'Católicos, ortodoxos, muitos reformados e luteranos', resumo: 'O milênio é simbólico: é o reinado atual de Cristo, entre a primeira e a segunda vinda.', textos: ['Mt 12:29', 'Jo 12:31', 'Ef 2:6'] },
        { nome: 'Pós-milenismo', quem: 'Alguns reformados', resumo: 'O avanço do evangelho trará um longo período de paz e justiça antes da volta de Cristo.', textos: ['Mt 13:31-33', 'Sl 72:8'] }],
      objecoes: ['Ler os números do Apocalipse literalmente ou simbolicamente muda a conclusão; os dois lados admitem símbolos no livro.',
        'Is 65:20 fala de morte ainda presente; pré-milenistas veem ali o milênio; outros, uma linguagem poética da nova criação.'],
      conclusao: 'Explícito no texto: Cristo reina, Satanás será vencido e os santos reinarão com Cristo. Se o milênio é futuro e literal ou presente e simbólico é interpretação.',
      termos: ['G0932'] },

    { id: 'arrebatamento', nome: 'Arrebatamento', grupo: 'Últimas coisas',
      definicao: 'O encontro dos crentes, vivos e ressuscitados, com o Senhor “nos ares” (1Ts 4:17). O debate é se acontece separado da volta visível de Cristo e em que momento.',
      p: [['1Ts 4:16-17', 'arrebatados', 'Os mortos ressuscitam; os vivos são arrebatados.'], ['1Co 15:51-52', 'transformados', 'Todos seremos transformados.'], ['Jo 14:2-3', 'virei', 'Virei e vos levarei.'],
          ['Mt 24:29-31', 'aflição', 'Depois da aflição daqueles dias, os escolhidos são reunidos.'], ['Mt 24:40-41', 'levado', 'Um será levado, outro deixado.'], ['2Ts 2:1-3', 'reunião', 'Antes vem a apostasia.'], ['Ap 3:10', 'guardarei', 'Guardar da hora da provação.']],
      contexto: '1 Tessalonicenses 4 foi escrito para consolar irmãos sobre os que já tinham morrido. A palavra “encontro” (ἀπάντησις, v. 17) era usada para ir ao encontro de uma autoridade que chegava; alguns estudiosos veem aqui a recepção a Cristo que desce, outros não dão peso a isso.',
      leituras: [
        { nome: 'Pré-tribulacionismo', quem: 'Dispensacionalistas', resumo: 'A igreja é arrebatada antes da grande tribulação; a volta de Cristo tem duas fases.', textos: ['1Ts 1:10', 'Ap 3:10', '1Ts 5:9'] },
        { nome: 'Pós-tribulacionismo', quem: 'Pré-milenistas históricos', resumo: 'Arrebatamento e volta de Cristo são um só evento, depois da tribulação.', textos: ['Mt 24:29-31', '2Ts 2:1-3'] },
        { nome: 'Meio da tribulação e pré-ira', quem: 'Minorias entre os pré-milenistas', resumo: 'O arrebatamento acontece durante a tribulação, antes da ira final de Deus.', textos: ['Ap 11:15', '1Ts 5:9'] },
        { nome: 'Encontro na única volta', quem: 'Amilenistas, católicos, ortodoxos e muitos protestantes', resumo: 'O “arrebatamento” é o encontro dos crentes com Cristo na sua única vinda, que é visível e acompanhada do juízo.', textos: ['1Ts 4:16-17', 'Mt 25:31-32'] }],
      objecoes: ['1Ts 4:16 descreve uma vinda com brado e trombeta, nada secreta; pré-tribulacionistas respondem que o texto não fala de quando.',
        'Em Mt 24:40, “tomado” pode ser para salvação ou para juízo (comparar com o dilúvio em 24:39).'],
      conclusao: 'Explícito no texto: na vinda do Senhor, os mortos em Cristo ressuscitam e os vivos são transformados e arrebatados para estar com ele. Quando isso acontece em relação à tribulação é interpretação.',
      termos: ['G3952'] },

    { id: 'juizo-final', nome: 'Juízo final', grupo: 'Últimas coisas',
      definicao: 'O julgamento de todas as pessoas por Deus, por meio de Cristo, no fim da história.',
      p: [['Mt 25:31-32', 'nações', 'Todas as nações reunidas diante dele.'], ['2Co 5:10', 'tribunal', 'Todos compareceremos ao tribunal de Cristo.'], ['Rm 14:10-12', 'tribunal', 'Cada um dará conta de si.'],
          ['Ap 20:11-15', 'livros', 'O grande trono branco.'], ['Hb 9:27', 'juízo', 'Morrer uma vez, depois o juízo.'], ['At 17:31', 'dia', 'Dia determinado para julgar o mundo.'], ['Jo 5:28-29', 'ressurreição', 'Ressurreição para a vida e para a condenação.'], ['Rm 2:6', 'obras', 'Retribuirá a cada um segundo as suas obras.']],
      contexto: 'O juízo aparece como consolo para os que sofrem injustiça e como chamado ao arrependimento (At 17:30-31). Fala-se de julgamento conforme as obras ao lado da salvação pela graça.',
      leituras: [
        { nome: 'Um juízo geral', quem: 'Visão histórica da maioria', resumo: 'Um só juízo final de todos, depois da ressurreição, quando Cristo voltar.', textos: ['Mt 25:31-46', 'Jo 5:28-29'] },
        { nome: 'Vários juízos', quem: 'Dispensacionalistas', resumo: 'Distinguem o tribunal de Cristo para os crentes (recompensas), o juízo das nações e o grande trono branco.', textos: ['2Co 5:10', 'Mt 25:31-32', 'Ap 20:11-15'] }],
      objecoes: ['Como “segundo as obras” (Rm 2:6) combina com a salvação pela graça? Muitos entendem as obras como evidência da fé; outros, como critério real de recompensa.'],
      conclusao: 'Explícito no texto: todos serão julgados por Cristo, com justiça, e as obras aparecem no julgamento. O número de juízos e o papel exato das obras são pontos de interpretação.',
      termos: ['G2920', 'H4941'] },

    { id: 'ceu-inferno', nome: 'Céu e inferno', grupo: 'Últimas coisas',
      definicao: 'O destino final: comunhão com Deus na nova criação, ou separação dele. Há acordo sobre a realidade do juízo e divergência sobre a natureza do castigo.',
      p: [['Jo 14:2', 'moradas', 'Na casa do Pai há muitas moradas.'], ['Ap 21:1-4', 'novo céu', 'Novo céu e nova terra; Deus habita com os homens.'], ['2Pe 3:13', 'nova terra', 'Novos céus e nova terra, onde habita a justiça.'],
          ['Mt 25:46', 'eterno', 'Castigo eterno e vida eterna.'], ['Mc 9:43-48', 'fogo', 'O fogo que nunca se apaga.'], ['2Ts 1:9', 'eterna', 'Perdição eterna, longe da face do Senhor.'], ['Ap 20:14-15', 'lago', 'O lago de fogo, a segunda morte.']],
      contexto: 'O Novo Testamento usa várias imagens: fogo, trevas, choro, morte, perdição, exclusão. Geena era o vale de Hinom, ao sul de Jerusalém, ligado a cultos idólatras (Jr 7:31). A esperança final é descrita como nova criação, não apenas “ir para o céu”.',
      leituras: [
        { nome: 'Castigo eterno consciente', quem: 'Visão tradicional da maioria das igrejas', resumo: 'Os que rejeitam a Deus sofrem separação consciente e sem fim.', textos: ['Mt 25:46', 'Ap 14:11', 'Lc 16:23'] },
        { nome: 'Imortalidade condicional', quem: 'Adventistas e alguns evangélicos', resumo: 'Só Deus dá a imortalidade; os ímpios, depois do juízo, são destruídos e deixam de existir.', textos: ['Mt 10:28', 'Rm 6:23', '2Ts 1:9'] },
        { nome: 'Universalismo cristão', quem: 'Minoria, rejeitada pelas confissões históricas', resumo: 'Por fim, todos serão reconciliados com Deus.', textos: ['1Co 15:22', 'Cl 1:20'] }],
      objecoes: ['“Eterno” aplicado ao castigo e à vida em Mt 25:46: os tradicionais leem igual nos dois; condicionalistas falam de efeito eterno (destruição definitiva).',
        'Lucas 16 é uma parábola ou um relato? A resposta influencia quanto se tira dele sobre o estado depois da morte.'],
      conclusao: 'Explícito no texto: haverá vida eterna com Deus na nova criação e juízo eterno para quem o rejeita, descrito com imagens graves. A natureza exata do castigo é ponto de interpretação; o universalismo é minoritário.',
      termos: ['G1067', 'G0086', 'G0166', 'G3772'] },

    { id: 'estado-mortos', nome: 'Estado dos mortos', grupo: 'Últimas coisas',
      definicao: 'O que acontece com a pessoa entre a morte e a ressurreição final. Os cristãos concordam na esperança da ressurreição e divergem sobre o estado intermediário.',
      p: [['Lc 23:43', 'paraíso', 'Hoje estarás comigo no paraíso.'], ['2Co 5:8', 'deixar o corpo', 'Deixar o corpo e habitar com o Senhor.'], ['Fp 1:23', 'cristo', 'Partir e estar com Cristo é muito melhor.'],
          ['Ec 9:5', 'sabem', 'Os mortos não sabem coisa nenhuma.'], ['1Ts 4:13', 'morreram', 'Os que morreram; no grego, literalmente, “os que dormem”.'], ['Jo 11:11', 'dorme', 'Lázaro dorme.'], ['Ap 6:9-10', 'almas', 'As almas debaixo do altar clamam.'], ['Dn 12:2', 'dormem', 'Os que dormem no pó ressuscitarão.']],
      contexto: 'Eclesiastes observa a vida “debaixo do sol”, do ponto de vista humano. “Dormir” é uma imagem comum para a morte, que destaca a ressurreição. Em Lucas 23:43, os manuscritos antigos não têm pontuação: “em verdade te digo hoje, estarás…” ou “te digo: hoje estarás…”; a maioria das traduções faz a segunda leitura.',
      leituras: [
        { nome: 'Estado intermediário consciente', quem: 'Maioria das igrejas', resumo: 'Quem morre em Cristo está consciente com ele, aguardando a ressurreição do corpo.', textos: ['Lc 23:43', '2Co 5:8', 'Fp 1:23'] },
        { nome: 'Sono da alma', quem: 'Adventistas e outros', resumo: 'Os mortos ficam inconscientes até a ressurreição; “dormir” é literal quanto à consciência.', textos: ['Ec 9:5', 'Jo 11:11', 'Dn 12:2'] },
        { nome: 'Purgatório', quem: 'Igreja Católica', resumo: 'Os que morrem na graça de Deus, mas ainda imperfeitamente purificados, passam por uma purificação antes do céu. Protestantes rejeitam por falta de base nos livros que reconhecem.', textos: ['1Co 3:13-15'] }],
      objecoes: ['A base católica do purgatório inclui 2 Macabeus 12, livro que os protestantes não aceitam como canônico.',
        'Apocalipse 6:9-10 mostra almas conscientes, mas é uma visão simbólica; o peso dado a ela varia.'],
      conclusao: 'Explícito no texto: para o cristão, morrer é “estar com Cristo”, e a esperança final é a ressurreição do corpo. Se há consciência entre a morte e a ressurreição, e de que tipo, é ponto de interpretação.',
      termos: ['G0086', 'H7585', 'G3857', 'G0386'] }
  ];

  var POR_ID = {};
  DOUTRINAS.forEach(function (d) { POR_ID[d.id] = d; });

  // Palavras que ajudam a reconhecer o tema numa pergunta ou afirmação (modo Bereano)
  var PALAVRAS = {
    trindade: ['trindade', 'trino', 'triuno', 'jesus e deus', 'tres pessoas', 'unicismo'],
    'batismo-aguas': ['batismo', 'batizar', 'batizado', 'imersao', 'aspersao', 'bebe', 'crianca'],
    'batismo-espirito': ['batismo no espirito', 'batismo com o espirito', 'linguas', 'pentecostes', 'revestimento'],
    dons: ['dons', 'dom de', 'profecia', 'profetizar', 'linguas', 'cura', 'curas', 'milagres', 'cessaram', 'cessacion'],
    salvacao: ['salvacao', 'salvo', 'salva', 'perder a salvacao', 'vida eterna'],
    predestinacao: ['predestin', 'eleicao', 'eleitos', 'escolhidos', 'livre arbitrio', 'livre-arbitrio', 'calvin', 'arminian'],
    justificacao: ['justificacao', 'justificado', 'justificar', 'somente pela fe', 'so pela fe'],
    'fe-obras': ['obras', 'boas obras', 'fe sem obras'],
    santificacao: ['santificacao', 'santidade', 'santo', 'perfeicao', 'pecar'],
    arrependimento: ['arrepend', 'confissao', 'confessar', 'penitencia', 'perdao dos pecados'],
    dizimos: ['dizimo', 'dizimos', 'oferta', 'ofertas', 'contribuir', 'contribuicao'],
    sabado: ['sabado', 'domingo', 'dia do senhor', 'dia de descanso', 'guardar o dia'],
    'lei-graca': ['lei de moises', 'lei', 'graca', 'mandamentos', 'debaixo da lei'],
    'segunda-vinda': ['volta de jesus', 'volta de cristo', 'segunda vinda', 'vinda de jesus', 'fim do mundo', 'vai voltar', 'voltara', 'volta'],
    milenio: ['milenio', 'mil anos', 'milenar'],
    arrebatamento: ['arrebatamento', 'arrebatad', 'tribulacao', 'grande tribulacao'],
    'juizo-final': ['juizo', 'julgamento', 'tribunal', 'julgar'],
    'ceu-inferno': ['ceu', 'inferno', 'geena', 'lago de fogo', 'castigo eterno', 'aniquil'],
    'estado-mortos': ['morre', 'morrer', 'morte', 'mortos', 'alma', 'purgatorio', 'sono da alma', 'espirito dos mortos']
  };

  /** Doutrinas que combinam com um texto livre (nome, palavras-chave e definição). */
  function procurar(texto, normalizar) {
    var q = ' ' + normalizar(texto || '').replace(/[^a-z0-9]+/g, ' ') + ' ';
    var comuns = { cristao: 1, cristaos: 1, cristo: 1, jesus: 1, deus: 1, senhor: 1, biblia: 1, para: 1, todos: 1, quem: 1, deve: 1, pode: 1, sobre: 1 };
    var palavras = q.split(' ').filter(function (w) { return w.length > 3 && !comuns[w]; });
    return DOUTRINAS.map(function (d) {
      var pts = 0, forte = false, alvo = normalizar(d.nome), corpo = normalizar(d.definicao);
      (PALAVRAS[d.id] || []).forEach(function (k) { if (q.indexOf(' ' + normalizar(k)) >= 0) { pts += k.indexOf(' ') > 0 ? 5 : 3; forte = true; } });
      palavras.forEach(function (w) { var raiz = w.slice(0, Math.max(4, w.length - 2)); if (alvo.indexOf(raiz) >= 0) { pts += 3; forte = true; } else if (corpo.indexOf(raiz) >= 0) pts += 1; });
      return { d: d, pts: forte ? pts : 0 };
    }).filter(function (x) { return x.pts >= 3; }).sort(function (a, b) { return b.pts - a.pts; }).map(function (x) { return x.d; });
  }

  var API = { GRUPOS: GRUPOS, DOUTRINAS: DOUTRINAS, POR_ID: POR_ID, PALAVRAS: PALAVRAS, procurar: procurar };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Doutrinas = API;
})(typeof window !== 'undefined' ? window : this);
