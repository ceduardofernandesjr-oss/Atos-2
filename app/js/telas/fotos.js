/* ATOS 2 — fotos de fundo (Pixabay). Gerado por ferramentas/preparar_fotos.py.
   Licença de Conteúdo do Pixabay: uso livre, sem atribuição obrigatória; a foto nunca é distribuída
   sozinha — no app ela sempre leva o versículo (ou um texto) por cima, formando uma obra nova. */
(function (root) {
  'use strict';
  var LISTA = [
    {
      "id": "rochas-mar",
      "nome": "Rochas e mar",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.25
    },
    {
      "id": "praia",
      "nome": "Praia de águas claras",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.3,
      "y": 0.3
    },
    {
      "id": "aurora-boreal",
      "nome": "Aurora boreal",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.1
    },
    {
      "id": "vulcao",
      "nome": "Vulcão sob as estrelas",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.15
    },
    {
      "id": "pier",
      "nome": "Píer ao pôr do sol",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.25
    },
    {
      "id": "jardim",
      "nome": "Jardim refletido",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.3
    },
    {
      "id": "fiorde",
      "nome": "Fiorde",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.3
    },
    {
      "id": "capim",
      "nome": "Capim ao vento",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.25
    },
    {
      "id": "lago-amanhecer",
      "nome": "Lago ao amanhecer",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.25
    },
    {
      "id": "urzes",
      "nome": "Flores na encosta",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.3
    },
    {
      "id": "lago-outono",
      "nome": "Lago no outono",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.25
    },
    {
      "id": "floresta-nevoa",
      "nome": "Floresta na névoa",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.3
    },
    {
      "id": "caminho-outono",
      "nome": "Caminho de outono",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.3
    },
    {
      "id": "cisnes",
      "nome": "Cisnes no lago",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.2
    },
    {
      "id": "caminho-estreito",
      "nome": "Caminho estreito",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.3
    },
    {
      "id": "iceberg",
      "nome": "Iceberg",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.3
    },
    {
      "id": "leao",
      "nome": "Leão de Judá",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.2
    },
    {
      "id": "cidade",
      "nome": "Cidade ao entardecer",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.3
    },
    {
      "id": "papoulas",
      "nome": "Papoulas ao sol",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.3,
      "y": 0.74
    },
    {
      "id": "mapa-mundi",
      "nome": "O mundo inteiro",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.45
    },
    {
      "id": "folha",
      "nome": "Folhas sobre o branco",
      "pc": true,
      "cor": "#14284B",
      "escurecer": 0,
      "y": 0.16
    },
    {
      "id": "telhado",
      "nome": "Linhas e luz",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.4
    },
    {
      "id": "vela",
      "nome": "Vela acesa",
      "pc": false,
      "cor": "#14284B",
      "escurecer": 0,
      "y": 0.17
    },
    {
      "id": "flores-vermelhas",
      "nome": "Flores vermelhas",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.3
    },
    {
      "id": "margaridas",
      "nome": "Margaridas",
      "pc": true,
      "cor": "#FFFFFF",
      "escurecer": 0.3,
      "y": 0.27
    }
  ];
  var POR_ID = {}; LISTA.forEach(function (f) { POR_ID[f.id] = f; });
  // Arquivo certo para o tamanho da arte: computador (paisagem) ou celular; miniatura para prévias pequenas.
  function arquivo(id, W, H, larguraPx) {
    var f = POR_ID[id]; if (!f) return null;
    var tipo = larguraPx && larguraPx <= 420 ? 'mini' : (W / H > 1.2 && f.pc ? 'pc' : 'cel');
    return 'fundos/fotos/' + id + '-' + tipo + '.jpg';
  }
  root.A2Fotos = { LISTA: LISTA, POR_ID: POR_ID, arquivo: arquivo,
    CREDITO: 'Fotos dos fundos: Pixabay (pixabay.com), usadas sob a Licença de Conteúdo do Pixabay.' };
})(window);
