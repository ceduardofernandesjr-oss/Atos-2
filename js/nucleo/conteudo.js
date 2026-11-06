/*
 * ATOS 2 — Conteúdo curado (somente REFERÊNCIAS; o texto vem sempre da tradução escolhida).
 * Navegador: window.A2Conteudo · Node: module.exports
 * Todas as referências são conferidas pelos testes (test/conteudo.test.js): existem, não se
 * repetem e, nos temas e personagens, o versículo contém a palavra do tema.
 */
(function (root) {
  'use strict';

  // Versículos do dia: ordem embaralhada por semente fixa; o ciclo só repete após todos.
  var VERSICULOS_DIA = [
    'Gn 1:1', 'Gn 1:27', 'Gn 12:2', 'Gn 15:6', 'Gn 18:14', 'Gn 28:15', 'Gn 50:20',
    'Êx 14:14', 'Êx 15:2', 'Êx 20:3', 'Êx 33:14', 'Lv 19:18', 'Nm 6:24-26', 'Nm 23:19',
    'Dt 6:4-5', 'Dt 8:3', 'Dt 31:6', 'Dt 31:8', 'Dt 33:27', 'Js 1:8', 'Js 1:9', 'Js 24:15',
    'Rt 1:16', '1Sm 2:2', '1Sm 16:7', '2Sm 22:2-3', '2Sm 22:31', '1Rs 8:56', '1Cr 16:11', '1Cr 16:34', '1Cr 29:11',
    '2Cr 7:14', '2Cr 16:9', 'Ne 8:10', 'Jó 42:2',
    'Sl 1:1-2', 'Sl 3:3', 'Sl 4:8', 'Sl 5:3', 'Sl 9:10', 'Sl 16:8', 'Sl 16:11', 'Sl 18:2', 'Sl 19:1', 'Sl 19:14',
    'Sl 23:1', 'Sl 23:4', 'Sl 25:4-5', 'Sl 27:1', 'Sl 27:14', 'Sl 28:7', 'Sl 30:5', 'Sl 31:24', 'Sl 32:8', 'Sl 34:8',
    'Sl 34:18', 'Sl 37:4', 'Sl 37:5-6', 'Sl 37:7', 'Sl 40:1', 'Sl 42:11', 'Sl 46:1', 'Sl 46:10', 'Sl 51:10', 'Sl 55:22',
    'Sl 56:3', 'Sl 62:1', 'Sl 62:8', 'Sl 63:1', 'Sl 73:26', 'Sl 84:11', 'Sl 86:5', 'Sl 90:12', 'Sl 91:1', 'Sl 91:11',
    'Sl 95:6', 'Sl 100:4', 'Sl 103:1-2', 'Sl 103:12', 'Sl 107:1', 'Sl 116:1', 'Sl 118:24', 'Sl 119:11', 'Sl 119:105',
    'Sl 121:1-2', 'Sl 121:8', 'Sl 127:1', 'Sl 133:1', 'Sl 136:1', 'Sl 138:8', 'Sl 139:14', 'Sl 139:23-24', 'Sl 143:8',
    'Sl 145:18', 'Sl 147:3', 'Sl 150:6',
    'Pv 3:5-6', 'Pv 3:9', 'Pv 4:23', 'Pv 9:10', 'Pv 10:12', 'Pv 12:25', 'Pv 14:26', 'Pv 15:1', 'Pv 16:3', 'Pv 16:9',
    'Pv 17:17', 'Pv 18:10', 'Pv 19:21', 'Pv 22:6', 'Pv 27:17', 'Pv 28:13', 'Pv 30:5', 'Ec 3:1', 'Ec 12:13', 'Ct 8:7',
    'Is 9:6', 'Is 12:2', 'Is 25:1', 'Is 26:3', 'Is 26:4', 'Is 30:15', 'Is 40:8', 'Is 40:29', 'Is 40:31', 'Is 41:10',
    'Is 41:13', 'Is 43:1', 'Is 43:2', 'Is 43:19', 'Is 44:22', 'Is 49:15', 'Is 53:5', 'Is 54:10', 'Is 55:6', 'Is 55:8-9',
    'Is 58:11', 'Is 59:1', 'Is 61:1', 'Is 64:8',
    'Jr 17:7-8', 'Jr 29:11', 'Jr 29:13', 'Jr 31:3', 'Jr 33:3', 'Lm 3:22-23', 'Lm 3:25', 'Ez 36:26', 'Dn 2:20',
    'Os 6:3', 'Jl 2:13', 'Jl 2:28', 'Am 5:24', 'Mq 6:8', 'Mq 7:18', 'Na 1:7', 'Hc 2:14', 'Hc 3:17-18', 'Sf 3:17',
    'Ag 2:9', 'Zc 4:6', 'Ml 3:6', 'Ml 3:10',
    'Mt 4:4', 'Mt 4:19', 'Mt 5:3', 'Mt 5:6', 'Mt 5:8', 'Mt 5:9', 'Mt 5:14', 'Mt 5:16', 'Mt 6:6',
    'Mt 6:21', 'Mt 6:33', 'Mt 6:34', 'Mt 7:7-8', 'Mt 7:12', 'Mt 7:24', 'Mt 9:37-38', 'Mt 11:28', 'Mt 11:29-30', 'Mt 16:24',
    'Mt 18:20', 'Mt 19:26', 'Mt 22:37', 'Mt 22:39', 'Mt 24:35', 'Mt 28:19-20',
    'Mc 9:23', 'Mc 10:45', 'Mc 11:24', 'Mc 16:15',
    'Lc 1:37', 'Lc 2:10-11', 'Lc 6:31', 'Lc 6:36', 'Lc 9:23', 'Lc 11:9', 'Lc 12:32', 'Lc 15:7', 'Lc 18:27', 'Lc 19:10', 'Lc 21:33',
    'Jo 1:1', 'Jo 1:12-13', 'Jo 1:14', 'Jo 3:16', 'Jo 3:17', 'Jo 4:24', 'Jo 5:24', 'Jo 6:35', 'Jo 6:37', 'Jo 8:12',
    'Jo 8:31-32', 'Jo 8:36', 'Jo 10:10', 'Jo 10:11', 'Jo 10:27-28', 'Jo 11:25', 'Jo 13:34', 'Jo 13:35', 'Jo 14:1',
    'Jo 14:6', 'Jo 14:15', 'Jo 14:27', 'Jo 15:5', 'Jo 15:7', 'Jo 15:12', 'Jo 15:13', 'Jo 16:33', 'Jo 17:17', 'Jo 20:29',
    'At 1:8', 'At 2:38', 'At 2:42', 'At 4:12', 'At 16:31', 'At 17:28', 'At 20:35',
    'Rm 1:16', 'Rm 5:1', 'Rm 5:8', 'Rm 8:1', 'Rm 8:18', 'Rm 8:28', 'Rm 8:31', 'Rm 8:37',
    'Rm 8:38-39', 'Rm 10:9', 'Rm 10:17', 'Rm 12:1', 'Rm 12:2', 'Rm 12:12', 'Rm 12:21', 'Rm 13:10', 'Rm 15:13',
    '1Co 6:19-20', '1Co 10:13', '1Co 10:31', '1Co 13:4', '1Co 13:13', '1Co 15:57', '1Co 15:58', '1Co 16:13', '1Co 16:14',
    '2Co 4:16', '2Co 4:17-18', '2Co 5:7', '2Co 5:17', '2Co 9:7', '2Co 12:9',
    'Gl 2:20', 'Gl 5:1', 'Gl 5:22-23', 'Gl 6:2', 'Gl 6:9',
    'Ef 2:8-9', 'Ef 2:10', 'Ef 3:20-21', 'Ef 4:29', 'Ef 4:32', 'Ef 6:10', 'Ef 6:11',
    'Fp 1:6', 'Fp 1:21', 'Fp 2:3', 'Fp 3:13-14', 'Fp 4:4', 'Fp 4:6-7', 'Fp 4:8', 'Fp 4:13', 'Fp 4:19',
    'Cl 2:6-7', 'Cl 3:2', 'Cl 3:13', 'Cl 3:15', 'Cl 3:17', 'Cl 3:23',
    '1Ts 5:16-18', '2Ts 3:3', '1Tm 4:12', '1Tm 6:6', '2Tm 1:7', '2Tm 2:15', '2Tm 3:16-17', '2Tm 4:7', 'Tt 2:11',
    'Hb 4:12', 'Hb 4:16', 'Hb 11:1', 'Hb 11:6', 'Hb 12:1-2', 'Hb 13:5', 'Hb 13:8',
    'Tg 1:2-3', 'Tg 1:5', 'Tg 1:17', 'Tg 4:7', 'Tg 4:8', 'Tg 5:16',
    '1Pe 1:3', '1Pe 2:9', '1Pe 5:6-7', '1Pe 5:10', '2Pe 3:9', '2Pe 3:18',
    '1Jo 1:7', '1Jo 1:9', '1Jo 3:1', '1Jo 3:18', '1Jo 4:7', '1Jo 4:8', '1Jo 4:16', '1Jo 4:18', '1Jo 4:19', '1Jo 5:4',
    '3Jo 1:2', 'Jd 1:24-25', 'Ap 1:8', 'Ap 3:20', 'Ap 21:4', 'Ap 21:5', 'Ap 22:13',
    'Sl 8:1', 'Sl 34:1', 'Sl 36:5', 'Sl 57:10', 'Sl 89:1', 'Sl 112:7', 'Sl 119:89', 'Sl 119:165', 'Sl 130:5', 'Pv 11:25', 'Pv 15:3', 'Is 6:8', 'Is 30:18', 'Is 46:4', 'Jo 7:38', 'Jo 12:46', 'Jo 14:2', 'At 2:21', 'Rm 11:36', 'Rm 14:8', '1Co 1:18', '2Co 3:17', 'Gl 3:28', 'Fp 4:5', '1Ts 5:11', '1Jo 2:17', 'Ap 4:11', 'Ap 19:6'
  ];

  // Temas da pesquisa. "termos": ao menos um deve aparecer no texto de cada referência (conferido em teste).
  var TEMAS = [
    { id: 'fe', nome: 'Fé', termos: ['fé', 'crê', 'creu', 'crer', 'creem', 'crede', 'cremos'],
      refs: ['Hb 11:1', 'Hb 11:6', 'Rm 10:17', 'Rm 5:1', 'Ef 2:8', 'Gl 2:20', 'Mc 11:22', 'Tg 2:17', '2Co 5:7', 'Rm 1:17', 'Mt 17:20', 'Jo 20:29'] },
    { id: 'batismo', nome: 'Batismo', termos: ['batiz', 'batismo'],
      refs: ['Mt 28:19', 'Mc 16:16', 'At 2:38', 'At 2:41', 'At 8:36', 'At 8:38', 'At 10:47-48', 'At 22:16', 'Rm 6:3-4', 'Gl 3:27', 'Cl 2:12', '1Pe 3:21'] },
    { id: 'espirito', nome: 'Espírito Santo', termos: ['espírito'],
      refs: ['Jo 14:26', 'Jo 16:13', 'At 1:8', 'At 2:4', 'At 2:38', 'Rm 8:16', 'Rm 8:26', '1Co 6:19', 'Gl 5:22', 'Ef 4:30', 'Ef 5:18', 'Tt 3:5'] },
    { id: 'salvacao', nome: 'Salvação', termos: ['salva', 'salvo', 'salvou', 'salvar', 'salve', 'salvação', 'salvador'],
      refs: ['At 4:12', 'Rm 10:9', 'Rm 10:13', 'Ef 2:8', 'Tt 3:5', 'Jo 3:17', '1Tm 2:4', 'Hb 7:25', 'At 16:31', 'Rm 1:16', '2Co 6:2', 'Lc 19:10'] },
    { id: 'arrependimento', nome: 'Arrependimento', termos: ['arrepend', 'convertei', 'converter'],
      refs: ['Mt 3:2', 'Mt 4:17', 'Mc 1:15', 'Lc 5:32', 'Lc 13:3', 'Lc 15:7', 'At 2:38', 'At 3:19', 'At 17:30', 'At 26:20', '2Co 7:10', '2Pe 3:9'] },
    { id: 'ansiedade', nome: 'Ansiedade', termos: ['ansios', 'inquiet', 'turbe', 'perturb', 'cuidado', 'preocup', 'temas', 'temais', 'medo', 'ansiedade', 'aflij', 'aflito', 'angústia', 'carga', 'temer'],
      refs: ['Fp 4:6', 'Mt 6:34', 'Mt 6:25', '1Pe 5:7', 'Jo 14:27', 'Jo 14:1', 'Is 41:10', 'Sl 94:19', 'Sl 55:22', 'Lc 12:22', 'Sl 56:3', 'Lc 10:41'] },
    { id: 'perdao', nome: 'Perdão', termos: ['perdo', 'perdão', 'perdoa'],
      refs: ['Mt 6:14', 'Mt 6:15', 'Mt 18:21', 'Mc 11:25', 'Lc 6:37', 'Lc 23:34', 'Ef 4:32', 'Cl 3:13', '1Jo 1:9', 'Sl 86:5', 'Sl 130:4', 'At 10:43'] },
    { id: 'graca', nome: 'Graça', termos: ['graça'],
      refs: ['Ef 2:8', 'Rm 3:24', 'Rm 5:20', 'Rm 6:14', '2Co 12:9', 'Tt 2:11', 'Hb 4:16', 'Jo 1:16', 'Jo 1:17', '2Pe 3:18', 'Ef 1:7', 'Gl 2:21'] },
    { id: 'santificacao', nome: 'Santificação', termos: ['santific', 'santifiq', 'santo', 'santos', 'santa', 'santidade'],
      refs: ['1Ts 4:3', '1Ts 5:23', 'Hb 12:14', '1Pe 1:15-16', 'Jo 17:17', 'Rm 6:22', '2Co 7:1', 'Hb 10:10', '1Co 6:11', 'Lv 20:7', '2Tm 2:21', 'Rm 12:1'] },
    { id: 'oracao', nome: 'Oração', termos: ['ora', 'orai', 'orar', 'oração', 'orações', 'orando', 'pedi', 'peça', 'pedirdes', 'súplica', 'clama', 'clamar'],
      refs: ['Mt 6:6', 'Mt 7:7', 'Mt 26:41', 'Lc 18:1', 'Fp 4:6', '1Ts 5:17', 'Tg 5:16', 'Jo 14:13', 'Jr 33:3', 'Rm 12:12', 'Ef 6:18', 'At 2:42'] },
    { id: 'amor', nome: 'Amor', termos: ['amor', 'ama', 'amou', 'amai', 'amado', 'amarás', 'amemos', 'amamos', 'amar', 'ameis', 'amei'],
      refs: ['Jo 3:16', 'Jo 13:34', 'Jo 15:13', 'Rm 5:8', 'Rm 13:10', '1Co 13:4', '1Co 13:13', '1Jo 4:8', '1Jo 4:19', '1Jo 4:18', 'Mt 22:37', 'Mt 22:39'] },
    { id: 'esperanca', nome: 'Esperança', termos: ['esperança', 'espera', 'esperam', 'esperei', 'esperamos', 'expectativa'],
      refs: ['Rm 15:13', 'Rm 5:5', 'Rm 8:24', 'Hb 6:19', 'Hb 10:23', '1Pe 1:3', 'Sl 42:11', 'Rm 12:12', 'Lm 3:24', 'Sl 39:7', 'Pv 23:18', 'Tt 2:13'] },
    { id: 'familia', nome: 'Família', termos: ['casa', 'pai', 'mãe', 'filhos', 'filho', 'maridos', 'mulheres', 'mulher', 'marido', 'pais', 'família', 'menino'],
      refs: ['Js 24:15', 'Dt 6:6-7', 'Pv 22:6', 'Ef 6:1', 'Ef 6:4', 'Ef 5:25', 'Cl 3:18', 'Cl 3:19', 'Cl 3:20', 'Sl 127:3', 'Êx 20:12', 'At 16:31'] },
    { id: 'gratidao', nome: 'Gratidão', termos: ['graças', 'louvai', 'louvor', 'agradec', 'rendei', 'bendize', 'grat', 'celebrai'],
      refs: ['1Ts 5:18', 'Sl 100:4', 'Sl 107:1', 'Sl 136:1', 'Cl 3:17', 'Cl 3:15', 'Ef 5:20', 'Fp 4:6', 'Sl 103:2', '1Cr 16:34', 'Hb 13:15', 'Sl 118:1'] }
  ];

  // Personagens: "termo" deve aparecer no capítulo indicado (conferido em teste).
  var PERSONAGENS = [
    { nome: 'Adão', termo: 'adão', refs: ['Gn 2', 'Gn 5'] },
    { nome: 'Noé', termo: 'noé', refs: ['Gn 6', 'Gn 7', 'Gn 8', 'Gn 9'] },
    { nome: 'Abraão', termo: 'abraão', refs: ['Gn 17', 'Gn 22'] },
    { nome: 'Sara', termo: 'sara', refs: ['Gn 18', 'Gn 21'] },
    { nome: 'Isaque', termo: 'isaque', refs: ['Gn 21', 'Gn 26'] },
    { nome: 'Jacó', termo: 'jacó', refs: ['Gn 28', 'Gn 32'] },
    { nome: 'José do Egito', termo: 'josé', refs: ['Gn 37', 'Gn 45', 'Gn 50'] },
    { nome: 'Moisés', termo: 'moisés', refs: ['Êx 3', 'Êx 14', 'Dt 34'] },
    { nome: 'Josué', termo: 'josué', refs: ['Js 1', 'Js 6', 'Js 24'] },
    { nome: 'Rute', termo: 'rute', refs: ['Rt 1', 'Rt 4'] },
    { nome: 'Samuel', termo: 'samuel', refs: ['1Sm 3', '1Sm 16'] },
    { nome: 'Davi', termo: 'davi', refs: ['1Sm 16', '1Sm 17', '2Sm 7'] },
    { nome: 'Salomão', termo: 'salomão', refs: ['1Rs 3', '1Rs 8'] },
    { nome: 'Elias', termo: 'elias', refs: ['1Rs 17', '1Rs 18', '1Rs 19'] },
    { nome: 'Ester', termo: 'ester', refs: ['Et 4', 'Et 7'] },
    { nome: 'Jó', termo: 'jó', refs: ['Jó 1', 'Jó 42'] },
    { nome: 'Daniel', termo: 'daniel', refs: ['Dn 1', 'Dn 6'] },
    { nome: 'Jonas', termo: 'jonas', refs: ['Jn 1', 'Jn 3'] },
    { nome: 'Maria, mãe de Jesus', termo: 'maria', refs: ['Lc 1', 'Lc 2'] },
    { nome: 'João Batista', termo: 'joão', refs: ['Mt 3', 'Lc 3', 'Jo 1'] },
    { nome: 'Jesus', termo: 'jesus', refs: ['Lc 2', 'Mt 5', 'Jo 1', 'Jo 19', 'Jo 20'] },
    { nome: 'Pedro', termo: 'pedro', refs: ['Mt 16', 'Jo 21', 'At 2'] },
    { nome: 'Tiago, filho de Zebedeu', termo: 'tiago', refs: ['Mc 1', 'At 12'] },
    { nome: 'João, apóstolo', termo: 'joão', refs: ['Mc 1', 'At 3', 'At 4'] },
    { nome: 'Maria Madalena', termo: 'madalena', refs: ['Jo 20', 'Mc 16'] },
    { nome: 'Estêvão', termo: 'estêvão', refs: ['At 6', 'At 7'] },
    { nome: 'Filipe, o evangelista', termo: 'filipe', refs: ['At 8'] },
    { nome: 'Paulo (Saulo)', termo: 'saulo', refs: ['At 9', 'At 13'] },
    { nome: 'Barnabé', termo: 'barnabé', refs: ['At 4', 'At 11', 'At 13'] },
    { nome: 'Timóteo', termo: 'timóteo', refs: ['At 16', '1Tm 1'] },
    { nome: 'Lídia', termo: 'lídia', refs: ['At 16'] },
    { nome: 'Priscila e Áquila', termo: 'áquila', refs: ['At 18', 'Rm 16'] }
  ];

  // Galeria de artes prontas: categoria -> referências (texto renderizado na hora).
  var GALERIA = [
    { id: 'fe', nome: 'Versículos de fé', refs: ['Hb 11:1', 'Mc 9:23', '2Co 5:7', 'Hb 11:6', 'Rm 10:17'] },
    { id: 'promessas', nome: 'Promessas de Deus', refs: ['Is 41:10', 'Jr 29:11', 'Mt 28:20', 'Sl 37:4', 'Is 43:2', 'Dt 31:8'] },
    { id: 'salmos', nome: 'Salmos', refs: ['Sl 23:1', 'Sl 27:1', 'Sl 46:1', 'Sl 91:1', 'Sl 121:1-2', 'Sl 119:105'] },
    { id: 'proverbios', nome: 'Provérbios', refs: ['Pv 3:5-6', 'Pv 4:23', 'Pv 16:3', 'Pv 18:10', 'Pv 17:17'] },
    { id: 'jesus', nome: 'Palavras de Jesus', refs: ['Jo 14:6', 'Mt 11:28', 'Jo 8:12', 'Jo 11:25', 'Jo 14:27', 'Mt 5:14'] },
    { id: 'esperanca', nome: 'Esperança', refs: ['Rm 15:13', 'Lm 3:22-23', 'Is 40:31', 'Ap 21:4', 'Sl 42:11'] },
    { id: 'oracao', nome: 'Oração', refs: ['Fp 4:6-7', '1Ts 5:16-18', 'Jr 33:3', 'Mt 7:7', 'Tg 5:16'] },
    { id: 'familia', nome: 'Família', refs: ['Js 24:15', 'Sl 127:1', 'Pv 22:6', 'Sl 133:1', 'Cl 3:14'] },
    { id: 'salvacao', nome: 'Salvação', refs: ['Jo 3:16', 'At 4:12', 'Rm 5:8', 'Ef 2:8-9', 'Rm 10:9'] },
    { id: 'gratidao', nome: 'Gratidão', refs: ['Sl 107:1', '1Ts 5:18', 'Sl 100:4', 'Sl 118:24', 'Cl 3:17'] },
    { id: 'perdao', nome: 'Perdão', refs: ['Ef 4:32', '1Jo 1:9', 'Cl 3:13', 'Sl 103:12', 'Mq 7:18'] },
    { id: 'reflexoes', nome: 'Reflexões cristãs', refs: ['Mq 6:8', 'Rm 12:2', 'Gl 6:9', 'Fp 4:8', 'Cl 3:23', 'At 2:42'] },
    { id: 'fotos', nome: 'Fotos da criação', fotos: ['aurora-boreal', 'fiorde', 'papoulas', 'margaridas', 'lago-amanhecer', 'leao', 'caminho-estreito', 'cidade', 'mapa-mundi', 'vela', 'rochas-mar', 'pier', 'jardim', 'iceberg', 'vulcao', 'caminho-outono'],
      refs: ['Sl 19:1', 'Gn 1:1', 'Is 40:8', 'Mt 6:28', 'Sl 23:2', 'Ap 5:5', 'Mt 7:14', 'Mt 5:14', 'Mc 16:15', 'Sl 119:105', 'Is 43:2', 'Sl 46:10', 'Sl 1:3', 'Sl 51:7', 'Hb 12:29', 'Ec 3:1'] },
    { id: 'papeis', nome: 'Papéis de parede', papel: true, refs: ['Sl 46:10', 'Fp 4:13', 'Is 41:10', 'Sl 23:1', 'Jo 14:6', 'Js 1:9', 'Sl 119:105', 'Mt 11:28', 'Rm 8:28', 'Lm 3:22-23', 'Pv 3:5-6', 'At 2:42'] }
  ];

  var CATEGORIAS_DEVOCIONAL = ['Fé', 'Esperança', 'Amor', 'Perdão', 'Salvação', 'Santidade', 'Oração', 'Família',
    'Espírito Santo', 'Discipulado', 'Ensinamentos de Jesus', 'Doutrina dos apóstolos'];

  // Embaralhamento determinístico (mulberry32) para o ciclo do versículo do dia
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function embaralhar(lista, seed) {
    var a = lista.slice(), r = rng(seed);
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  var ORDEM_DIA = embaralhar(VERSICULOS_DIA, 4202);   // Atos 2:42

  function diaNumero(iso) { var p = iso.split('-'); return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
  // Versículo do dia: mesmo para todos no mesmo dia; repete só depois de percorrer a lista inteira.
  function versiculoDoDia(iso) { var n = diaNumero(iso), L = ORDEM_DIA.length; return ORDEM_DIA[((n % L) + L) % L]; }
  function anteriores(iso, qtd) {
    var out = [], n = diaNumero(iso);
    for (var i = 1; i <= qtd; i++) {
      var d = new Date((n - i) * 86400000), s = d.toISOString().slice(0, 10);
      out.push({ data: s, ref: versiculoDoDia(s) });
    }
    return out;
  }

  var API = { VERSICULOS_DIA: VERSICULOS_DIA, ORDEM_DIA: ORDEM_DIA, TEMAS: TEMAS, PERSONAGENS: PERSONAGENS, GALERIA: GALERIA,
    CATEGORIAS_DEVOCIONAL: CATEGORIAS_DEVOCIONAL, versiculoDoDia: versiculoDoDia, anteriores: anteriores, diaNumero: diaNumero, embaralhar: embaralhar };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Conteudo = API;
})(typeof window !== 'undefined' ? window : this);
