/*
 * ATOS 2 — Mural de curiosidades: as 95 Teses de Lutero (tradução própria) e curiosidades
 * históricas conferidas em fontes publicadas. Curiosidades numéricas da Bíblia são CALCULADAS
 * a partir da tradução escolhida (função estatisticas), nunca digitadas à mão.
 * Navegador: window.A2Mural · Node: module.exports
 */
(function (root) {
  'use strict';

  // ------------------------------------------------------------------ 95 Teses
  var TESES_INTRO = {
    titulo: 'As 95 Teses',
    original: 'Disputatio pro declaratione virtutis indulgentiarum',
    traducaoTitulo: 'Debate para esclarecer o poder das indulgências',
    paragrafos: [
      'Em 31 de outubro de 1517, Martinho Lutero, monge agostiniano e professor de teologia na Universidade de Wittenberg, enviou estas 95 proposições, escritas em latim, ao arcebispo Alberto de Mainz, junto com uma carta pedindo que a pregação das indulgências fosse examinada. A carta ainda existe; a data é lembrada como o início da Reforma Protestante.',
      'As indulgências eram vendidas, entre outros fins, para a reconstrução da Basílica de São Pedro, em Roma. Lutero não escreveu um manifesto, mas teses para um debate acadêmico: afirmações curtas, numeradas, para serem discutidas publicamente.',
      'A cena de Lutero pregando as teses na porta da Igreja do Castelo vem de um relato de Filipe Melanchthon publicado em 1546, quase 30 anos depois. Melanchthon ainda não morava em Wittenberg em 1517, e os historiadores discutem se a afixação aconteceu, e em que dia. Era costume da universidade anunciar debates nas portas das igrejas.',
      'Em poucos meses as teses foram impressas e traduzidas para o alemão, e se espalharam pela Alemanha. A porta original de madeira se perdeu num incêndio no século XVIII; a porta atual, de bronze, traz o texto latino das teses.',
      'Ao ler, lembre-se: as teses mostram o pensamento de Lutero em 1517. Ele ainda falava do purgatório e reconhecia a autoridade do papa. Ensinos que marcariam a Reforma, como a justificação somente pela fé, foram desenvolvidos por ele nos anos seguintes, a partir do estudo das Escrituras.'
    ],
    traducao: 'Tradução do ATOS 2, feita a partir do texto latino de 1517 (domínio público) e conferida com a tradução inglesa publicada em Works of Martin Luther (Filadélfia, 1915, domínio público). Pode ser copiada livremente.'
  };

  // Grupos temáticos para navegar (intervalos inclusivos)
  var TESES_GRUPOS = [
    { de: 1, ate: 4, nome: 'O arrependimento de toda a vida' },
    { de: 5, ate: 7, nome: 'O que o papa pode perdoar' },
    { de: 8, ate: 29, nome: 'Cânones, morte e purgatório' },
    { de: 30, ate: 40, nome: 'Contrição e perdão verdadeiro' },
    { de: 41, ate: 52, nome: '“Deve-se ensinar aos cristãos”' },
    { de: 53, ate: 55, nome: 'A Palavra de Deus em primeiro lugar' },
    { de: 56, ate: 68, nome: 'O verdadeiro tesouro da Igreja' },
    { de: 69, ate: 80, nome: 'Os pregadores de indulgências' },
    { de: 81, ate: 91, nome: 'As perguntas dos leigos' },
    { de: 92, ate: 95, nome: 'A cruz de Cristo' }
  ];

  // Texto das teses. "refs": passagens a que a tese alude (para abrir na Bíblia).
  var TESES = [
    { t: 'Quando nosso Senhor e Mestre Jesus Cristo disse “Arrependei-vos”, quis que toda a vida dos fiéis fosse arrependimento.', refs: ['Mt 4:17'] },
    { t: 'Essa palavra não pode ser entendida como a penitência sacramental, isto é, a confissão e a satisfação administradas pelo ministério dos sacerdotes.' },
    { t: 'Também não se refere apenas ao arrependimento interior; pelo contrário, o arrependimento interior não é nada se não produzir, por fora, várias mortificações da carne.' },
    { t: 'Por isso a pena continua enquanto continua o ódio de si mesmo (isto é, o verdadeiro arrependimento interior), ou seja, até a entrada no reino dos céus.' },
    { t: 'O papa não quer nem pode perdoar penas, a não ser aquelas que ele mesmo impôs, por sua autoridade ou pela dos cânones.' },
    { t: 'O papa não pode perdoar culpa alguma, a não ser declarando e confirmando que ela foi perdoada por Deus, ou perdoando os casos reservados a ele; se estes fossem desprezados, a culpa permaneceria inteira.' },
    { t: 'Deus não perdoa a culpa de ninguém sem, ao mesmo tempo, sujeitá-lo, humilhado em tudo, ao sacerdote, seu representante.' },
    { t: 'Os cânones penitenciais são impostos apenas aos vivos; segundo eles, nada deve ser imposto aos que estão para morrer.' },
    { t: 'Por isso o Espírito Santo nos faz bem por meio do papa quando este, em seus decretos, sempre abre exceção para os casos de morte e de necessidade.' },
    { t: 'Agem com ignorância e mal os sacerdotes que, aos moribundos, reservam penitências canônicas para o purgatório.' },
    { t: 'Esse joio de transformar a pena canônica em pena do purgatório parece ter sido semeado enquanto os bispos dormiam.', refs: ['Mt 13:25'] },
    { t: 'Antigamente, as penas canônicas eram impostas não depois, mas antes da absolvição, como prova da verdadeira contrição.' },
    { t: 'Os moribundos pagam tudo com a morte; já estão mortos para as leis dos cânones e, por direito, livres delas.' },
    { t: 'A saúde espiritual, ou o amor, ainda imperfeitos do moribundo trazem consigo, necessariamente, grande temor; e tanto maior quanto menor for esse amor.' },
    { t: 'Esse temor e esse horror bastam por si sós (para não falar de outras coisas) para constituir a pena do purgatório, porque estão muito perto do horror do desespero.' },
    { t: 'Inferno, purgatório e céu parecem diferir como diferem o desespero, o quase desespero e a segurança.' },
    { t: 'Parece necessário que, nas almas do purgatório, assim como o horror diminui, o amor aumente.' },
    { t: 'E não parece provado, nem por argumentos nem pelas Escrituras, que elas estejam fora da condição de merecer ou de crescer no amor.' },
    { t: 'Também não parece provado que elas, ao menos todas, estejam certas e seguras da própria bem-aventurança, ainda que nós estejamos totalmente certos disso.' },
    { t: 'Portanto, ao falar em “perdão pleno de todas as penas”, o papa não quer dizer simplesmente todas, mas apenas as que ele mesmo impôs.' },
    { t: 'Erram, portanto, os pregadores de indulgências que dizem que, pelas indulgências do papa, a pessoa fica livre de toda pena e é salva.' },
    { t: 'Na verdade, o papa não perdoa às almas do purgatório nenhuma pena que, segundo os cânones, elas deveriam ter pago nesta vida.' },
    { t: 'Se é possível conceder a alguém o perdão de absolutamente todas as penas, é certo que isso só é dado aos mais perfeitos, isto é, a pouquíssimos.' },
    { t: 'Por isso a maior parte do povo é, necessariamente, enganada por essa promessa indistinta e pomposa de livramento da pena.' },
    { t: 'O mesmo poder que o papa tem sobre o purgatório de modo geral, qualquer bispo ou pároco tem de modo particular em sua diocese ou paróquia.' },
    { t: 'O papa faz muito bem em conceder perdão às almas não pelo poder das chaves (que ali não tem), mas por meio de intercessão.' },
    { t: 'Pregam invenção humana os que dizem que, assim que a moeda tilinta na caixa, a alma sai voando do purgatório.' },
    { t: 'É certo que, quando a moeda tilinta na caixa, o lucro e a ganância podem aumentar; mas a intercessão da Igreja depende somente da vontade de Deus.' },
    { t: 'Quem sabe se todas as almas do purgatório querem ser resgatadas, como se conta de são Severino e são Pascoal?' },
    { t: 'Ninguém tem certeza da sinceridade da própria contrição, muito menos de ter alcançado o perdão pleno.' },
    { t: 'Tão raro quanto quem se arrepende de verdade é quem adquire indulgências de verdade; isto é, raríssimo.' },
    { t: 'Serão condenados eternamente, junto com seus mestres, os que se julgam seguros da salvação por terem cartas de indulgência.' },
    { t: 'É preciso ter muito cuidado com os que dizem que as indulgências do papa são aquele dom inestimável de Deus pelo qual a pessoa é reconciliada com Deus.' },
    { t: 'Pois essas graças das indulgências dizem respeito apenas às penas da satisfação sacramental, estabelecidas por homens.' },
    { t: 'Não pregam de forma cristã os que ensinam que não é necessária a contrição para quem quer resgatar almas ou comprar cartas de confissão.' },
    { t: 'Todo cristão verdadeiramente arrependido tem pleno perdão da pena e da culpa, que lhe pertence mesmo sem cartas de indulgência.' },
    { t: 'Todo verdadeiro cristão, vivo ou morto, participa de todos os bens de Cristo e da Igreja, por dádiva de Deus, mesmo sem cartas de indulgência.' },
    { t: 'Mesmo assim, o perdão e a participação concedidos pelo papa não devem ser desprezados, porque (como eu disse) são uma declaração do perdão de Deus.' },
    { t: 'É dificílimo, mesmo para os teólogos mais sábios, exaltar diante do povo, ao mesmo tempo, a fartura das indulgências e a verdade da contrição.' },
    { t: 'A contrição verdadeira busca e ama as penas; a fartura das indulgências as afrouxa e leva a odiá-las, ou ao menos dá ocasião para isso.' },
    { t: 'As indulgências apostólicas devem ser pregadas com cautela, para que o povo não pense, erradamente, que elas valem mais que as outras boas obras de amor.' },
    { t: 'Deve-se ensinar aos cristãos que não é intenção do papa que a compra de indulgências seja comparada, de modo algum, às obras de misericórdia.' },
    { t: 'Deve-se ensinar aos cristãos que quem dá ao pobre ou empresta a quem precisa faz melhor do que se comprasse indulgências.' },
    { t: 'Porque pela obra de amor o amor cresce e a pessoa se torna melhor; pelas indulgências ela não se torna melhor, apenas mais livre da pena.' },
    { t: 'Deve-se ensinar aos cristãos que quem vê um necessitado e, deixando-o de lado, gasta com indulgências, não compra as indulgências do papa, mas a indignação de Deus.', refs: ['1Jo 3:17'] },
    { t: 'Deve-se ensinar aos cristãos que, a não ser que tenham bens de sobra, devem guardar o necessário para a própria casa e de modo nenhum gastá-lo com indulgências.' },
    { t: 'Deve-se ensinar aos cristãos que a compra de indulgências é livre, não obrigatória.' },
    { t: 'Deve-se ensinar aos cristãos que o papa, ao conceder indulgências, precisa e deseja mais uma oração sincera por ele do que dinheiro oferecido às pressas.' },
    { t: 'Deve-se ensinar aos cristãos que as indulgências do papa são úteis se não confiarem nelas, mas muito prejudiciais se, por causa delas, perderem o temor de Deus.' },
    { t: 'Deve-se ensinar aos cristãos que, se o papa conhecesse as extorsões dos pregadores de indulgências, preferiria ver a Basílica de São Pedro reduzida a cinzas a vê-la construída com a pele, a carne e os ossos de suas ovelhas.' },
    { t: 'Deve-se ensinar aos cristãos que o papa, como é seu dever, estaria disposto a dar do próprio dinheiro, vendendo até a Basílica de São Pedro se preciso, a muitos daqueles de quem certos pregadores de indulgências tiram dinheiro.' },
    { t: 'É vã a confiança na salvação por cartas de indulgência, ainda que o comissário, ou até o próprio papa, desse a própria alma como garantia.' },
    { t: 'São inimigos de Cristo e do papa os que, para que se preguem indulgências, mandam que a Palavra de Deus se cale completamente nas outras igrejas.' },
    { t: 'Faz-se injustiça à Palavra de Deus quando, num mesmo sermão, se gasta com as indulgências tempo igual ou maior do que com ela.' },
    { t: 'A intenção do papa só pode ser esta: se as indulgências, que são o menor, são celebradas com um sino, uma procissão e uma cerimônia, o evangelho, que é o maior, deve ser pregado com cem sinos, cem procissões e cem cerimônias.' },
    { t: 'Os tesouros da Igreja, de onde o papa tira as indulgências, não são suficientemente mencionados nem conhecidos pelo povo de Cristo.' },
    { t: 'É evidente que não são tesouros materiais, pois muitos pregadores não os distribuem com facilidade; apenas os ajuntam.' },
    { t: 'Também não são os méritos de Cristo e dos santos, porque estes, sempre e sem o papa, produzem a graça no homem interior e a cruz, a morte e o inferno no homem exterior.' },
    { t: 'São Lourenço disse que os tesouros da Igreja são os pobres da Igreja, mas falou de acordo com o uso da palavra em seu tempo.' },
    { t: 'Sem temeridade, dizemos que esse tesouro são as chaves da Igreja, dadas pelo mérito de Cristo.', refs: ['Mt 16:19'] },
    { t: 'Pois é claro que, para o perdão das penas e dos casos reservados, basta o poder do papa.' },
    { t: 'O verdadeiro tesouro da Igreja é o santíssimo evangelho da glória e da graça de Deus.' },
    { t: 'Mas esse tesouro é, com razão, o mais odiado, porque faz dos primeiros os últimos.', refs: ['Mt 20:16'] },
    { t: 'Já o tesouro das indulgências é, com razão, o mais apreciado, porque faz dos últimos os primeiros.' },
    { t: 'Assim, os tesouros do evangelho são as redes com que, antigamente, se pescavam homens de posses.', refs: ['Mt 4:19'] },
    { t: 'Os tesouros das indulgências são as redes com que hoje se pescam as posses dos homens.' },
    { t: 'As indulgências que os pregadores anunciam aos gritos como “as maiores graças” são de fato as maiores, mas para promover o lucro.' },
    { t: 'Na verdade, são as menores de todas quando comparadas à graça de Deus e à piedade da cruz.' },
    { t: 'Bispos e párocos são obrigados a receber com toda a reverência os comissários das indulgências apostólicas.' },
    { t: 'Mas são muito mais obrigados a vigiar com todos os olhos e escutar com todos os ouvidos, para que esses homens não preguem os próprios sonhos no lugar do que o papa lhes confiou.' },
    { t: 'Quem falar contra a verdade das indulgências apostólicas, seja anátema e maldito.' },
    { t: 'Mas quem se opuser à licenciosidade e ao descaramento das palavras dos pregadores de indulgências, seja bendito.' },
    { t: 'Assim como o papa, com justiça, condena com veemência os que, por qualquer artifício, tramam fraudes contra o comércio das indulgências,' },
    { t: 'muito mais quer condenar os que, sob pretexto de indulgências, tramam fraudes contra o santo amor e a verdade.' },
    { t: 'Achar que as indulgências papais são tão grandes que poderiam absolver alguém mesmo que, por absurdo, tivesse violentado a mãe de Deus, é loucura.' },
    { t: 'Dizemos, ao contrário, que as indulgências papais não podem tirar nem o menor dos pecados veniais, no que diz respeito à culpa.' },
    { t: 'Dizer que nem mesmo são Pedro, se fosse papa hoje, poderia conceder graças maiores, é blasfêmia contra são Pedro e contra o papa.' },
    { t: 'Dizemos, ao contrário, que este e qualquer papa têm graças maiores, a saber, o evangelho, os poderes, os dons de curar etc., como em 1 Coríntios 12.', refs: ['1Co 12:28'] },
    { t: 'Dizer que a cruz com as armas papais, erguida com pompa, equivale à cruz de Cristo, é blasfêmia.' },
    { t: 'Prestarão contas os bispos, párocos e teólogos que permitem que tais discursos se espalhem entre o povo.' },
    { t: 'Essa pregação desenfreada de indulgências faz com que nem para homens instruídos seja fácil defender a reverência devida ao papa contra as calúnias, ou ao menos contra as perguntas afiadas dos leigos.' },
    { t: 'Por exemplo: “Por que o papa não esvazia o purgatório por causa do santíssimo amor e da extrema necessidade das almas, a mais justa de todas as causas, se resgata um número sem fim de almas por causa do funestíssimo dinheiro para construir uma basílica, a causa mais banal?”' },
    { t: 'Ainda: “Por que continuam as missas pelos mortos e de aniversário de falecimento, e por que o papa não devolve nem permite que se retirem as doações feitas por eles, se já é errado orar pelos que foram resgatados?”' },
    { t: 'Ainda: “Que nova piedade de Deus e do papa é essa, que, por dinheiro, permite a um ímpio e inimigo resgatar uma alma piedosa e amiga de Deus, mas não a resgata por amor gratuito, por causa da necessidade dessa mesma alma piedosa e amada?”' },
    { t: 'Ainda: “Por que os cânones penitenciais, que de fato e pelo desuso há muito estão revogados e mortos, ainda são resgatados com dinheiro, pela concessão de indulgências, como se estivessem em pleno vigor?”' },
    { t: 'Ainda: “Por que o papa, cuja fortuna hoje é maior que a dos mais ricos Crassos, não constrói esta única Basílica de São Pedro com o próprio dinheiro, em vez de usar o dos fiéis pobres?”' },
    { t: 'Ainda: “O que o papa perdoa ou concede àqueles que, pela contrição perfeita, já têm direito ao perdão pleno e à participação?”' },
    { t: 'Ainda: “Que bem maior a Igreja receberia se o papa, que hoje concede esses perdões e participações uma vez, os concedesse cem vezes por dia a cada fiel?”' },
    { t: '“Se o papa busca, com as indulgências, mais a salvação das almas do que o dinheiro, por que suspende as cartas e indulgências concedidas antes, se elas são igualmente eficazes?”' },
    { t: 'Calar esses argumentos tão escrupulosos dos leigos apenas pela força, sem respondê-los com razões, é expor a Igreja e o papa à zombaria dos inimigos e tornar infelizes os cristãos.' },
    { t: 'Portanto, se as indulgências fossem pregadas segundo o espírito e a intenção do papa, todas essas dúvidas seriam resolvidas com facilidade; na verdade, nem existiriam.' },
    { t: 'Fora, pois, com todos esses profetas que dizem ao povo de Cristo: “Paz, paz”, quando não há paz!', refs: ['Jr 6:14'] },
    { t: 'Felizes todos os profetas que dizem ao povo de Cristo: “Cruz, cruz”, quando não há cruz!' },
    { t: 'Os cristãos devem ser exortados a se empenhar em seguir a Cristo, sua cabeça, através das penas, da morte e do inferno;' },
    { t: 'e, assim, a confiar que entrarão no céu antes por muitas tribulações do que pela falsa segurança da paz.', refs: ['At 14:22'] }
  ];

  var GLOSSARIO = [
    { termo: 'Indulgência', def: 'Na Igreja medieval, a dispensa, total ou parcial, das penas temporais ligadas a pecados já perdoados. Na época de Lutero, cartas de indulgência eram vendidas.' },
    { termo: 'Penitência / arrependimento', def: 'O latim poenitentia pode significar tanto o sacramento da penitência quanto a mudança interior de mente e de vida. A tese 1 joga com essa diferença.' },
    { termo: 'Contrição', def: 'Tristeza sincera pelo pecado, acompanhada do desejo de mudar.' },
    { termo: 'Cânones penitenciais', def: 'Regras da Igreja que fixavam penas (jejuns, orações, esmolas) a serem cumpridas após a confissão.' },
    { termo: 'Satisfação', def: 'A parte da penitência em que a pessoa cumpria a pena imposta pelo sacerdote.' },
    { termo: 'Purgatório', def: 'Segundo a doutrina católica, estado de purificação após a morte. Lutero ainda o aceitava em 1517 e depois passou a rejeitá-lo.' },
    { termo: 'Poder das chaves', def: 'Autoridade de ligar e desligar (perdoar ou reter pecados), com base em Mateus 16:19.' },
    { termo: 'Comissário', def: 'Encarregado oficial de pregar e distribuir uma campanha de indulgências.' }
  ];

  // ------------------------------------------------------------------ curiosidades históricas
  // Cada item foi conferido nas fontes indicadas (consultadas em novembro de 2026).
  var CURIOSIDADES = [
    { id: 'almeida', tema: 'Bíblia em português', titulo: 'A primeira Bíblia em português levou mais de 70 anos',
      texto: 'João Ferreira de Almeida, português que viveu na Batávia (atual Jacarta), publicou o Novo Testamento em 1681, em Amsterdã. Ele morreu em 1691 traduzindo o Antigo Testamento, que foi concluído por colegas holandeses. A Bíblia completa saiu em dois volumes, em 1748 e 1753; em volume único, só em 1819.',
      fontes: ['Vilson Scholz, Revista Pistis & Praxis (PUCPR), v. 8, n. 1, 2016', 'Wikipedia (inglês), “Bible translations into Portuguese”'],
      refs: [] },
    { id: 'blivre1819', tema: 'Bíblia em português', titulo: 'A Bíblia Livre e a edição de 1819',
      texto: 'A Bíblia Livre, tradução padrão do ATOS 2, é uma revisão da tradução de Almeida a partir da edição de 1819, a primeira Bíblia completa em português impressa em um só volume.',
      fontes: ['Ficha técnica da Bíblia Livre (BLIVRE)', 'Vilson Scholz, Revista Pistis & Praxis (PUCPR), v. 8, n. 1, 2016'], refs: [] },
    { id: 'capitulos', tema: 'Como a Bíblia foi organizada', titulo: 'Capítulos e versículos vieram depois',
      texto: 'Os livros bíblicos foram escritos sem capítulos nem versículos. A divisão em capítulos usada hoje vem de Estêvão Langton, no início do século XIII. Os versículos do Novo Testamento foram numerados pelo impressor Robert Estienne em 1551. A Bíblia de Genebra (1560) foi a primeira Bíblia inglesa completa com capítulos e versículos.',
      fontes: ['Wikipedia (inglês), “Chapters and verses of the Bible”', 'Trinitarian Bible Society, “Verse Divisions in the Scriptures”'], refs: [] },
    { id: 'septuaginta', tema: 'Traduções antigas', titulo: 'A Septuaginta, a Bíblia em grego',
      texto: 'Judeus de língua grega no Egito traduziram o Pentateuco para o grego por volta da metade do século III a.C.; o restante do Antigo Testamento foi traduzido depois, ao longo do século II a.C. Essa tradução, chamada Septuaginta, é muitas vezes a forma em que o Antigo Testamento aparece citado no Novo.',
      fontes: ['Encyclopaedia Britannica, “Septuagint”'], refs: [] },
    { id: 'vulgata', tema: 'Traduções antigas', titulo: 'Jerônimo e a Vulgata',
      texto: 'Jerônimo concluiu, por volta de 405, a tradução da Bíblia para o latim conhecida como Vulgata. No Antigo Testamento, ele traduziu a maior parte diretamente do hebraico. A Vulgata foi a Bíblia padrão do Ocidente por cerca de mil anos.',
      fontes: ['Encyclopaedia Britannica, “Biblical translation”'], refs: [] },
    { id: 'gutenberg', tema: 'Imprensa', titulo: 'O primeiro grande livro impresso foi a Bíblia',
      texto: 'Johannes Gutenberg concluiu em Mainz, por volta de 1455, uma edição da Vulgata latina impressa com tipos móveis de metal. Estima-se que foram feitos cerca de 180 exemplares; menos de 50 sobreviveram.',
      fontes: ['Encyclopaedia Britannica, “Gutenberg Bible”'], refs: [] },
    { id: 'qumran', tema: 'Arqueologia', titulo: 'Os manuscritos do Mar Morto',
      texto: 'Em 1947, foram encontrados em cavernas perto de Qumran, no deserto da Judeia, rolos e fragmentos copiados, aproximadamente, entre o século III a.C. e o século I d.C.. Entre eles há trechos de quase todos os livros do Antigo Testamento, com exceção de Ester. Salmos é o livro com mais cópias encontradas.',
      fontes: ['Cedarville University, exposição “Preserved by Hand: The Bible from Manuscript to Gutenberg”'], refs: [] },
    { id: 'wartburg', tema: 'Reforma', titulo: 'O Novo Testamento de Lutero em 11 semanas',
      texto: 'Escondido no castelo de Wartburg depois da Dieta de Worms, Lutero fez uma primeira versão da tradução do Novo Testamento para o alemão em cerca de onze semanas, a partir do grego. Revisada com Melanchthon e outros, foi publicada em setembro de 1522 e ficou conhecida como “Testamento de Setembro”.',
      fontes: ['Wikipedia (inglês), “Luther Bible”', '1517.org, “Luther’s September Testament”'], refs: [] },
    { id: 'worms', tema: 'Reforma', titulo: '“Aqui estou”: Lutero em Worms',
      texto: 'Excomungado em 3 de janeiro de 1521, Lutero foi chamado à Dieta de Worms. Em 18 de abril de 1521, recusou-se a retratar seus escritos, dizendo que sua consciência estava presa à Palavra de Deus. A frase “Aqui estou, não posso fazer outra coisa” é tradicional: aparece nas primeiras versões impressas do discurso, mas não foi registrada no momento.',
      fontes: ['Encyclopaedia Britannica, “Diet of Worms”', 'Christianity Today, “1521 The Diet of Worms”'], refs: [] },
    { id: 'porta', tema: 'Reforma', titulo: 'Teses na porta? Um debate de historiadores',
      texto: 'É certo que, em 31 de outubro de 1517, Lutero enviou as teses ao arcebispo Alberto de Mainz; a carta ainda existe. Já a afixação na porta da Igreja do Castelo foi contada por Melanchthon em 1546. Desde os anos 1960, historiadores discutem se ela aconteceu e quando.',
      fontes: ['Encyclopaedia Britannica, “Ninety-five Theses”', 'V. Leppin e T. Wengert, “Sources for and against the Posting of the Ninety-Five Theses”, Lutheran Quarterly, 2015'], refs: [] },
    { id: 'bereia', tema: 'Na própria Bíblia', titulo: 'Os bereanos conferiam tudo nas Escrituras',
      texto: 'Atos conta que os judeus de Bereia receberam a mensagem com prontidão e examinavam as Escrituras todos os dias para ver se era mesmo assim. É o espírito deste aplicativo: conferir tudo na Palavra.',
      fontes: ['Atos 17:10-11'], refs: ['At 17:11'] },
    { id: 'cristaos', tema: 'Na própria Bíblia', titulo: 'Onde surgiu o nome “cristãos”',
      texto: 'Segundo Atos, foi em Antioquia que os discípulos de Jesus foram chamados de cristãos pela primeira vez.',
      fontes: ['Atos 11:26'], refs: ['At 11:26'] }
  ];

  // ------------------------------------------------------------------ estatísticas calculadas
  /**
   * indice: { livros:[{id, versos:[n por capítulo]}] } na ordem canônica.
   * Devolve números exatos para a versificação dessa tradução.
   */
  function estatisticas(indice) {
    var livros = indice.livros, totalCaps = 0, totalVs = 0, at = 0, nt = 0;
    var maiorCap = null, menorCap = null, maisCaps = null, maisVs = null, menosVs = null;
    var lista = [];                                    // [livro, cap, v] até achar o meio
    livros.forEach(function (l, i) {
      var vs = l.versos.reduce(function (s, n) { return s + n; }, 0);
      totalCaps += l.versos.length; totalVs += vs;
      if (i < 39) at += vs; else nt += vs;
      if (!maisCaps || l.versos.length > maisCaps.n) maisCaps = { livro: l.id, n: l.versos.length };
      if (!maisVs || vs > maisVs.n) maisVs = { livro: l.id, n: vs };
      if (!menosVs || vs < menosVs.n) menosVs = { livro: l.id, n: vs };
      l.versos.forEach(function (n, c) {
        if (!maiorCap || n > maiorCap.n) maiorCap = { livro: l.id, cap: c + 1, n: n };
        if (!menorCap || n < menorCap.n) menorCap = { livro: l.id, cap: c + 1, n: n };
      });
    });
    // capítulo e versículo(s) do meio
    function posicaoVers(k) {                          // k-ésimo versículo (1-based)
      for (var i = 0; i < livros.length; i++) for (var c = 0; c < livros[i].versos.length; c++) {
        if (k <= livros[i].versos[c]) return { livro: livros[i].id, cap: c + 1, v: k };
        k -= livros[i].versos[c];
      }
      return null;
    }
    function posicaoCap(k) {
      for (var i = 0; i < livros.length; i++) { if (k <= livros[i].versos.length) return { livro: livros[i].id, cap: k }; k -= livros[i].versos.length; }
      return null;
    }
    var meioVs = totalVs % 2 ? [posicaoVers((totalVs + 1) / 2)] : [posicaoVers(totalVs / 2), posicaoVers(totalVs / 2 + 1)];
    var meioCap = totalCaps % 2 ? [posicaoCap((totalCaps + 1) / 2)] : [posicaoCap(totalCaps / 2), posicaoCap(totalCaps / 2 + 1)];
    return { livros: livros.length, at: { livros: Math.min(39, livros.length), versiculos: at }, nt: { livros: Math.max(0, livros.length - 39), versiculos: nt },
      capitulos: totalCaps, versiculos: totalVs, maiorCapitulo: maiorCap, menorCapitulo: menorCap, livroMaisCapitulos: maisCaps,
      livroMaisVersiculos: maisVs, livroMenosVersiculos: menosVs, versiculosDoMeio: meioVs, capitulosDoMeio: meioCap };
  }

  // Versículos mais longo e mais curto (em palavras), a partir do texto completo
  function extremosDoTexto(livros, plano) {
    var longo = null, curto = null, palavras = 0, curtos = [];
    livros.forEach(function (lv) {
      lv.caps.forEach(function (cap, ci) {
        cap.forEach(function (t, vi) {
          if (!t) return;
          var n = plano(t).split(/\s+/).filter(function (w) { return /[\wÀ-ÿ]/.test(w); }).length;
          palavras += n;
          if (!longo || n > longo.n) longo = { livro: lv.id, cap: ci + 1, v: vi + 1, n: n };
          if (!curto || n < curto.n) { curto = { livro: lv.id, cap: ci + 1, v: vi + 1, n: n }; curtos = []; }
          if (n === curto.n) curtos.push({ livro: lv.id, cap: ci + 1, v: vi + 1 });
        });
      });
    });
    return { maisLongo: longo, maisCurto: curto, maisCurtos: curtos, palavras: palavras };
  }

  var API = { TESES_INTRO: TESES_INTRO, TESES_GRUPOS: TESES_GRUPOS, TESES: TESES, GLOSSARIO: GLOSSARIO, CURIOSIDADES: CURIOSIDADES,
    estatisticas: estatisticas, extremosDoTexto: extremosDoTexto };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Mural = API;
})(typeof window !== 'undefined' ? window : this);
