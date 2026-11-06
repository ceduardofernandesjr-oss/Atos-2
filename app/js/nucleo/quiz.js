/*
 * ATOS 2 — Quiz bíblico. Cada pergunta traz a referência que a responde e palavras-chave que
 * precisam aparecer no texto dessa referência na Bíblia Livre. Os testes (test/quiz.test.js)
 * conferem todas as referências e chaves, para que nenhuma resposta dependa de memória.
 * Na tela, depois de responder, o app mostra o versículo da tradução escolhida.
 * Navegador: window.A2Quiz · Node: module.exports
 */
(function (root) {
  'use strict';

  var CATEGORIAS = [
    { id: 'at', nome: 'Antigo Testamento' },
    { id: 'ev', nome: 'Evangelhos' },
    { id: 'nt', nome: 'Atos e cartas' },
    { id: 'qd', nome: 'Quem disse?' },
    { id: 'nu', nome: 'Números da Bíblia' }
  ];
  var NIVEIS = ['', 'Fácil', 'Médio', 'Difícil'];

  // q(categoria, nível, pergunta, [CERTA, errada, errada, errada], referência, chaves, nota?)
  // chaves: palavras separadas por ';' que devem constar no texto; 'a|b' aceita uma ou outra.
  // Para contagens de capítulos use a chave '#caps=N' (conferida no índice da tradução).
  var BANCO = [];
  function q(cat, nivel, p, ops, ref, chave, nota) { BANCO.push({ id: cat + (BANCO.length + 1), cat: cat, nivel: nivel, p: p, ops: ops, ref: ref, chave: chave, nota: nota || '' }); }

  // ---------------------------------------------------------------- Antigo Testamento
  q('at', 1, 'Quantos dias Deus trabalhou na criação antes de descansar no sétimo?', ['Seis', 'Cinco', 'Sete', 'Quarenta'], 'Gn 2:2', 'setimo');
  q('at', 1, 'Quem recebeu de Deus a ordem de construir a arca?', ['Noé', 'Abraão', 'Moisés', 'Enoque'], 'Gn 6:13-14', 'noe;arca');
  q('at', 1, 'Por quantos dias e noites choveu sobre a terra no dilúvio?', ['Quarenta', 'Sete', 'Doze', 'Cem'], 'Gn 7:12', 'quarenta');
  q('at', 2, 'Como se chamava a torre cuja construção terminou com a confusão das línguas?', ['Babel', 'Siquém', 'Betel', 'Ur'], 'Gn 11:9', 'babel');
  q('at', 1, 'Qual era o nome de Abraão antes de Deus mudá-lo?', ['Abrão', 'Abiatar', 'Abner', 'Abel'], 'Gn 17:5', 'abrao;abraao');
  q('at', 1, 'Qual foi o filho que Sara deu a Abraão na velhice?', ['Isaque', 'Ismael', 'Jacó', 'Ló'], 'Gn 21:2-3', 'sara;isaque');
  q('at', 2, 'No que se transformou a mulher de Ló ao olhar para trás?', ['Numa estátua de sal', 'Numa pedra', 'Em pó', 'Numa coluna de fogo'], 'Gn 19:26', 'estatua');
  q('at', 2, 'Esaú vendeu ao irmão Jacó o seu direito de...', ['Primogenitura', 'Herança das terras', 'Sacerdócio', 'Realeza'], 'Gn 25:33', 'primogenitura');
  q('at', 2, 'Que nome Jacó recebeu depois de lutar com o anjo até o amanhecer?', ['Israel', 'Judá', 'Efraim', 'Benjamim'], 'Gn 32:28', 'israel');
  q('at', 1, 'Qual filho de Jacó foi vendido como escravo pelos próprios irmãos?', ['José', 'Rúben', 'Benjamim', 'Levi'], 'Gn 37:28', 'jose');
  q('at', 2, 'Em que monte Moisés viu a sarça que ardia e não se consumia?', ['Horebe', 'Carmelo', 'Moriá', 'Sião'], 'Êx 3:1-2', 'horebe;sarca');
  q('at', 1, 'Quem Deus indicou para falar por Moisés diante do povo?', ['Arão, seu irmão', 'Josué', 'Calebe', 'Jetro, seu sogro'], 'Êx 4:14-16', 'arao');
  q('at', 1, 'Que mar Deus abriu para Israel atravessar?', ['O Mar Vermelho', 'O Mar Morto', 'O Mar da Galileia', 'O Mar Mediterrâneo'], 'Êx 15:4', 'vermelho');
  q('at', 1, 'Que alimento Deus enviou do céu a Israel no deserto?', ['Maná', 'Pão de cevada', 'Figos', 'Tâmaras'], 'Êx 16:31', 'mana');
  q('at', 2, 'Que animal falou com Balaão no caminho?', ['Uma jumenta', 'Um camelo', 'Uma serpente', 'Um cavalo'], 'Nm 22:28', 'jumenta');
  q('at', 1, 'Quem sucedeu Moisés na liderança de Israel?', ['Josué', 'Arão', 'Gideão', 'Samuel'], 'Dt 34:9', 'josue');
  q('at', 1, 'Que cidade teve os muros derrubados depois que o povo rodeou e gritou?', ['Jericó', 'Ai', 'Hebrom', 'Gaza'], 'Js 6:2-20', 'jerico;muro');
  q('at', 2, 'Quem era juíza e profetisa em Israel e julgava debaixo de uma palmeira?', ['Débora', 'Ana', 'Miriã', 'Jael'], 'Jz 4:4-5', 'debora;palmeira');
  q('at', 2, 'Com quantos homens Gideão venceu os midianitas?', ['Trezentos', 'Dez mil', 'Mil', 'Setenta'], 'Jz 7:7', 'trezentos');
  q('at', 1, 'O segredo da força de Sansão estava ligado a quê?', ['Ao seu cabelo, que nunca fora cortado', 'A um anel de ouro', 'À sua espada', 'Ao jejum'], 'Jz 16:17', 'navalha');
  q('at', 1, 'Quem disse à sogra: “Teu povo será meu povo, e teu Deus meu Deus”?', ['Rute', 'Orfa', 'Ester', 'Raquel'], 'Rt 1:16', 'rute;povo');
  q('at', 2, 'Quem foi o primeiro rei de Israel?', ['Saul', 'Davi', 'Salomão', 'Samuel'], '1Sm 9:17', 'saul');
  q('at', 2, 'Que profeta ungiu Davi como rei, ainda jovem?', ['Samuel', 'Natã', 'Elias', 'Eli'], '1Sm 16:13', 'samuel;davi');
  q('at', 1, 'Com que arma Davi derrubou o gigante Golias?', ['Uma funda e uma pedra', 'Uma espada', 'Um arco', 'Uma lança'], '1Sm 17:49-50', 'funda;pedra');
  q('at', 1, 'Qual rei construiu o primeiro templo em Jerusalém?', ['Salomão', 'Davi', 'Ezequias', 'Josias'], '1Rs 6:14', 'salomao');
  q('at', 2, 'Em que monte Elias desafiou os profetas de Baal?', ['Carmelo', 'Sinai', 'Tabor', 'Hermom'], '1Rs 18:19-20', 'carmelo');
  q('at', 1, 'Que profeta foi levado ao céu num redemoinho?', ['Elias', 'Eliseu', 'Isaías', 'Enoque'], '2Rs 2:11', 'elias');
  q('at', 2, 'Em quantos dias o muro de Jerusalém foi concluído no tempo de Neemias?', ['Cinquenta e dois', 'Quarenta', 'Cento e vinte', 'Sete'], 'Ne 6:15', 'cinquenta e dois');
  q('at', 1, 'Que rainha arriscou a vida dizendo “se eu perecer, perecerei”?', ['Ester', 'Vasti', 'Jezabel', 'A rainha de Sabá'], 'Et 4:16', 'perecerei');
  q('at', 1, 'Quem perdeu tudo e disse: “O Senhor deu, e o Senhor tomou”?', ['Jó', 'Davi', 'Jeremias', 'Abraão'], 'Jó 1:20-21', 'deu;tomou');
  q('at', 1, 'Qual salmo começa com “O Senhor é o meu pastor”?', ['Salmo 23', 'Salmo 1', 'Salmo 91', 'Salmo 119'], 'Sl 23:1', 'pastor');
  q('at', 2, 'Segundo Provérbios 1:7, o temor do Senhor é o princípio de quê?', ['Do conhecimento', 'Da riqueza', 'Da paz', 'Da obediência'], 'Pv 1:7', 'temor;principio');
  q('at', 2, 'Que profeta escreveu: “ele foi ferido por nossas transgressões”?', ['Isaías', 'Ezequiel', 'Amós', 'Oseias'], 'Is 53:5', 'transgressoes');
  q('at', 2, 'Na visão de Isaías 6, o que o profeta respondeu quando Deus perguntou “a quem enviarei”?', ['“Eis-me aqui! Envia-me!”', '“Envia outro”', '“Sou muito jovem”', '“Não sei falar”'], 'Is 6:8', 'envia');
  q('at', 1, 'Quem foi lançado na cova dos leões por orar ao seu Deus?', ['Daniel', 'José', 'Jeremias', 'Neemias'], 'Dn 6:16', 'daniel;leoes');
  q('at', 2, 'Quais eram os três jovens lançados na fornalha ardente?', ['Sadraque, Mesaque e Abede-Nego', 'Daniel, Esdras e Neemias', 'Ageu, Zacarias e Malaquias', 'Josué, Calebe e Hur'], 'Dn 3:20', 'fornalha;sadraque');
  q('at', 3, 'Qual rei viu uma mão escrever na parede durante um banquete?', ['Belsazar', 'Nabucodonosor', 'Ciro', 'Dario'], 'Dn 5:1-5', 'belsazar;parede');
  q('at', 1, 'Que profeta foi engolido por um grande peixe?', ['Jonas', 'Elias', 'Naum', 'Obadias'], 'Jn 1:17', 'jonas;peixe');
  q('at', 2, 'Segundo Miqueias, de que cidade sairia aquele que governaria Israel?', ['Belém', 'Nazaré', 'Jerusalém', 'Hebrom'], 'Mq 5:2', 'belem');
  q('at', 3, 'Quantos anos viveu Matusalém?', ['Novecentos e sessenta e nove', 'Novecentos e trinta', 'Setecentos e setenta e sete', 'Cento e vinte'], 'Gn 5:27', 'novecentos e sessenta e nove');
  q('at', 1, 'Que sinal Deus pôs nas nuvens como lembrança da aliança depois do dilúvio?', ['O arco-íris', 'Uma estrela', 'Uma coluna de fogo', 'Uma pomba'], 'Gn 9:13', 'arco;nuvens');

  // ---------------------------------------------------------------- Evangelhos
  q('ev', 1, 'Em que cidade Jesus nasceu?', ['Belém da Judeia', 'Nazaré', 'Jerusalém', 'Cafarnaum'], 'Mt 2:1', 'belem');
  q('ev', 2, 'Quais presentes os magos ofereceram a Jesus?', ['Ouro, incenso e mirra', 'Prata, óleo e vinho', 'Ouro, prata e pedras', 'Pão, sal e mel'], 'Mt 2:11', 'ouro;incenso;mirra');
  q('ev', 2, 'Que rei mandou matar os meninos de Belém?', ['Herodes', 'Pilatos', 'César Augusto', 'Agripa'], 'Mt 2:16', 'herodes');
  q('ev', 1, 'Em que rio Jesus foi batizado por João?', ['Jordão', 'Nilo', 'Eufrates', 'Quisom'], 'Mt 3:13', 'jordao;joao');
  q('ev', 1, 'Por quantos dias Jesus jejuou no deserto?', ['Quarenta', 'Sete', 'Três', 'Doze'], 'Mt 4:2', 'quarenta');
  q('ev', 1, 'Segundo João, qual foi o primeiro sinal de Jesus?', ['Transformou água em vinho, em Caná', 'Curou um cego', 'Andou sobre o mar', 'Multiplicou os pães'], 'Jo 2:9-11', 'cana;vinho');
  q('ev', 1, 'Quem eram os primeiros a quem Jesus disse: “Vinde após mim, e eu vos farei pescadores de homens”?', ['Pedro e André', 'Tiago e João', 'Mateus e Tomé', 'Filipe e Natanael'], 'Mt 4:18-19', 'pedro;andre;pescadores');
  q('ev', 1, 'Que cobrador de impostos Jesus chamou quando estava sentado na coletoria?', ['Mateus', 'Zaqueu', 'Simão', 'Bartolomeu'], 'Mt 9:9', 'mateus');
  q('ev', 1, 'Segundo o Sermão do Monte, os mansos herdarão o quê?', ['A terra', 'O céu', 'A riqueza', 'O reino de Israel'], 'Mt 5:5', 'mansos;terra');
  q('ev', 1, 'Como começa a oração que Jesus ensinou em Mateus 6?', ['“Pai nosso, que estás nos céus”', '“Senhor, tem misericórdia”', '“Deus de Abraão”', '“Bendito seja o Senhor”'], 'Mt 6:9', 'pai nosso');
  q('ev', 2, 'Com que semente Jesus comparou o reino dos céus, por ser pequena e crescer muito?', ['Grão de mostarda', 'Semente de trigo', 'Caroço de azeitona', 'Semente de figo'], 'Mt 13:31', 'mostarda');
  q('ev', 1, 'Quantos pães e peixes havia antes da multiplicação para cinco mil homens?', ['Cinco pães e dois peixes', 'Sete pães e três peixes', 'Dois pães e cinco peixes', 'Doze pães e um peixe'], 'Mt 14:17-21', 'cinco paes;dois peixes;cinco mil');
  q('ev', 2, 'Quem andou sobre as águas ao encontro de Jesus e começou a afundar?', ['Pedro', 'João', 'André', 'Tiago'], 'Mt 14:29-30', 'pedro');
  q('ev', 2, 'Quem apareceu conversando com Jesus no monte da transfiguração?', ['Moisés e Elias', 'Abraão e Davi', 'Isaías e Jeremias', 'Noé e Enoque'], 'Mt 17:3', 'moises;elias');
  q('ev', 2, 'Quantas vezes Jesus disse a Pedro que se deve perdoar?', ['Até setenta vezes sete', 'Até sete vezes', 'Três vezes', 'Doze vezes'], 'Mt 18:22', 'setenta vezes sete');
  q('ev', 2, 'Qual é o primeiro e grande mandamento, segundo Jesus?', ['Amar o Senhor teu Deus de todo o coração', 'Guardar o sábado', 'Não matar', 'Honrar pai e mãe'], 'Mt 22:37-38', 'amaras;coracao');
  q('ev', 1, 'Por quanto Judas combinou entregar Jesus?', ['Trinta moedas de prata', 'Cem denários', 'Dez moedas de ouro', 'Um talento'], 'Mt 26:15', 'trinta');
  q('ev', 1, 'Quem negou Jesus três vezes antes de o galo cantar?', ['Pedro', 'Judas', 'Tomé', 'João'], 'Mt 26:75', 'pedro;tres vezes');
  q('ev', 1, 'Qual governador romano entregou Jesus para ser crucificado?', ['Pôncio Pilatos', 'Herodes Antipas', 'Félix', 'Festo'], 'Mt 27:24-26', 'pilatos;crucificado');
  q('ev', 2, 'Quem foi obrigado a carregar a cruz de Jesus?', ['Simão, de Cirene', 'José de Arimateia', 'Nicodemos', 'Barrabás'], 'Mt 27:32', 'simao');
  q('ev', 2, 'Como se chamava o lugar onde Jesus foi crucificado?', ['Gólgota', 'Getsêmani', 'Betânia', 'Monte das Oliveiras'], 'Mt 27:33', 'golgota');
  q('ev', 2, 'Segundo Marcos 16:9, a quem Jesus ressuscitado apareceu primeiro?', ['Maria Madalena', 'Pedro', 'Sua mãe, Maria', 'Os onze'], 'Mc 16:9', 'madalena');
  q('ev', 1, 'Na Grande Comissão, Jesus mandou ensinar todas as nações e batizá-las em nome de quem?', ['Do Pai, do Filho e do Espírito Santo', 'Somente de Jesus', 'Dos apóstolos', 'De Moisés e dos profetas'], 'Mt 28:19', 'pai;filho;espirito santo');
  q('ev', 1, 'A quem o anjo Gabriel anunciou o nascimento de Jesus em Nazaré?', ['Maria', 'Isabel', 'Ana', 'Marta'], 'Lc 1:26-27', 'gabriel;maria');
  q('ev', 2, 'A parábola do bom samaritano responde a que pergunta?', ['“Quem é o meu próximo?”', '“Quem é o maior?”', '“Quando virá o reino?”', '“Quantas vezes perdoar?”'], 'Lc 10:29-33', 'proximo;samaritano');
  q('ev', 2, 'Que irmã ficou aos pés de Jesus ouvindo-o, enquanto a outra servia?', ['Maria', 'Marta', 'Salomé', 'Joana'], 'Lc 10:39', 'maria');
  q('ev', 1, 'Quem subiu numa árvore para ver Jesus passar em Jericó?', ['Zaqueu', 'Bartimeu', 'Nicodemos', 'Lázaro'], 'Lc 19:2-4', 'zaqueu');
  q('ev', 2, 'Quem visitou Jesus de noite e ouviu que era preciso nascer de novo?', ['Nicodemos', 'Natanael', 'José de Arimateia', 'Gamaliel'], 'Jo 3:1-3', 'nicodemos;novo');
  q('ev', 2, 'De que região era a mulher com quem Jesus conversou junto ao poço de Jacó?', ['Samaria', 'Galileia', 'Decápolis', 'Fenícia'], 'Jo 4:7', 'samaria');
  q('ev', 1, 'Que amigo de Jesus foi ressuscitado em Betânia depois de quatro dias?', ['Lázaro', 'Jairo', 'Simão', 'Eutico'], 'Jo 11:39-44', 'lazaro;quatro dias');
  q('ev', 2, 'Jesus disse “Eu sou o caminho, e a verdade, e a vida” respondendo a uma pergunta de quem?', ['Tomé', 'Pedro', 'Filipe', 'Judas'], 'Jo 14:5-6', 'tome;caminho');
  q('ev', 3, 'Quantos peixes grandes havia na rede depois da pesca no mar de Tiberíades?', ['Cento e cinquenta e três', 'Cem', 'Doze', 'Setenta e dois'], 'Jo 21:11', 'cento e cinquenta e tres');

  // ---------------------------------------------------------------- Atos e cartas
  q('nt', 1, 'Em que festa o Espírito Santo desceu sobre os discípulos reunidos?', ['Pentecostes', 'Páscoa', 'Tabernáculos', 'Purim'], 'At 2:1-4', 'pentecostes;espirito santo');
  q('nt', 2, 'Quantas pessoas foram acrescentadas à igreja no dia de Pentecostes?', ['Quase três mil', 'Cento e vinte', 'Cinco mil', 'Setenta'], 'At 2:41', 'tres mil');
  q('nt', 1, 'Segundo Atos 2:42, em que os primeiros cristãos perseveravam?', ['Na doutrina dos apóstolos, na comunhão, no partir do pão e nas orações', 'Nos jejuns e nas vigílias', 'Na lei de Moisés', 'Nas tradições dos anciãos'], 'At 2:42', 'doutrina dos apostolos;comunhao;oracoes');
  q('nt', 2, 'O que Pedro disse ao coxo na porta Formosa do templo?', ['“Prata e ouro não tenho; mas o que eu tenho, isso eu te dou”', '“Vai em paz”', '“Tua fé te salvou”', '“Levanta-te e anda, filho de Davi”'], 'At 3:6', 'prata;ouro');
  q('nt', 1, 'Quem foi o primeiro discípulo morto apedrejado por causa de Cristo?', ['Estêvão', 'Tiago', 'Filipe', 'Barnabé'], 'At 7:58-59', 'estevao');
  q('nt', 1, 'A caminho de que cidade Saulo viu a luz do céu e ouviu a voz de Jesus?', ['Damasco', 'Antioquia', 'Tarso', 'Jerusalém'], 'At 9:3-4', 'damasco');
  q('nt', 2, 'Que discípulo Deus enviou para impor as mãos sobre Saulo cego?', ['Ananias', 'Barnabé', 'Silas', 'Timóteo'], 'At 9:17', 'ananias');
  q('nt', 2, 'Qual centurião romano chamou Pedro à sua casa em Cesareia?', ['Cornélio', 'Júlio', 'Cláudio Lísias', 'Sérgio Paulo'], 'At 10:1', 'cornelio');
  q('nt', 1, 'Em que cidade os discípulos foram chamados cristãos pela primeira vez?', ['Antioquia', 'Jerusalém', 'Roma', 'Corinto'], 'At 11:26', 'antioquia;cristaos');
  q('nt', 2, 'Em que cidade Paulo e Silas cantavam hinos à meia-noite na prisão?', ['Filipos', 'Éfeso', 'Atenas', 'Tessalônica'], 'At 16:12-25', 'filipos;silas');
  q('nt', 2, 'Os judeus de que cidade examinavam cada dia as Escrituras para ver se as coisas eram assim?', ['Bereia', 'Atenas', 'Listra', 'Icônio'], 'At 17:10-11', 'bere;escrituras');
  q('nt', 2, 'Onde Paulo falou aos atenienses sobre o “Deus desconhecido”?', ['No Areópago', 'Na sinagoga de Corinto', 'No templo de Jerusalém', 'Na escola de Tirano'], 'At 17:22-23', 'areopago;desconhecido');
  q('nt', 1, 'Que carta diz: “o salário do pecado é a morte, mas o dom gratuito de Deus é a vida eterna”?', ['Romanos', 'Gálatas', 'Hebreus', 'Tiago'], 'Rm 6:23', 'pecado;morte');
  q('nt', 2, 'Em 1 Coríntios 13, o que permanece ao lado da fé e da esperança, sendo o maior dos três?', ['O amor', 'A sabedoria', 'A paciência', 'A justiça'], '1Co 13:13', 'amor|caridade');
  q('nt', 2, 'Em que carta aparece a lista do fruto do Espírito: amor, alegria, paz…?', ['Gálatas', 'Efésios', 'Colossenses', 'Romanos'], 'Gl 5:22', 'fruto;espirito');
  q('nt', 2, 'Que carta manda revestir-se de “toda a armadura de Deus”?', ['Efésios', 'Filipenses', '1 Tessalonicenses', 'Tito'], 'Ef 6:11', 'armadura');
  q('nt', 1, '“Posso todas as coisas naquele que me fortalece” está em que carta?', ['Filipenses', 'Romanos', '2 Coríntios', 'Hebreus'], 'Fp 4:13', 'fortalece');
  q('nt', 2, 'Que capítulo de Hebreus lista heróis da fé como Abel, Noé, Abraão e Moisés?', ['Hebreus 11', 'Hebreus 1', 'Hebreus 6', 'Hebreus 13'], 'Hb 11:4-7', 'abel;noe;fe');
  q('nt', 2, 'Que carta afirma que a fé sem obras é morta?', ['Tiago', 'Romanos', 'Judas', '1 Pedro'], 'Tg 2:26', 'obras;morta');
  q('nt', 1, 'Que carta afirma, com estas palavras, que “Deus é amor”?', ['1 João', 'Romanos', '2 Pedro', 'Hebreus'], '1Jo 4:8', 'deus e amor');
  q('nt', 2, 'Segundo 2 Timóteo 3:16, toda a Escritura é...', ['Inspirada por Deus e útil para ensinar', 'Difícil de entender', 'Apenas para sacerdotes', 'Somente a Lei de Moisés'], '2Tm 3:16', 'escritura;divinamente|inspirada');
  q('nt', 3, 'Por qual escravo Paulo intercede na carta a Filemom?', ['Onésimo', 'Tíquico', 'Epafras', 'Trófimo'], 'Fm 1:10', 'onesimo');
  q('nt', 1, 'Em que ilha João estava quando recebeu a revelação do Apocalipse?', ['Patmos', 'Chipre', 'Creta', 'Malta'], 'Ap 1:9', 'patmos');
  q('nt', 3, 'Em que ilha Paulo naufragou e foi picado por uma víbora sem sofrer mal?', ['Malta (Melita)', 'Creta', 'Chipre', 'Rodes'], 'At 28:1-5', 'melita|malta;vibora');

  // ---------------------------------------------------------------- Quem disse?
  q('qd', 1, 'Quem disse: “Eis aqui a serva do Senhor; cumpra-se em mim conforme a tua palavra”?', ['Maria', 'Isabel', 'Ana', 'Rute'], 'Lc 1:38', 'serva;maria');
  q('qd', 1, 'Quem disse: “eu e minha casa serviremos ao Senhor”?', ['Josué', 'Moisés', 'Davi', 'Noé'], 'Js 24:15', 'eu e minha casa');
  q('qd', 2, 'Quem respondeu: “Fala, que o teu servo está ouvindo”?', ['Samuel', 'Elias', 'Isaías', 'Gideão'], '1Sm 3:10', 'samuel;servo');
  q('qd', 2, 'Quem perguntou a Jesus: “O que é a verdade?”', ['Pilatos', 'Herodes', 'Caifás', 'Nicodemos'], 'Jo 18:38', 'pilatos;verdade');
  q('qd', 2, 'Quem disse sobre Jesus: “Ele deve crescer, porém eu diminuir”?', ['João Batista', 'Pedro', 'Paulo', 'André'], 'Jo 3:26-30', 'joao;diminuir');
  q('qd', 1, 'Quem exclamou: “Senhor meu, e Deus meu!” ao ver Jesus ressuscitado?', ['Tomé', 'Pedro', 'Maria Madalena', 'João'], 'Jo 20:28', 'tome');
  q('qd', 2, 'Quem disse: “Senhor, a quem iremos? Tu tens as palavras da vida eterna”?', ['Simão Pedro', 'João', 'Tiago', 'Natanael'], 'Jo 6:68', 'pedro;vida eterna');
  q('qd', 2, 'Quem escreveu a Timóteo, perto do fim da vida: “terminei a carreira, guardei a fé”?', ['Paulo', 'Pedro', 'Tiago', 'João'], '2Tm 4:7', 'carreira;fe');
  q('qd', 2, 'Quem respondeu: “Não sei; sou eu guarda do meu irmão?”', ['Caim', 'Rúben', 'Esaú', 'Aarão'], 'Gn 4:9', 'caim');
  q('qd', 3, 'Quem orou: “Senhor, não os culpes por este pecado”, enquanto era apedrejado?', ['Estêvão', 'Paulo', 'Tiago', 'Jeremias'], 'At 7:59-60', 'estevao;pecado');
  q('qd', 3, 'Quem perguntou: “O que me é necessário fazer para eu me salvar?”', ['O carcereiro de Filipos', 'O eunuco etíope', 'Cornélio', 'Nicodemos'], 'At 16:27-30', 'carcereiro;salvar');

  // ---------------------------------------------------------------- Números da Bíblia
  q('nu', 1, 'Quantos capítulos tem o livro de Salmos?', ['150', '119', '100', '176'], 'Sl 150:1', '#caps=150');
  q('nu', 2, 'Quantos capítulos tem Gênesis?', ['50', '40', '36', '66'], 'Gn 50:26', '#caps=50');
  q('nu', 2, 'Quantos capítulos tem Isaías?', ['66', '52', '48', '40'], 'Is 66:24', '#caps=66');
  q('nu', 3, 'Quantos capítulos tem o Apocalipse?', ['22', '28', '12', '21'], 'Ap 22:21', '#caps=22');
  q('nu', 1, 'Quantos apóstolos Jesus escolheu?', ['Doze', 'Setenta', 'Sete', 'Três'], 'Mt 10:1-2', 'doze');
  q('nu', 2, 'Quantos discípulos Jesus enviou de dois em dois em Lucas 10?', ['Setenta', 'Doze', 'Cento e vinte', 'Quarenta'], 'Lc 10:1', 'setenta');
  q('nu', 2, 'Quantas palavras (mandamentos) Deus escreveu nas tábuas, segundo Êxodo 34:28?', ['Dez', 'Doze', 'Sete', 'Quarenta'], 'Êx 34:28', 'dez');
  q('nu', 3, 'Por quantos anos Israel peregrinou no deserto?', ['Quarenta', 'Setenta', 'Doze', 'Sete'], 'Nm 14:33', 'quarenta anos');
  q('nu', 2, 'Quantas pessoas estavam reunidas quando Pedro se levantou para falar, em Atos 1?', ['Cerca de cento e vinte', 'Doze', 'Setenta', 'Quinhentas'], 'At 1:15', 'cento e vinte');
  q('nu', 3, 'Segundo 1 Coríntios 15, a quantos irmãos Jesus ressuscitado apareceu de uma só vez?', ['Mais de quinhentos', 'Doze', 'Setenta', 'Três mil'], '1Co 15:6', 'quinhentos');

  var POR_ID = {};
  BANCO.forEach(function (x) { POR_ID[x.id] = x; });

  // ---------------------------------------------------------------- sorteio determinístico
  function semente(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function aleatorio(seed) { var a = semente(seed); return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function embaralhar(arr, rnd) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /** Prepara uma pergunta para exibir: opções embaralhadas e índice da certa. */
  function preparar(pergunta, seed) {
    var rnd = aleatorio(seed + ':' + pergunta.id);
    var ordem = embaralhar([0, 1, 2, 3], rnd);
    return Object.assign({}, pergunta, { opcoes: ordem.map(function (i) { return pergunta.ops[i]; }), certa: ordem.indexOf(0) });
  }

  /**
   * Sorteia uma rodada. filtros: { cats:[ids], nivel:0|1|2|3, n:10, evitar:[ids recentes] }.
   * Ordena do mais fácil ao mais difícil quando o nível é misto.
   */
  function rodada(seed, filtros) {
    filtros = filtros || {};
    var n = filtros.n || 10, cats = filtros.cats && filtros.cats.length ? filtros.cats : null, evitar = {};
    (filtros.evitar || []).forEach(function (id) { evitar[id] = 1; });
    var base = BANCO.filter(function (x) { return (!cats || cats.indexOf(x.cat) >= 0) && (!filtros.nivel || x.nivel === filtros.nivel); });
    var rnd = aleatorio(seed);
    var novas = embaralhar(base.filter(function (x) { return !evitar[x.id]; }), rnd);
    var vistas = embaralhar(base.filter(function (x) { return evitar[x.id]; }), rnd);
    var sel = novas.concat(vistas).slice(0, n);
    if (!filtros.nivel) sel.sort(function (a, b) { return a.nivel - b.nivel; });
    return sel.map(function (x) { return preparar(x, seed); });
  }

  /** Desafio do dia: 5 perguntas iguais para todos no mesmo dia (uma de cada categoria). */
  function desafioDoDia(data) {
    var rnd = aleatorio('desafio:' + data);
    return CATEGORIAS.map(function (c) {
      var lista = BANCO.filter(function (x) { return x.cat === c.id; });
      return preparar(lista[Math.floor(rnd() * lista.length)], 'desafio:' + data);
    });
  }

  /** Pontos: 10 por acerto, +5 se difícil, +2 se médio; bônus de sequência. */
  function pontuar(respostas) {
    var pts = 0, seq = 0, melhorSeq = 0, acertos = 0;
    respostas.forEach(function (r) {
      if (r.certo) { acertos++; seq++; melhorSeq = Math.max(melhorSeq, seq); pts += 10 + (r.nivel === 3 ? 5 : r.nivel === 2 ? 2 : 0) + (seq >= 3 ? 2 : 0); }
      else seq = 0;
    });
    return { pontos: pts, acertos: acertos, total: respostas.length, melhorSequencia: melhorSeq };
  }

  function mensagem(acertos, total) {
    var p = total ? acertos / total : 0;
    if (p === 1) return 'Gabaritou! Continue firme na Palavra.';
    if (p >= 0.8) return 'Muito bem! Você conhece bem as Escrituras.';
    if (p >= 0.5) return 'Bom resultado. Leia as passagens das que errou e tente de novo.';
    return 'Cada pergunta é um convite à leitura. Abra as passagens e tente outra rodada.';
  }

  var API = { CATEGORIAS: CATEGORIAS, NIVEIS: NIVEIS, BANCO: BANCO, POR_ID: POR_ID, preparar: preparar, rodada: rodada,
    desafioDoDia: desafioDoDia, pontuar: pontuar, mensagem: mensagem, aleatorio: aleatorio };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Quiz = API;
})(typeof window !== 'undefined' ? window : this);
