/*
 * ATOS 2 — Assistente bíblico: dados curados e regras que a IA precisa seguir.
 * - Introduções dos 66 livros (redação própria, com cautela onde há debate).
 * - Lista fechada de obras de referência: a IA só pode SUGERIR estas obras, pelo id.
 * - Montagem das instruções e validação das respostas (referências conferidas, campos limpos).
 * O texto bíblico nunca vem da IA: o app sempre mostra o versículo a partir da tradução.
 * Navegador: window.A2Assistente · Node: module.exports
 */
(function (root) {
  'use strict';

  // [id, autoria, época, conteúdo e propósito]
  var INTRO = [
    ['GEN', 'Tradicionalmente atribuído a Moisés.', 'Narra desde a criação até a morte de José, no Egito.', 'Origens do mundo, da humanidade, do pecado e do povo de Israel; promessas e aliança de Deus com Abraão, Isaque e Jacó.'],
    ['EXO', 'Tradicionalmente atribuído a Moisés.', 'Saída de Israel do Egito; a data do êxodo é discutida (século XV ou XIII a.C.).', 'Libertação da escravidão, aliança no Sinai, Dez Mandamentos e construção do tabernáculo.'],
    ['LEV', 'Tradicionalmente atribuído a Moisés.', 'Instruções dadas no Sinai.', 'Sacrifícios, sacerdócio, pureza e santidade: como um povo pecador pode viver na presença do Deus santo.'],
    ['NUM', 'Tradicionalmente atribuído a Moisés.', 'Cerca de 40 anos de peregrinação no deserto.', 'Recenseamentos, murmuração e incredulidade do povo, fidelidade de Deus e preparação para entrar em Canaã.'],
    ['DEU', 'Tradicionalmente atribuído a Moisés; o relato de sua morte (cap. 34) foi acrescentado depois.', 'Discursos nas planícies de Moabe, antes da entrada em Canaã.', 'Renovação da aliança com a nova geração: amar a Deus de todo o coração e obedecer à sua Palavra.'],
    ['JOS', 'Autor não identificado no texto; a tradição judaica o atribui a Josué.', 'Conquista e partilha de Canaã depois da morte de Moisés.', 'Deus cumpre a promessa da terra; coragem, obediência e renovação da aliança.'],
    ['JDG', 'Autor não identificado; a tradição judaica cita Samuel.', 'Período entre Josué e a monarquia.', 'Ciclos de infidelidade, opressão, clamor e livramento por juízes; “cada um fazia o que parecia reto aos seus olhos”.'],
    ['RUT', 'Autor não identificado.', 'Época dos juízes.', 'A fidelidade de Rute, uma moabita, e a bondade de Boaz, o resgatador; Rute é bisavó de Davi.'],
    ['1SA', 'Autor não identificado; usa registros de Samuel, Natã e Gade (1Cr 29:29).', 'Século XI a.C.', 'Transição dos juízes para a monarquia: Samuel, Saul e a ascensão de Davi.'],
    ['2SA', 'Autor não identificado.', 'Reinado de Davi (por volta de 1010 a 970 a.C.).', 'Davi como rei, a aliança de Deus com sua casa (cap. 7), seu pecado e as consequências.'],
    ['1KI', 'Autor não identificado; a tradição judaica cita Jeremias.', 'De Salomão à divisão do reino (por volta de 930 a.C.) e aos reis seguintes.', 'Construção do templo, divisão entre Israel e Judá, ministério de Elias.'],
    ['2KI', 'Autor não identificado.', 'Até a queda de Samaria (722 a.C.) e de Jerusalém (586 a.C.).', 'Ministério de Eliseu, reis fiéis e infiéis e o exílio como consequência da desobediência.'],
    ['1CH', 'Autor não identificado; a tradição judaica cita Esdras.', 'Escrito depois do exílio.', 'Genealogias e o reinado de Davi, com ênfase no culto e no templo.'],
    ['2CH', 'Autor não identificado.', 'Escrito depois do exílio; vai de Salomão ao decreto de Ciro.', 'História de Judá com foco no templo, na fidelidade dos reis e na esperança de restauração.'],
    ['EZR', 'Tradicionalmente atribuído a Esdras, sacerdote e escriba.', 'Retorno do exílio a partir do decreto de Ciro (538 a.C.).', 'Reconstrução do templo e reforma do povo pela Palavra de Deus.'],
    ['NEH', 'Memórias de Neemias, em grande parte em primeira pessoa.', 'Século V a.C., sob domínio persa.', 'Reconstrução dos muros de Jerusalém, leitura da Lei e renovação da aliança.'],
    ['EST', 'Autor não identificado.', 'Pérsia, no reinado de Assuero (geralmente identificado com Xerxes I, século V a.C.).', 'O livramento dos judeus por meio de Ester e Mardoqueu; origem da festa de Purim. O nome de Deus não aparece, mas sua providência permeia a história.'],
    ['JOB', 'Autor e data desconhecidos.', 'Cenário semelhante ao da época dos patriarcas.', 'O sofrimento do justo, os limites da sabedoria humana e a soberania de Deus.'],
    ['PSA', 'Vários autores: Davi (muitos salmos), Asafe, os filhos de Corá, Salomão, Moisés (Sl 90) e outros não identificados.', 'Composto ao longo de séculos e organizado em cinco livros.', 'Orações e cânticos de louvor, lamento, confiança, arrependimento e gratidão; o hinário de Israel.'],
    ['PRO', 'Em grande parte de Salomão; também Agur (cap. 30), Lemuel (cap. 31) e outros sábios.', 'Reunido a partir do reinado de Salomão, com acréscimos posteriores (25:1).', 'Sabedoria para a vida diária; o temor do Senhor como princípio do conhecimento.'],
    ['ECC', 'O “Pregador, filho de Davi, rei em Jerusalém”; tradicionalmente Salomão.', 'Data discutida.', 'A vida “debaixo do sol” sem Deus é vaidade; conclusão: temer a Deus e guardar seus mandamentos.'],
    ['SNG', 'Atribuído a Salomão (1:1).', 'Data discutida.', 'Poema sobre o amor entre o noivo e a noiva; muitos leitores também veem nele uma figura do amor de Deus por seu povo.'],
    ['ISA', 'Isaías, filho de Amoz, profeta em Judá.', 'Por volta de 740 a 680 a.C. (reis Uzias a Ezequias). Muitos estudiosos atribuem os caps. 40–66 a autores posteriores; a tradição judaica e cristã o atribui a Isaías.', 'Juízo e consolo; a santidade de Deus; o Servo sofredor e a esperança messiânica.'],
    ['JER', 'Jeremias, com a ajuda do escriba Baruque.', 'Por volta de 627 a 586 a.C., até a queda de Jerusalém.', 'Chamado ao arrependimento, juízo pela Babilônia e promessa de uma nova aliança (31:31).'],
    ['LAM', 'Autor não identificado; tradicionalmente Jeremias.', 'Logo depois da destruição de Jerusalém em 586 a.C.', 'Lamentos poéticos (em forma de acróstico) pela cidade destruída, com esperança na misericórdia de Deus.'],
    ['EZK', 'Ezequiel, sacerdote levado ao exílio na Babilônia em 597 a.C.', 'Por volta de 593 a 571 a.C.', 'Visões da glória de Deus, juízo sobre Jerusalém e promessas de restauração: novo coração, ossos secos, novo templo.'],
    ['DAN', 'Daniel, judeu levado à Babilônia.', 'O livro situa os fatos no século VI a.C.; muitos estudiosos críticos o datam no século II a.C., e a posição tradicional o mantém no século VI.', 'Fidelidade a Deus num império pagão; Deus governa os reinos humanos; visões sobre o reino eterno.'],
    ['HOS', 'Oseias, profeta no reino do Norte (Israel).', 'Século VIII a.C.', 'O casamento com Gômer como figura do amor fiel de Deus por um povo infiel.'],
    ['JOL', 'Joel, filho de Petuel.', 'Data incerta.', 'Uma praga de gafanhotos como alerta do Dia do Senhor; promessa do derramamento do Espírito (citada em At 2).'],
    ['AMO', 'Amós, pastor de Tecoa, em Judá.', 'Século VIII a.C., profetizando ao reino do Norte.', 'Justiça social; Deus rejeita o culto de quem oprime o pobre.'],
    ['OBA', 'Obadias.', 'Data incerta; provavelmente depois de 586 a.C.', 'Juízo sobre Edom por se alegrar com a queda de Jerusalém; é o livro mais curto do Antigo Testamento.'],
    ['JON', 'Sobre Jonas, filho de Amitai, profeta do século VIII a.C. (2Rs 14:25).', 'Século VIII a.C.', 'A misericórdia de Deus alcança até Nínive, capital da Assíria, inimiga de Israel.'],
    ['MIC', 'Miqueias de Moresete, contemporâneo de Isaías.', 'Século VIII a.C.', 'Juízo contra a injustiça; praticar a justiça, amar a misericórdia e andar humildemente com Deus (6:8); o governante que viria de Belém (5:2).'],
    ['NAM', 'Naum, de Elcos.', 'Século VII a.C., antes da queda de Nínive em 612 a.C.', 'Anúncio da queda de Nínive; Deus é refúgio para quem confia nele.'],
    ['HAB', 'Habacuque.', 'Fim do século VII a.C., com a ascensão da Babilônia.', 'Diálogo com Deus sobre a injustiça; “o justo viverá pela sua fé” (2:4).'],
    ['ZEP', 'Sofonias, descendente de Ezequias.', 'Reinado de Josias (640 a 609 a.C.).', 'O Dia do Senhor e a alegria de Deus com o remanescente restaurado (3:17).'],
    ['HAG', 'Ageu.', '520 a.C., depois do retorno do exílio.', 'Exortação para retomar a reconstrução do templo.'],
    ['ZEC', 'Zacarias, contemporâneo de Ageu.', 'A partir de 520 a.C.', 'Visões de restauração e profecias messiânicas, como o rei humilde montado num jumento (9:9).'],
    ['MAL', 'Malaquias.', 'Século V a.C.', 'Culto negligente e infidelidade; promessa do mensageiro que prepararia o caminho do Senhor.'],
    ['MAT', 'Tradição antiga atribui ao apóstolo Mateus (Levi), cobrador de impostos.', 'Provavelmente entre os anos 50 e 70 d.C.; as datas variam entre os estudiosos.', 'Jesus é o Messias prometido que cumpre as Escrituras; organizado em torno de cinco grandes discursos, como o Sermão do Monte.'],
    ['MRK', 'Segundo a tradição antiga (Papias, citado por Eusébio), João Marcos, registrando a pregação de Pedro.', 'Muitos o consideram o evangelho mais antigo (anos 50 ou 60 d.C.).', 'Narrativa ágil de Jesus, o Filho de Deus que veio para servir e dar a vida (10:45).'],
    ['LUK', 'Lucas, médico e companheiro de Paulo (Cl 4:14).', 'Provavelmente nos anos 60 d.C.', 'Relato ordenado e pesquisado (1:1-4), dedicado a Teófilo; destaca os pobres, as mulheres, os excluídos e a salvação para todos.'],
    ['JHN', 'Tradicionalmente o apóstolo João, “o discípulo a quem Jesus amava”.', 'Geralmente datado no fim do século I.', 'Sinais e discursos “Eu sou”, escritos para que se creia que Jesus é o Cristo, o Filho de Deus (20:31).'],
    ['ACT', 'Lucas, como continuação do seu evangelho.', 'Termina com Paulo preso em Roma, por volta de 60 a 62 d.C.', 'O Espírito Santo leva o evangelho de Jerusalém até os confins da terra (1:8); a vida da igreja primitiva.'],
    ['ROM', 'Paulo.', 'Por volta de 57 d.C., provavelmente de Corinto.', 'Escrita a uma igreja que Paulo ainda não visitara: justificação pela fé, a situação de judeus e gentios e a vida transformada.'],
    ['1CO', 'Paulo.', 'Por volta de 54 a 55 d.C., de Éfeso.', 'Corinto era uma cidade portuária rica e diversa; a carta trata de divisões, moral, ceia, dons espirituais e ressurreição.'],
    ['2CO', 'Paulo.', 'Por volta de 55 a 56 d.C., da Macedônia.', 'Defesa do ministério apostólico, o poder de Deus na fraqueza e a coleta para os pobres de Jerusalém.'],
    ['GAL', 'Paulo.', 'Data discutida (entre cerca de 48 e 55 d.C.).', 'Contra a exigência da circuncisão para os gentios: justificação pela fé e liberdade em Cristo.'],
    ['EPH', 'Paulo, preso.', 'Por volta de 60 a 62 d.C.', 'A igreja como corpo de Cristo, a unidade de judeus e gentios e a nova vida em Cristo.'],
    ['PHP', 'Paulo, preso, provavelmente em Roma.', 'Por volta de 60 a 62 d.C.', 'Alegria e gratidão; a humildade de Cristo (2:5-11). Filipos era uma colônia romana.'],
    ['COL', 'Paulo, preso.', 'Por volta de 60 a 62 d.C.', 'A supremacia de Cristo diante de ensinos que misturavam filosofia, regras e práticas religiosas.'],
    ['1TH', 'Paulo, com Silvano e Timóteo.', 'Por volta de 50 a 51 d.C., de Corinto; uma das cartas mais antigas de Paulo.', 'Encorajamento a uma igreja nova; esperança na volta de Cristo e consolo sobre os que morreram.'],
    ['2TH', 'Paulo, com Silvano e Timóteo.', 'Pouco depois da primeira carta.', 'Correções sobre o Dia do Senhor e exortação ao trabalho.'],
    ['1TI', 'Paulo, a Timóteo, em Éfeso (alguns estudiosos discutem a autoria; a tradição a atribui a Paulo).', 'Anos 60 d.C.', 'Sã doutrina, oração, qualificações de líderes e cuidado com a igreja.'],
    ['2TI', 'Paulo, preso em Roma, perto do fim da vida.', 'Por volta de 64 a 67 d.C.', 'Última carta de Paulo: perseverança, fidelidade às Escrituras e passagem do bastão a Timóteo.'],
    ['TIT', 'Paulo, a Tito, em Creta.', 'Anos 60 d.C.', 'Liderança na igreja, sã doutrina e boas obras como fruto da graça.'],
    ['PHM', 'Paulo, preso.', 'Por volta de 60 a 62 d.C.', 'Pedido a Filemom para receber Onésimo, escravo que fugira, agora como irmão em Cristo.'],
    ['HEB', 'Autor desconhecido; já se sugeriram Paulo, Barnabé e Apolo.', 'Provavelmente antes da destruição do templo, em 70 d.C.', 'Jesus é superior aos anjos, a Moisés e ao sacerdócio antigo; exortação a cristãos tentados a desistir.'],
    ['JAS', 'Tiago, tradicionalmente o irmão do Senhor e líder da igreja em Jerusalém.', 'Provavelmente antes de 62 d.C.', 'A fé verdadeira se mostra nas obras; cuidado com a língua, os pobres e a sabedoria do alto.'],
    ['1PE', 'O apóstolo Pedro, de “Babilônia” (provavelmente Roma).', 'Por volta de 62 a 64 d.C.', 'Esperança viva e santidade para cristãos que sofrem como estrangeiros no mundo.'],
    ['2PE', 'Apresenta-se como do apóstolo Pedro (1:1); a autoria é discutida desde a antiguidade.', 'Perto do fim da vida de Pedro.', 'Crescimento na graça, alerta contra falsos mestres e certeza da volta de Cristo.'],
    ['1JN', 'Tradicionalmente o apóstolo João.', 'Fim do século I.', 'Comunhão com Deus, amor fraterno e certeza da salvação, contra mestres que negavam que Jesus veio em carne.'],
    ['2JN', '“O presbítero”, tradicionalmente o apóstolo João.', 'Fim do século I.', 'Carta curta à “senhora eleita”: andar na verdade e no amor e não acolher falsos mestres.'],
    ['3JN', '“O presbítero”, tradicionalmente o apóstolo João.', 'Fim do século I.', 'Carta a Gaio sobre a hospitalidade aos missionários e o mau exemplo de Diótrefes.'],
    ['JUD', 'Judas, irmão de Tiago; pela tradição, irmão do Senhor.', 'Provavelmente nos anos 60 a 80 d.C.', 'Batalhar pela fé entregue aos santos diante de falsos mestres.'],
    ['REV', 'João, exilado na ilha de Patmos (1:9).', 'Tradicionalmente no fim do século I, no governo de Domiciano.', 'Cartas às sete igrejas da Ásia e visões da vitória do Cordeiro; há várias linhas de interpretação (preterista, historicista, futurista e idealista).']
  ];
  var INTRODUCOES = {};
  INTRO.forEach(function (x) { INTRODUCOES[x[0]] = { livro: x[0], autoria: x[1], epoca: x[2], tema: x[3] }; });

  // Obras de referência que a IA pode sugerir para aprofundar (nunca como citação literal).
  var OBRAS = [
    { id: 'ndb', titulo: 'O Novo Dicionário da Bíblia', autor: 'J. D. Douglas (org.)', editora: 'Vida Nova', area: 'dicionário' },
    { id: 'chc-at', titulo: 'Comentário Histórico-Cultural da Bíblia: Antigo Testamento', autor: 'John H. Walton, Victor H. Matthews e Mark W. Chavalas', editora: 'Vida Nova', area: 'contexto AT' },
    { id: 'chc-nt', titulo: 'Comentário Histórico-Cultural da Bíblia: Novo Testamento', autor: 'Craig S. Keener', editora: 'Vida Nova', area: 'contexto NT' },
    { id: 'int-at', titulo: 'Introdução ao Antigo Testamento', autor: 'Raymond B. Dillard e Tremper Longman III', editora: 'Vida Nova', area: 'introdução AT' },
    { id: 'int-nt', titulo: 'Introdução ao Novo Testamento', autor: 'D. A. Carson, Douglas J. Moo e Leon Morris', editora: 'Vida Nova', area: 'introdução NT' },
    { id: 'tyndale', titulo: 'Série Cultura Bíblica (Comentários Tyndale)', autor: 'Vários autores', editora: 'Vida Nova / Mundo Cristão', area: 'comentário' },
    { id: 'fee', titulo: 'Entendes o que lês?', autor: 'Gordon D. Fee e Douglas Stuart', editora: 'Vida Nova', area: 'interpretação' },
    { id: 'halley', titulo: 'Manual Bíblico de Halley', autor: 'Henry H. Halley', editora: 'Vida', area: 'panorama' },
    { id: 'josefo', titulo: 'Antiguidades Judaicas', autor: 'Flávio Josefo (século I)', editora: 'fonte antiga', area: 'história' },
    { id: 'eusebio', titulo: 'História Eclesiástica', autor: 'Eusébio de Cesareia (século IV)', editora: 'fonte antiga', area: 'história da igreja' }
  ];
  var OBRA_POR_ID = {};
  OBRAS.forEach(function (o) { OBRA_POR_ID[o.id] = o; });

  // ---------------------------------------------------------------- instruções para a IA
  var REGRAS = [
    'Você é o assistente de estudo bíblico do aplicativo ATOS 2 (“De volta à doutrina dos apóstolos”). Escreva em português do Brasil, com linguagem simples, respeitosa e pastoral.',
    'A Bíblia é a autoridade final. Explique primeiro o que o texto diz no seu contexto (literário, histórico e cultural); só depois mostre a aplicação.',
    'Use as ferramentas para ler a passagem, o capítulo e a introdução do livro antes de responder. Não copie nem escreva por extenso o texto de versículos (o aplicativo mostra o texto da tradução); cite apenas referências, como “Jo 3:16”.',
    'Diferencie o que é certo do que é provável. Use “provavelmente”, “segundo a tradição” ou “não se sabe” quando for o caso. NUNCA invente datas, números, nomes, citações de autores, descobertas arqueológicas ou costumes. Se não tiver segurança, diga que não há informação segura.',
    'Quando cristãos que respeitam as Escrituras divergem (por exemplo: batismo, dons espirituais, profecia e fim dos tempos, governo da igreja), apresente as principais leituras com respeito, sem tomar partido e sem atacar denominações ou religiões.',
    'Não cite sites, livros ou autores, exceto ao indicar obras para aprofundar, e somente pelo id da lista fornecida. Essas obras são sugestões de leitura, não fontes de citação: não atribua a elas frases ou afirmações.',
    'Se a pessoa demonstrar sofrimento intenso, risco de vida ou de violência, acolha com carinho, incentive buscar ajuda imediata (no Brasil, CVV pelo telefone 188, ou SAMU 192) e alguém de confiança, como um pastor ou um profissional de saúde.'
  ].join('\n');

  function listaObras() { return OBRAS.map(function (o) { return o.id + ': ' + o.titulo + ' — ' + o.autor + ' (' + o.area + ')'; }).join('\n'); }

  var FORMATO_ESTUDO = '{"titulo": string (curto), "resumo": string (2 a 3 frases), "contexto_historico": string (quem, quando, onde, situação; até 120 palavras), ' +
    '"cultura": string (costumes, objetos, instituições ou expressões da época que ajudam a entender; até 120 palavras; vazio se não houver nada seguro), ' +
    '"sentido": string (o que o texto quer dizer no seu contexto e no conjunto da Bíblia; até 160 palavras), ' +
    '"palavras": [{"termo": string, "explicacao": string}] (0 a 3 termos importantes; não invente palavras hebraicas ou gregas: inclua somente as que você conhece com segurança), ' +
    '"ligacoes": [{"ref": "Livro cap:vers", "nota": string (até 25 palavras)}] (2 a 6 passagens relacionadas), ' +
    '"interpretacoes": [{"leitura": string, "explicacao": string}] (somente se houver divergência real entre cristãos; senão []), ' +
    '"aplicacao": string (até 80 palavras), "perguntas": [string] (2 a 3 perguntas para reflexão), "obras": [id] (0 a 3 ids da lista)}';

  var NIVEIS = {
    basico: 'Nível BÁSICO: linguagem simples para iniciantes, frases curtas; use cerca de metade dos limites de palavras; deixe "exegese" vazio.',
    intermediario: 'Nível INTERMEDIÁRIO: contexto e referências, linguagem acessível.',
    avancado: 'Nível AVANÇADO: exegese. Use palavras_originais para a passagem e preencha "exegese" (contexto literário, contexto canônico, estrutura do trecho, destinatários e intenção do autor). Em "palavras", inclua 2 a 4 termos do texto original com o número de Strong exatamente como a ferramenta devolveu.'
  };
  function promptEstudo(refTexto, sigla, pedido, nivel) {
    return REGRAS + '\n\nObras que você pode indicar (use só os ids):\n' + listaObras() +
      '\n\nTarefa: preparar um estudo sobre ' + refTexto + ' (tradução ' + sigla + ').' +
      (pedido ? '\nFoco pedido pela pessoa: ' + pedido : '') +
      '\n' + (NIVEIS[nivel] || NIVEIS.intermediario) +
      '\nAntes de escrever, use ler_passagem para a passagem e para o capítulo inteiro, introducao_livro para o livro e, se útil, referencias_cruzadas, palavras_originais e doutrina.' +
      '\nPalavras gregas ou hebraicas: cite somente as que vierem da ferramenta palavras_originais, com o Strong dela; não invente significados.' +
      '\nResponda somente em JSON, no formato: ' + FORMATO_ESTUDO.replace('"palavras": [{"termo": string, "explicacao": string}] (0 a 3 termos importantes; não invente palavras hebraicas ou gregas: inclua somente as que você conhece com segurança)',
        '"palavras": [{"termo": string, "strong": string ou "", "explicacao": string}] (0 a 4 termos; com strong só se veio de palavras_originais)').replace(', "obras": [id]', ', "exegese": {"contexto_literario": string, "contexto_canonico": string, "estrutura": string, "destinatarios_e_intencao": string} (vazio fora do nível avançado), "obras": [id]');
  }

  // Modo Bereano
  var CLASSES_BEREANO = {
    explicita: 'Está explícito no texto bíblico',
    conclusao: 'É uma conclusão tirada de vários textos',
    debatida: 'Cristãos fiéis à Escritura leem de formas diferentes',
    sem_base: 'Não encontramos base bíblica clara',
    contraria: 'Contradiz o que o texto bíblico afirma'
  };
  function promptBereano(afirmacao, sigla) {
    return REGRAS + '\n\nModo Bereano (At 17:11): examine a afirmação abaixo à luz das Escrituras, sem tomar partido de denominação.' +
      '\nAfirmação: “' + afirmacao + '”. Tradução: ' + sigla + '.' +
      '\nUse buscar_texto (várias buscas, com sinônimos), ler_passagem para ler cada texto no seu capítulo e doutrina para o tema curado do app.' +
      '\nClassifique com um destes valores: ' + Object.keys(CLASSES_BEREANO).map(function (k) { return k + ' (' + CLASSES_BEREANO[k] + ')'; }).join('; ') + '.' +
      ' Use "contraria" e "sem_base" somente quando estiver claro; em caso de dúvida, prefira "debatida" ou "conclusao".' +
      '\nResponda somente em JSON: {"afirmacao": string (reescrita de forma neutra), "classificacao": string, "resposta": string (até 80 palavras), ' +
      '"a_favor": [{"ref": "Livro cap:vers", "nota": string}] (textos usados para apoiar; 0 a 5), "limites": [{"ref": "Livro cap:vers", "nota": string}] (textos que equilibram, limitam ou contrariam; 0 a 5), ' +
      '"contexto": string (até 120 palavras: o que os principais textos significam no seu contexto), "leituras": [{"leitura": string, "explicacao": string}] (somente se houver divergência real), ' +
      '"explicito_x_interpretacao": string (até 60 palavras: o que está escrito e o que é conclusão), "perguntas": [string] (2 a 3)}';
  }
  function validarBereano(j, interpretar) {
    j = j && typeof j === 'object' ? j : {};
    var descartadas = [];
    function refs(l) { return (Array.isArray(l) ? l : []).map(function (x) { var s = txt(x && x.ref, 40), r = interpretar(s); if (!r.ok || r.soLivro) { descartadas.push(s); return null; } return { ref: r.ref, nota: txt(x.nota, 220) }; }).filter(Boolean).slice(0, 5); }
    var c = String(j.classificacao || '').toLowerCase().trim();
    var out = { afirmacao: txt(j.afirmacao, 300), classificacao: CLASSES_BEREANO[c] ? c : 'conclusao', resposta: txt(j.resposta, 700), a_favor: refs(j.a_favor), limites: refs(j.limites),
      contexto: txt(j.contexto, 1100), leituras: (Array.isArray(j.leituras) ? j.leituras : []).map(function (x) { return x && x.leitura ? { leitura: txt(x.leitura, 80), explicacao: txt(x.explicacao, 400) } : null; }).filter(Boolean).slice(0, 4),
      explicito: txt(j.explicito_x_interpretacao, 500), perguntas: (Array.isArray(j.perguntas) ? j.perguntas : []).map(function (x) { return txt(x, 200); }).filter(Boolean).slice(0, 3), descartadas: descartadas };
    if (!out.resposta && !out.contexto) throw new Error('A resposta veio vazia. Tente de novo.');
    return out;
  }

  var FORMATO_PESQUISA = '{"resumo": string (até 60 palavras: o que a Bíblia ensina sobre o assunto, sem citar texto por extenso), ' +
    '"versiculos": [{"ref": "Livro cap:vers ou cap:vers-vers", "motivo": string (até 20 palavras)}] (4 a 8 passagens, das mais importantes às menos), ' +
    '"sugestoes": [string] (0 a 3 buscas relacionadas, curtas)}';

  function promptPesquisa(pergunta, sigla) {
    return REGRAS + '\n\nTarefa: a pessoa quer encontrar passagens bíblicas. Pedido: “' + pergunta + '”. Tradução: ' + sigla + '.' +
      '\nUse buscar_texto com palavras e sinônimos diferentes (pode chamar várias vezes) e ler_passagem para conferir o contexto. Escolha passagens que de fato tratam do assunto no seu contexto; não use versículos isolados de modo que contrarie o sentido do texto.' +
      '\nResponda somente em JSON, no formato: ' + FORMATO_PESQUISA;
  }

  function promptPergunta(refTexto, estudo, pergunta, historico) {
    return REGRAS + '\n\nA pessoa está estudando ' + refTexto + '. Resumo do estudo já mostrado: ' + JSON.stringify({ resumo: estudo.resumo, sentido: estudo.sentido }).slice(0, 1500) +
      (historico && historico.length ? '\nPerguntas e respostas anteriores:\n' + historico.slice(-3).map(function (x) { return 'P: ' + x.p + '\nR: ' + x.r; }).join('\n').slice(0, 2500) : '') +
      '\n\nNova pergunta: ' + pergunta +
      '\nResponda em até 180 palavras, em texto simples (sem markdown, sem títulos). Use as ferramentas se precisar ler outras passagens. Ao mencionar passagens, use a forma “Livro cap:vers”. Se a pergunta fugir do estudo bíblico, responda com gentileza e traga a conversa de volta às Escrituras.';
  }

  // ---------------------------------------------------------------- validação das respostas
  function txt(s, max) { s = s == null ? '' : String(s); s = s.replace(/\s+/g, ' ').trim(); return max && s.length > max ? s.slice(0, max - 1).trim() + '…' : s; }

  /**
   * Valida um estudo devolvido pela IA. interpretar(ref) → {ok, ref}. Referências inválidas são descartadas.
   * Retorna { estudo, descartadas }.
   */
  function validarEstudo(j, interpretar, strongsValidos) {
    j = j && typeof j === 'object' ? j : {};
    var descartadas = [];
    var ligacoes = (Array.isArray(j.ligacoes) ? j.ligacoes : []).map(function (l) {
      var r = interpretar(txt(l && l.ref, 40));
      if (!r.ok) { descartadas.push(txt(l && l.ref, 40)); return null; }
      return { ref: r.ref, nota: txt(l.nota, 220) };
    }).filter(Boolean).slice(0, 6);
    var obras = (Array.isArray(j.obras) ? j.obras : []).map(function (id) { return OBRA_POR_ID[String(id)] ? String(id) : null; }).filter(Boolean);
    obras = obras.filter(function (id, i) { return obras.indexOf(id) === i; }).slice(0, 3);
    var estudo = {
      titulo: txt(j.titulo, 90), resumo: txt(j.resumo, 600), contexto_historico: txt(j.contexto_historico, 1100), cultura: txt(j.cultura, 1100),
      sentido: txt(j.sentido, 1400),
      palavras: (Array.isArray(j.palavras) ? j.palavras : []).map(function (p) {
        if (!p || !p.termo) return null;
        var st = /^[GH]\d{4}[A-Za-z]?$/.test(String(p.strong || '').trim()) ? String(p.strong).trim() : '';
        if (st && strongsValidos && !strongsValidos[st]) st = '';               // Strong que não está na passagem: descartado
        return { termo: txt(p.termo, 40), strong: st, explicacao: txt(p.explicacao, 300) };
      }).filter(Boolean).slice(0, 4),
      exegese: j.exegese && typeof j.exegese === 'object' ? { literario: txt(j.exegese.contexto_literario, 700), canonico: txt(j.exegese.contexto_canonico, 700), estrutura: txt(j.exegese.estrutura, 700), intencao: txt(j.exegese.destinatarios_e_intencao, 700) } : null,
      ligacoes: ligacoes,
      interpretacoes: (Array.isArray(j.interpretacoes) ? j.interpretacoes : []).map(function (p) { return p && p.leitura ? { leitura: txt(p.leitura, 80), explicacao: txt(p.explicacao, 400) } : null; }).filter(Boolean).slice(0, 4),
      aplicacao: txt(j.aplicacao, 700),
      perguntas: (Array.isArray(j.perguntas) ? j.perguntas : []).map(function (p) { return txt(p, 200); }).filter(Boolean).slice(0, 3),
      obras: obras
    };
    if (!estudo.resumo && !estudo.sentido) throw new Error('A resposta veio vazia. Tente de novo.');
    return { estudo: estudo, descartadas: descartadas };
  }

  function validarPesquisa(j, interpretar) {
    j = j && typeof j === 'object' ? j : {};
    var vistos = {}, descartadas = [];
    var versiculos = (Array.isArray(j.versiculos) ? j.versiculos : []).map(function (x) {
      var s = txt(x && x.ref, 40), r = interpretar(s);
      if (!r.ok || r.soLivro || r.ref.v1 == null) { descartadas.push(s); return null; }
      var k = r.ref.livro + r.ref.cap + ':' + r.ref.v1;
      if (vistos[k]) return null; vistos[k] = 1;
      // limita trechos longos a 6 versículos
      if (r.ref.cap2 === r.ref.cap && r.ref.v2 - r.ref.v1 > 5) r.ref.v2 = r.ref.v1 + 5;
      if (r.ref.cap2 !== r.ref.cap) { r.ref.cap2 = r.ref.cap; r.ref.v2 = r.ref.v1; }
      return { ref: r.ref, motivo: txt(x.motivo, 160) };
    }).filter(Boolean).slice(0, 8);
    return { resumo: txt(j.resumo, 500), versiculos: versiculos, sugestoes: (Array.isArray(j.sugestoes) ? j.sugestoes : []).map(function (s) { return txt(s, 60); }).filter(Boolean).slice(0, 3), descartadas: descartadas };
  }

  /** Encontra referências “Livro cap:vers” num texto livre (para torná-las clicáveis). */
  function referenciasNoTexto(texto, interpretar) {
    var out = [], re = /((?:[1-3]\s?)?[A-Za-zÀ-ÿ]{2,}\.?\s\d{1,3}:\d{1,3}(?:-\d{1,3})?)/g, m;
    texto = String(texto || '');
    while ((m = re.exec(texto))) { var r = interpretar(m[1]); if (r.ok && !r.soLivro) out.push({ inicio: m.index, fim: m.index + m[1].length, ref: r.ref }); }
    return out;
  }

  /** Sinais de crise numa pergunta: o app mostra o apoio do CVV antes de qualquer resposta. */
  function sinalDeCrise(s) {
    return /\b(suic[ií]d|me matar|tirar (a )?minha (pr[oó]pria )?vida|quero morrer|n[aã]o quero (mais )?viver|me machucar|automutila|acabar com (a )?minha vida)/i.test(String(s || ''));
  }


  /**
   * Lê as referências cruzadas da Almeida 1911 (grafia atualizada), já com abreviações do app:
   * "cap. 1:13; Gl 6:15; Tt 3:5", "v. 5", "Sl 8:3 e 33:6". livro/cap: onde a nota está.
   * Devolve textos de referência ("Gl 6:15") para conferir com interpretar().
   */
  function refsDaNota1911(texto, livroAbrev, cap) {
    var out = [], atual = livroAbrev;
    String(texto || '').split(/;|\.\s(?=[1-3]?\s?[A-ZÁÉÍÓÚÊÔ])/).forEach(function (parte) {
      parte = parte.trim().replace(/\.$/, '');
      if (!parte) return;
      parte.split(/\s+e\s+|,\s*(?=\d+:)/).forEach(function (p, i) {
        p = p.trim().replace(/\.$/, '');
        var m;
        if ((m = /^cap\.?\s*(\d+(?::\d+(?:-\d+)?)?)$/i.exec(p))) { out.push(livroAbrev + ' ' + m[1]); atual = livroAbrev; return; }
        if ((m = /^v(?:er)?\.?\s*(\d+(?:-\d+)?)$/i.exec(p))) { out.push(livroAbrev + ' ' + cap + ':' + m[1]); return; }
        if ((m = /^((?:[1-3]\s?)?[A-Za-zÀ-ÿ]+)\s+(\d+(?::\d+(?:-\d+)?)?)$/.exec(p))) { atual = m[1]; out.push(m[1] + ' ' + m[2]); return; }
        if ((m = /^(\d+:\d+(?:-\d+)?)$/.exec(p)) && i > 0) { out.push(atual + ' ' + m[1]); return; }
      });
    });
    return out;
  }

  // Palavras que não ajudam na busca do modo guia
  var VAZIAS = ('a o as os e de do da dos das em no na nos nas um uma uns umas que se por para com sem sobre ao aos à às é ser foi como qual quais quem onde quando ' +
    'biblia bíblia versiculo versículo versiculos versículos texto textos passagem passagens diz dizem fala falam ensina ensinam deus senhor quero preciso me mim meu minha ' +
    'algo coisa coisas tudo mostrar mostre eu tu ele ela ou ja já so só ha há mais muito pra pro').split(' ');
  function termosDaPergunta(q, normalizar) {
    var vazias = {}; VAZIAS.forEach(function (w) { vazias[normalizar(w)] = 1; });
    return normalizar(q).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 1 && !vazias[w]; });
  }
  /** Temas curados que combinam com a pergunta (nome ou termos). */
  function temasDaPergunta(q, temas, normalizar) {
    var ts = termosDaPergunta(q, normalizar);
    return temas.filter(function (t) {
      var nomes = [t.nome].concat(t.termos || []).map(normalizar);
      return ts.some(function (w) { return nomes.some(function (n) { return n === w || (w.length >= 4 && n.length >= 4 && (n.indexOf(w.slice(0, Math.max(4, w.length - 2))) === 0 || w.indexOf(n.slice(0, Math.max(4, n.length - 2))) === 0)); }); });
    });
  }

  var API = { INTRODUCOES: INTRODUCOES, OBRAS: OBRAS, OBRA_POR_ID: OBRA_POR_ID, REGRAS: REGRAS, promptEstudo: promptEstudo, promptPesquisa: promptPesquisa, promptBereano: promptBereano, validarBereano: validarBereano, CLASSES_BEREANO: CLASSES_BEREANO,
    promptPergunta: promptPergunta, validarEstudo: validarEstudo, validarPesquisa: validarPesquisa, referenciasNoTexto: referenciasNoTexto, sinalDeCrise: sinalDeCrise, txt: txt, refsDaNota1911: refsDaNota1911, termosDaPergunta: termosDaPergunta, temasDaPergunta: temasDaPergunta };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Assistente = API;
})(typeof window !== 'undefined' ? window : this);
