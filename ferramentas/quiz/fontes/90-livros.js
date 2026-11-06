// ATOS 2 — perguntas geradas a partir da própria Bíblia: número de capítulos e ordem dos livros.
// As respostas são calculadas do índice da Bíblia Livre, por isso não podem divergir do texto.
const B = require('../../../test/biblia-node.js');
const Q = require('../../../app/js/nucleo/quiz.js');
const JA_EXISTEM = ['PSA', 'GEN', 'ISA', 'REV']; // já perguntados no banco original
const CONHECIDOS = ['EXO', 'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', 'PRO'];
const DIFICEIS = ['profetas-menores', 'gerais'];
module.exports = { prefixo: null, fonte: function (q) {
  const livros = B.indice.livros;
  livros.forEach((l, i) => {
    const n = B.contagem(l.id).length, sec = Q.secaoDoLivro(l.id);
    if (!JA_EXISTEM.includes(l.id)) {
      const dif = n === 1 || CONHECIDOS.includes(l.id) ? 2 : DIFICEIS.includes(sec) || ['1CH', '2CH', 'EZR', 'NEH', 'LAM', 'EZK'].includes(l.id) ? 4 : 3;
      q.capitulos(l.id, dif);
    }
    if (i < livros.length - 1) {
      const dif = ['pentateuco', 'evangelhos'].includes(sec) ? 1 : ['historicos', 'atos', 'apocalipse'].includes(sec) ? 2 : DIFICEIS.includes(sec) ? 4 : 3;
      q.ordem(l.id, dif);
    }
  });
} };
