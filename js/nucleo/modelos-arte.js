/*
 * ATOS 2 — Modelos do Estúdio de Criação (dados puros).
 * Cada modelo define fundo e camadas; o texto bíblico nunca faz parte do modelo:
 * ele vem da tradução escolhida no momento da criação.
 * Navegador: window.A2Modelos · Node: module.exports
 */
(function (root) {
  'use strict';

  var CATEGORIAS = [
    { id: 'minimalista', nome: 'Minimalista' }, { id: 'paisagens', nome: 'Paisagens' }, { id: 'natureza', nome: 'Natureza' },
    { id: 'ceu', nome: 'Céu e pôr do sol' }, { id: 'classico', nome: 'Clássico' }, { id: 'elegante', nome: 'Elegante' },
    { id: 'moderno', nome: 'Moderno' }, { id: 'tipografico', nome: 'Tipográfico' }, { id: 'devocional', nome: 'Devocional' },
    { id: 'infantil', nome: 'Infantil' }, { id: 'escuro', nome: 'Escuro' }, { id: 'editorial', nome: 'Editorial' }
  ];

  function V(o) { return Object.assign({ papel: 'versiculo' }, o); }
  function R(o) { return Object.assign({ papel: 'referencia' }, o); }
  function T(texto, o) { return Object.assign({ papel: 'livre', texto: texto }, o); }
  function E(forma, o) { return Object.assign({ tipo: 'elemento', forma: forma }, o); }
  function foto(id, escurecer, estilo) { return { tipo: 'banco', id: id, sobreposicao: { cor: '#000000', opacidade: escurecer, estilo: estilo || 'uniforme' } }; }
  function cor(c) { return { tipo: 'cor', cor: c }; }
  function grad(a, b, ang, radial) { return { tipo: 'gradiente', cores: [a, b], angulo: ang == null ? 180 : ang, radial: !!radial }; }
  var semSombra = { sombra: 0 };
  function claro(o) { return Object.assign({}, semSombra, o); }

  var MODELOS = [];
  function M(cat, id, nome, fundo, camadas) { MODELOS.push({ id: id, categoria: cat, nome: nome, fundo: fundo, camadas: camadas }); }

  // ---------------------------------------------------------------- Minimalista
  M('minimalista', 'min-creme', 'Creme e ouro', cor('#F4F0E5'), [E('linha', { x: 0.5, y: 0.15, w: 0.1, h: 0.006, cor: '#A58A57', espessura: 3 }), V(claro({ cor: '#192D50' })), R(claro({ cor: '#A58A57' }))]);
  M('minimalista', 'min-branco', 'Branco limpo', cor('#FFFFFF'), [E('linha', { x: 0.17, y: 0.14, w: 0.1, h: 0.006, cor: '#A58A57', espessura: 4 }), V(claro({ fonte: 'Montserrat', cor: '#1C1C1C', alinhar: 'left', largura: 0.76, entrelinha: 1.35 })), R(claro({ cor: '#A58A57', alinhar: 'left' }))]);
  M('minimalista', 'min-azul', 'Azul Atos 2', cor('#192D50'), [E('icone', { icone: 'cruz', x: 0.5, y: 0.12, w: 0.06, h: 0.06, cor: '#A58A57' }), V(claro({ fonte: 'Lora', cor: '#F4F0E5' })), R(claro({ cor: '#C9AE78' }))]);
  M('minimalista', 'min-areia', 'Areia', cor('#E9E1D3'), [V(claro({ fonte: 'Josefin Sans', maiusculas: true, cor: '#3B3A36', entrelinha: 1.45, largura: 0.74 })), R(claro({ cor: '#8A6E3E' }))]);
  M('minimalista', 'min-salvia', 'Sálvia', cor('#DCE3D3'), [V(claro({ fonte: 'Playfair Display', italico: true, cor: '#2F4A3A' })), R(claro({ cor: '#5E7A62' })), E('ornamento', { estilo: 'divisor', x: 0.5, y: 0.9, w: 0.3, h: 0.03, cor: '#5E7A62', espessura: 2 })]);

  // ---------------------------------------------------------------- Paisagens
  M('paisagens', 'pai-fiorde', 'Fiorde', foto('fiorde', 0.3), [V({}), R({})]);
  M('paisagens', 'pai-lago', 'Lago ao amanhecer', foto('lago-amanhecer', 0.25), [V({ fonte: 'Playfair Display' }), R({})]);
  M('paisagens', 'pai-rochas', 'Rochas e mar', foto('rochas-mar', 0.3), [V({ fonte: 'Lora', alinhar: 'left', largura: 0.76 }), R({ alinhar: 'left' })]);
  M('paisagens', 'pai-caminho', 'Caminho estreito', foto('caminho-estreito', 0.32), [V({ fonte: 'Cinzel', entrelinha: 1.35 }), R({})]);
  M('paisagens', 'pai-iceberg', 'Iceberg', Object.assign(foto('iceberg', 0.6, 'base')), [V({ fonte: 'Literata', y: 0.62 }), R({})]);
  M('paisagens', 'pai-urzes', 'Flores na encosta', foto('urzes', 0.3), [V({ fonte: 'Josefin Sans', maiusculas: true, entrelinha: 1.45 }), R({})]);

  // ---------------------------------------------------------------- Natureza
  M('natureza', 'nat-floresta', 'Floresta na névoa', foto('floresta-nevoa', 0.3), [V({}), R({})]);
  M('natureza', 'nat-folha', 'Folhas sobre o branco', foto('folha', 0.04), [V(claro({ fonte: 'Playfair Display', cor: '#2E3A2F' })), R(claro({ cor: '#6B7F4E' }))]);
  M('natureza', 'nat-margaridas', 'Margaridas', foto('margaridas', 0.35), [V({ fonte: 'Lora' }), R({})]);
  M('natureza', 'nat-papoulas', 'Papoulas', foto('papoulas', 0.55, 'base'), [V({ fonte: 'Libre Baskerville', y: 0.62 }), R({})]);
  M('natureza', 'nat-cisnes', 'Cisnes no lago', foto('cisnes', 0.3), [V({ italico: true }), R({})]);
  M('natureza', 'nat-leao', 'Leão de Judá', foto('leao', 0.3), [V({ fonte: 'Cinzel' }), R({})]);

  // ---------------------------------------------------------------- Céu e pôr do sol
  M('ceu', 'ceu-pier', 'Píer ao pôr do sol', foto('pier', 0.25), [V({}), R({})]);
  M('ceu', 'ceu-aurora', 'Aurora boreal', foto('aurora-boreal', 0.15), [V({ fonte: 'Playfair Display' }), R({})]);
  M('ceu', 'ceu-praia', 'Praia', foto('praia', 0.3), [V({ fonte: 'Montserrat', y: 0.32, altura: 0.45 }), R({})]);
  M('ceu', 'ceu-crepusculo', 'Crepúsculo', grad('#F6A65A', '#6E3B7E', 180), [E('icone', { icone: 'sol', x: 0.5, y: 0.84, w: 0.16, h: 0.16, cor: '#FFE3B0', opacidade: 0.8 }), V({ fonte: 'Lora', sombra: 0.3 }), R({ sombra: 0.3 })]);
  M('ceu', 'ceu-alvorada', 'Alvorada', grad('#9CC6E8', '#FBE3C3', 180), [E('textura', { estilo: 'luz', cor: '#FFFFFF', opacidade: 0.5 }), V(claro({ cor: '#1F3550' })), R(claro({ cor: '#A0643A' }))]);
  M('ceu', 'ceu-cidade', 'Cidade ao entardecer', foto('cidade', 0.35), [V({ fonte: 'Josefin Sans', maiusculas: true, entrelinha: 1.45 }), R({})]);

  // ---------------------------------------------------------------- Clássico
  M('classico', 'cla-pergaminho', 'Pergaminho', cor('#F2E8D5'), [E('textura', { estilo: 'papel', cor: '#8A6A3A', opacidade: 0.5 }), E('moldura', { estilo: 'dupla', x: 0.5, y: 0.5, w: 0.9, h: 0.92, cor: '#7A5C2E', espessura: 3 }),
    E('ornamento', { estilo: 'divisor', x: 0.5, y: 0.14, w: 0.32, h: 0.03, cor: '#7A5C2E', espessura: 2 }), V(claro({ cor: '#3A2A17' })), R(claro({ cor: '#7A5C2E' }))]);
  M('classico', 'cla-real', 'Real', cor('#192D50'), [E('moldura', { estilo: 'cantos', x: 0.5, y: 0.5, w: 0.88, h: 0.9, cor: '#A58A57', espessura: 4 }), V(claro({ fonte: 'Cinzel', cor: '#F4F0E5' })), R(claro({ cor: '#C9AE78' }))]);
  M('classico', 'cla-outono', 'Caminho de outono', foto('caminho-outono', 0.35), [V({ fonte: 'Libre Baskerville' }), R({}), E('ornamento', { estilo: 'divisor', x: 0.5, y: 0.1, w: 0.3, h: 0.03, cor: '#FFFFFF', opacidade: 0.8, espessura: 2 })]);
  M('classico', 'cla-mapa', 'O mundo inteiro', foto('mapa-mundi', 0.4), [E('moldura', { x: 0.5, y: 0.5, w: 0.92, h: 0.94, cor: '#FFFFFF', opacidade: 0.6, espessura: 2 }), V({}), R({})]);
  M('classico', 'cla-marfim', 'Marfim', cor('#FBF7EE'), [E('ornamento', { estilo: 'aspas', x: 0.5, y: 0.16, w: 0.16, h: 0.12, cor: '#D9C7A3' }), V(claro({ fonte: 'Libre Baskerville', italico: true, cor: '#2A2A2A', aspas: false })), R(claro({ cor: '#8C6A3F' }))]);

  // ---------------------------------------------------------------- Elegante
  M('elegante', 'ele-marinho', 'Marinho e ouro', grad('#192D50', '#0C1628', 180), [E('moldura', { x: 0.5, y: 0.5, w: 0.86, h: 0.9, cor: '#A58A57', espessura: 2 }), V(claro({ fonte: 'Playfair Display', italico: true, cor: '#EFE2C4' })), R(claro({ cor: '#A58A57' }))]);
  M('elegante', 'ele-onix', 'Ônix', cor('#111111'), [E('linha', { x: 0.5, y: 0.1, w: 0.22, h: 0.004, cor: '#A58A57', espessura: 2 }), E('linha', { x: 0.5, y: 0.9, w: 0.22, h: 0.004, cor: '#A58A57', espessura: 2 }), V(claro({ fonte: 'Cinzel', cor: '#E8D3A2' })), R(claro({ cor: '#A58A57' }))]);
  M('elegante', 'ele-vinho', 'Vinho', cor('#4A1C2A'), [E('ornamento', { estilo: 'ramos', x: 0.5, y: 0.87, w: 0.34, h: 0.08, cor: '#D4A373' }), V(claro({ italico: true, cor: '#F6E7DA' })), R(claro({ cor: '#D4A373' }))]);
  M('elegante', 'ele-vela', 'Vela acesa', foto('vela', 0.35), [V({ fonte: 'Playfair Display' }), R({ cor: '#E8C98E' })]);
  M('elegante', 'ele-dourado', 'Dourado suave', grad('#F4F0E5', '#E7D9B8', 135), [E('moldura', { x: 0.5, y: 0.5, w: 0.9, h: 0.93, cor: '#A58A57', espessura: 2 }), E('ornamento', { estilo: 'divisor', x: 0.5, y: 0.14, w: 0.3, h: 0.03, cor: '#A58A57', espessura: 2 }), V(claro({ fonte: 'Playfair Display', cor: '#192D50' })), R(claro({ cor: '#A58A57' }))]);

  // ---------------------------------------------------------------- Moderno
  M('moderno', 'mod-barra', 'Barra lateral', cor('#F4F0E5'), [E('retangulo', { x: 0.075, y: 0.5, w: 0.018, h: 0.46, cor: '#A58A57' }), V(claro({ fonte: 'Montserrat', negrito: true, alinhar: 'left', cor: '#192D50', largura: 0.76, x: 0.54 })), R(claro({ alinhar: 'left', cor: '#A58A57' }))]);
  M('moderno', 'mod-circulo', 'Círculo dourado', cor('#192D50'), [E('circulo', { x: 0.88, y: 0.1, w: 0.56, h: 0.45, cor: '#A58A57', opacidade: 0.9 }), V(claro({ fonte: 'Montserrat', negrito: true, maiusculas: true, cor: '#FFFFFF', alinhar: 'left', largura: 0.78, y: 0.56 })), R(claro({ alinhar: 'left', cor: '#C9AE78' }))]);
  M('moderno', 'mod-linhas', 'Linhas e luz', foto('telhado', 0.4), [V({ fonte: 'Montserrat', alinhar: 'left', largura: 0.78 }), R({ alinhar: 'left' })]);
  M('moderno', 'mod-oceano', 'Oceano', grad('#0F4C5C', '#1F8A8A', 135), [E('circulo', { x: 0.5, y: 0.5, w: 0.86, h: 0.69, cor: '#FFFFFF', opacidade: 0.12, preenchido: false, espessura: 3 }), V(claro({ fonte: 'Manrope', negrito: true, cor: '#FFFFFF', largura: 0.7 })), R(claro({ cor: '#BFE6DE' }))]);
  M('moderno', 'mod-duo', 'Duas cores', cor('#A58A57'), [E('retangulo', { x: 0.5, y: 0.31, w: 1, h: 0.62, cor: '#192D50' }), V(claro({ fonte: 'Montserrat', negrito: true, cor: '#FFFFFF', y: 0.31, altura: 0.46 })), R(claro({ cor: '#192D50', ancora: null, y: 0.81 }))]);

  // ---------------------------------------------------------------- Tipográfico
  M('tipografico', 'tip-bebas', 'Impacto', cor('#111111'), [V(claro({ fonte: 'Bebas Neue', cor: '#FFFFFF', entrelinha: 1.05, tamanhoMax: 150, largura: 0.84, aspas: false })), R(claro({ cor: '#A58A57' }))]);
  M('tipografico', 'tip-ouro', 'Ouro e marinho', cor('#B59A63'), [V(claro({ fonte: 'Bebas Neue', cor: '#192D50', entrelinha: 1.05, tamanhoMax: 150, largura: 0.84, aspas: false })), R(claro({ cor: '#192D50', opacidade: 0.8 }))]);
  M('tipografico', 'tip-cinzel', 'Romano', cor('#F4F0E5'), [V(claro({ fonte: 'Cinzel', negrito: true, cor: '#192D50', entrelinha: 1.25, tamanhoMax: 110 })), R(claro({ cor: '#A58A57' }))]);
  M('tipografico', 'tip-italico', 'Itálico com régua', cor('#FFFFFF'), [E('retangulo', { x: 0.1, y: 0.5, w: 0.008, h: 0.5, cor: '#192D50' }), V(claro({ fonte: 'Playfair Display', italico: true, cor: '#192D50', alinhar: 'left', x: 0.55, largura: 0.74, tamanhoMax: 110 })), R(claro({ alinhar: 'left', cor: '#A58A57' }))]);
  M('tipografico', 'tip-contorno', 'Contorno', cor('#192D50'), [V(claro({ fonte: 'Montserrat', negrito: true, maiusculas: true, cor: '#192D50', contorno: 3, corContorno: '#F4F0E5', aspas: false })), R(claro({ cor: '#A58A57' }))]);

  // ---------------------------------------------------------------- Devocional
  M('devocional', 'dev-chama', 'Línguas de fogo', grad('#FBEBD3', '#F0C99A', 180), [E('icone', { icone: 'chama', x: 0.5, y: 0.13, w: 0.1, h: 0.1, cor: '#C8642D' }), V(claro({ fonte: 'Lora', italico: true, cor: '#4A2A17' })), R(claro({ cor: '#A0522D' }))]);
  M('devocional', 'dev-pomba', 'Pomba', grad('#E6F0F8', '#C9DDF0', 180), [E('icone', { icone: 'pomba', x: 0.5, y: 0.13, w: 0.13, h: 0.13, cor: '#5C7FA3' }), V(claro({ cor: '#1F3550' })), R(claro({ cor: '#5C7FA3' }))]);
  M('devocional', 'dev-vela', 'Oração', foto('vela', 0.3), [V({ fonte: 'Lora', italico: true }), R({})]);
  M('devocional', 'dev-cruz', 'Cruz ao amanhecer', foto('lago-amanhecer', 0.3), [E('icone', { icone: 'cruz', x: 0.5, y: 0.12, w: 0.06, h: 0.06, cor: '#FFFFFF', opacidade: 0.9 }), V({}), R({})]);
  M('devocional', 'dev-luz', 'Luz', cor('#F4F0E5'), [E('ornamento', { estilo: 'raios', x: 0.5, y: 0.2, w: 1.3, h: 0.5, cor: '#E7C98F', opacidade: 0.4 }), V(claro({ fonte: 'Literata', cor: '#3B2F1E' })), R(claro({ cor: '#A58A57' }))]);
  M('devocional', 'dev-pao', 'Partir do pão', cor('#EFE6D6'), [E('icone', { icone: 'trigo', x: 0.5, y: 0.13, w: 0.1, h: 0.1, cor: '#A58A57' }), V(claro({ fonte: 'Cormorant Garamond', cor: '#3A2A17' })), R(claro({ cor: '#8C6A3F' }))]);

  // ---------------------------------------------------------------- Infantil
  M('infantil', 'inf-sol', 'Dia de sol', cor('#FFE08A'), [E('icone', { icone: 'sol', x: 0.84, y: 0.12, w: 0.22, h: 0.22, cor: '#FFB347' }), E('circulo', { x: 0.1, y: 0.92, w: 0.26, h: 0.21, cor: '#8FD3C7' }),
    V(claro({ fonte: 'Montserrat', negrito: true, cor: '#3A2E7A', aspas: false })), R(claro({ cor: '#E2574C' }))]);
  M('infantil', 'inf-estrelas', 'Estrelinhas', cor('#CFE8FF'), [E('icone', { icone: 'estrela', x: 0.14, y: 0.12, w: 0.12, h: 0.12, cor: '#FFC94D' }), E('icone', { icone: 'estrela', x: 0.86, y: 0.2, w: 0.08, h: 0.08, cor: '#FF9DBB' }),
    E('icone', { icone: 'estrela', x: 0.82, y: 0.9, w: 0.1, h: 0.1, cor: '#FFC94D' }), V(claro({ fonte: 'Manrope', negrito: true, cor: '#23406E', aspas: false })), R(claro({ cor: '#E56B9E' }))]);
  M('infantil', 'inf-coracao', 'Corações', cor('#FFE1EA'), [E('icone', { icone: 'coracao', x: 0.15, y: 0.12, w: 0.12, h: 0.12, cor: '#FF7FA5' }), E('icone', { icone: 'coracao', x: 0.86, y: 0.88, w: 0.1, h: 0.1, cor: '#FFB0C8' }),
    V(claro({ fonte: 'Dancing Script', negrito: true, cor: '#7A2E4F', aspas: false })), R(claro({ cor: '#C24B7A' }))]);
  M('infantil', 'inf-menta', 'Bolhas', cor('#D7F5E9'), [E('circulo', { x: 0.08, y: 0.08, w: 0.34, h: 0.27, cor: '#FFD166', opacidade: 0.85 }), E('circulo', { x: 0.94, y: 0.92, w: 0.38, h: 0.3, cor: '#7BD0F5', opacidade: 0.85 }),
    V(claro({ fonte: 'Montserrat', negrito: true, cor: '#1E5A4C', aspas: false })), R(claro({ cor: '#EF6F6C' }))]);
  M('infantil', 'inf-arcoiris', 'Arco-íris', grad('#FFD3A5', '#A8E6CF', 135), [E('icone', { icone: 'estrela', x: 0.5, y: 0.12, w: 0.1, h: 0.1, cor: '#FFFFFF' }), V(claro({ fonte: 'Manrope', negrito: true, cor: '#4B3B8F', aspas: false })), R(claro({ cor: '#E2574C' }))]);

  // ---------------------------------------------------------------- Escuro
  M('escuro', 'esc-grafite', 'Grafite', cor('#0F1115'), [E('textura', { estilo: 'granulado', cor: '#FFFFFF', opacidade: 0.35 }), V(claro({ cor: '#F4F0E5' })), R(claro({ cor: '#A58A57' }))]);
  M('escuro', 'esc-vulcao', 'Céu estrelado', foto('vulcao', 0.2), [V({ fonte: 'Playfair Display' }), R({})]);
  M('escuro', 'esc-aurora', 'Noite de aurora', foto('aurora-boreal', 0.45, 'vinheta'), [V({ fonte: 'Josefin Sans', maiusculas: true, entrelinha: 1.45 }), R({})]);
  M('escuro', 'esc-noite', 'Noite santa', grad('#1C2640', '#0E1424', 0, true), [E('textura', { estilo: 'vinheta', cor: '#000000', opacidade: 0.6 }), E('icone', { icone: 'estrela', x: 0.5, y: 0.12, w: 0.06, h: 0.06, cor: '#C9A45C' }), V(claro({ fonte: 'Lora', cor: '#F2E6C9' })), R(claro({ cor: '#C9A45C' }))]);
  M('escuro', 'esc-ouro', 'Preto e ouro', cor('#0B0B0B'), [E('ornamento', { estilo: 'cantos', x: 0.5, y: 0.5, w: 0.86, h: 0.9, cor: '#A58A57', espessura: 3 }), V(claro({ fonte: 'Cinzel', cor: '#E8D3A2' })), R(claro({ cor: '#A58A57' }))]);

  // ---------------------------------------------------------------- Editorial
  M('editorial', 'edi-revista', 'Revista', foto('fiorde', 0), [E('retangulo', { x: 0.5, y: 0.78, w: 1, h: 0.44, cor: '#F4F0E5' }),
    T('PALAVRA DO DIA', { fonte: 'Manrope', negrito: true, tamanho: 22, espacamento: 0.25, cor: '#A58A57', alinhar: 'left', largura: 0.8, x: 0.5, y: 0.6, sombra: 0 }),
    V(claro({ fonte: 'Libre Baskerville', cor: '#192D50', alinhar: 'left', largura: 0.8, y: 0.78, altura: 0.26, aspas: false })), R(claro({ alinhar: 'left', cor: '#A58A57' }))]);
  M('editorial', 'edi-coluna', 'Coluna', cor('#FFFFFF'), [E('retangulo', { x: 0.15, y: 0.5, w: 0.3, h: 1, cor: '#192D50' }), E('icone', { icone: 'cruz', x: 0.15, y: 0.5, w: 0.08, h: 0.08, cor: '#A58A57' }),
    V(claro({ fonte: 'Playfair Display', cor: '#192D50', alinhar: 'left', x: 0.65, largura: 0.6 })), R(claro({ alinhar: 'left', cor: '#A58A57' }))]);
  M('editorial', 'edi-capa', 'Capa', foto('margaridas', 0.6, 'base'), [E('linha', { x: 0.5, y: 0.11, w: 0.84, h: 0.004, cor: '#FFFFFF', opacidade: 0.6, espessura: 2 }),
    T('ATOS 2 · DEVOCIONAL', { fonte: 'Manrope', negrito: true, tamanho: 24, espacamento: 0.3, cor: '#FFFFFF', y: 0.07, largura: 0.84, sombra: 0.3 }),
    V({ fonte: 'Playfair Display', negrito: true, alinhar: 'left', y: 0.7, altura: 0.38 }), R({ alinhar: 'left' })]);
  M('editorial', 'edi-jornal', 'Jornal', cor('#F7F3EA'), [E('linha', { x: 0.5, y: 0.11, w: 0.84, h: 0.004, cor: '#192D50', espessura: 2 }), E('linha', { x: 0.5, y: 0.9, w: 0.84, h: 0.004, cor: '#192D50', espessura: 2 }),
    T('REFLEXÃO', { fonte: 'Manrope', negrito: true, tamanho: 22, espacamento: 0.3, cor: '#192D50', y: 0.07, largura: 0.84, alinhar: 'left', sombra: 0 }),
    V(claro({ fonte: 'Literata', cor: '#1E1E1E', alinhar: 'left', largura: 0.84 })), R(claro({ alinhar: 'left', cor: '#A58A57' }))]);
  M('editorial', 'edi-faixa', 'Faixa', foto('pier', 0), [E('retangulo', { x: 0.5, y: 0.725, w: 1, h: 0.55, cor: '#192D50', opacidade: 0.94 }),
    V(claro({ cor: '#F4F0E5', y: 0.7, altura: 0.36 })), R(claro({ cor: '#A58A57' }))]);

  var POR_ID = {};
  MODELOS.forEach(function (m) { POR_ID[m.id] = m; });
  function daCategoria(cat) { return MODELOS.filter(function (m) { return m.categoria === cat; }); }

  var API = { CATEGORIAS: CATEGORIAS, MODELOS: MODELOS, POR_ID: POR_ID, daCategoria: daCategoria };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.A2Modelos = API;
})(typeof window !== 'undefined' ? window : this);
