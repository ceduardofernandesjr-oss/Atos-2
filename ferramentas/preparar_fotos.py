#!/usr/bin/env python3
"""ATOS 2 — prepara as fotos de fundo (Pixabay, enviadas pelo usuário) nos tamanhos do app.
Para cada foto: <id>-cel.jpg 1080×1920, <id>-pc.jpg 1920×1080 (quando o recorte serve) e <id>-mini.jpg.
Recortes escolhidos foto a foto (ponto de interesse) e, quando preciso, para deixar letreiros e textos de fora.
Uso: python3 -I preparar_fotos.py <pasta_origem> <pasta_saida> <catalogo.json>"""
import sys, os, json
from PIL import Image, ImageOps

ORIG, SAIDA, CATALOGO = sys.argv[1:4]
# id, arquivo, nome, recorte do celular (x focal ou caixa), recorte do computador (y focal, caixa ou None), cor do texto, escurecer
FOTOS = [
    ('rochas-mar', '01', 'Rochas e mar', .5, .55, '#FFFFFF', .25),
    ('praia', '02', 'Praia de águas claras', .5, .4, '#FFFFFF', .3),
    ('aurora-boreal', '03', 'Aurora boreal', .45, .5, '#FFFFFF', .1),
    ('vulcao', '04', 'Vulcão sob as estrelas', .5, .55, '#FFFFFF', .15),
    ('pier', '05', 'Píer ao pôr do sol', .5, .6, '#FFFFFF', .25),
    ('jardim', '06', 'Jardim refletido', .55, .5, '#FFFFFF', .3),
    ('fiorde', '07', 'Fiorde', .55, .5, '#FFFFFF', .3),
    ('capim', '08', 'Capim ao vento', .45, .6, '#FFFFFF', .25),
    ('lago-amanhecer', '09', 'Lago ao amanhecer', .4, .5, '#FFFFFF', .25),
    ('urzes', '10', 'Flores na encosta', .45, .6, '#FFFFFF', .3),
    ('lago-outono', '11', 'Lago no outono', .45, .5, '#FFFFFF', .25),
    ('floresta-nevoa', '12', 'Floresta na névoa', .65, .5, '#FFFFFF', .3),
    ('caminho-outono', '13', 'Caminho de outono', .5, .55, '#FFFFFF', .3),
    ('cisnes', '14', 'Cisnes no lago', .5, .62, '#FFFFFF', .2),
    ('caminho-estreito', '15', 'Caminho estreito', .5, .5, '#FFFFFF', .3),
    ('iceberg', '16', 'Iceberg', .55, .55, '#FFFFFF', .3),
    ('leao', '17', 'Leão de Judá', .5, .42, '#FFFFFF', .2),
    ('cidade', '18', 'Cidade ao entardecer', .43, (0, 0, 2080, 1170), '#FFFFFF', .3),   # sem o letreiro de banco à direita
    ('papoulas', '19', 'Papoulas ao sol', .5, .45, '#FFFFFF', .25),
    ('mapa-mundi', '20', 'O mundo inteiro', .5, .5, '#FFFFFF', .3),
    ('folha', '21', 'Folhas sobre o branco', .45, .5, '#14284B', 0),
    ('telhado', '22', 'Linhas e luz', .5, .5, '#FFFFFF', .4),
    ('vela', '23', 'Vela acesa', (0, 280, 1015, 2084), None, '#14284B', 0),             # sem as capas de livros
    ('flores-vermelhas', '24', 'Flores vermelhas', .5, .45, '#FFFFFF', .3),
    ('margaridas', '25', 'Margaridas', .5, .55, '#FFFFFF', .2),
]

# onde o texto fica mais legível (altura do centro do bloco) e cor/escurecer revistos depois de ver as artes
AJUSTES = {'vela': {'y': 0.17}, 'papoulas': {'y': 0.74, 'escurecer': 0.3}, 'folha': {'y': 0.16},
           'margaridas': {'y': 0.27, 'escurecer': 0.3}, 'mapa-mundi': {'escurecer': 0.45}, 'praia': {'y': 0.3}}

def recorte(im, prop, foco, vertical):
    W, H = im.size
    if isinstance(foco, tuple): return im.crop(foco)
    if W / H > prop:                         # sobra largura
        w = round(H * prop); x = min(max(0, round(foco * W - w / 2)), W - w); return im.crop((x, 0, x + w, H))
    h = round(W / prop); y = min(max(0, round(foco * H - h / 2)), H - h); return im.crop((0, y, W, y + h))

catalogo = []
for fid, arq, nome, fcel, fpc, cor, esc in FOTOS:
    im = ImageOps.exif_transpose(Image.open(os.path.join(ORIG, arq + '.jpg'))).convert('RGB')
    cel = recorte(im, 1080 / 1920, fcel, True).resize((1080, 1920), Image.LANCZOS)
    cel.save(os.path.join(SAIDA, fid + '-cel.jpg'), quality=82, optimize=True, progressive=True)
    cel.resize((360, 640), Image.LANCZOS).save(os.path.join(SAIDA, fid + '-mini.jpg'), quality=78, optimize=True, progressive=True)
    tem_pc = fpc is not None
    if tem_pc:
        pc = recorte(im, 1920 / 1080, fpc, False).resize((1920, 1080), Image.LANCZOS)
        pc.save(os.path.join(SAIDA, fid + '-pc.jpg'), quality=82, optimize=True, progressive=True)
    d = {'id': fid, 'nome': nome, 'pc': tem_pc, 'cor': cor, 'escurecer': esc}
    if fid in AJUSTES: d.update(AJUSTES[fid])
    catalogo.append(d)
json.dump(catalogo, open(CATALOGO, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
tot = sum(os.path.getsize(os.path.join(SAIDA, f)) for f in os.listdir(SAIDA))
print(len(catalogo), 'fotos,', round(tot / 1048576, 1), 'MB')
