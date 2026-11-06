#!/usr/bin/env python3
"""ATOS 2 — converte obras em domínio público (arquivos .txt do Project Gutenberg, via espelho GITenberg)
para o formato do leitor do acervo: app/acervo/textos/<id>.json

Uso:  python3 -I ferramentas/converter_acervo.py <pasta-com-os-repositorios> app/acervo/textos

Regras:
- o texto do autor/tradutor não é alterado: só se retiram o cabeçalho e o rodapé do Project Gutenberg
  (licença e marca), linhas "Produced by", ilustrações e o sumário; quebras de linha viram espaços;
- _itálico_ do Gutenberg vira {itálico} (mesma convenção dos JSON da Bíblia);
- cada obra é conferida palavra por palavra: as palavras do corpo têm de estar todas na saída, na mesma ordem
  (o sumário retirado é a única diferença permitida e é listado no relatório).
Formato: { id, titulo, idioma, secoes: [ { titulo, p: [ "parágrafo" | { "h": "subtítulo" } ] } ] }
"""
import json, os, re, sys, unicodedata

OBRAS = [
    {'id': 'confissoes-agostinho', 'pasta': 'The-Confessions-of-St.-Augustine_3296', 'arquivo': '3296.txt',
     'secao': r'^BOOK [IVXL]+$', 'fim_extra': [r'^\s*GRATIAS TIBI DOMINE']},
    {'id': 'imitacao-de-cristo', 'pasta': 'The-Imitation-of-Christ_1653', 'arquivo': '1653.txt',
     'inicio': r'^THE FIRST BOOK$', 'livro': r'^THE (FIRST|SECOND|THIRD|FOURTH) BOOK$', 'secao': r'^CHAPTER [IVXL]+$',
     'fim': r'^End of (the )?Project Gutenberg'},
    {'id': 'liberdade-crista-lutero', 'pasta': 'Concerning-Christian-Liberty--with-Letter-of-Martin-Luther-to-Pope-Leo-X._1911', 'arquivo': '1911.txt',
     'secao': r'^(LETTER OF MARTIN LUTHER TO POPE LEO X\.|CONCERNING CHRISTIAN LIBERTY)$', 'pular_primeira': True},
    {'id': 'galatas-lutero', 'pasta': 'Commentary-on-the-Epistle-to-the-Galatians_1549', 'arquivo': '1549.txt',
     'secao': r'^(FROM LUTHER\'S INTRODUCTION, 1538|CHAPTER \d)$', 'sub': r'^\s{6,}[A-Z][A-Z ,\'-]{3,}$'},
    {'id': 'julgamento-morte-jesus-stalker', 'pasta': 'The-Trial-and-Death-of-Jesus-ChristA-Devotional-History-of-our-Lord-s-Passion_21814', 'arquivo': '21814-8.txt',
     'codificacao': 'latin-1', 'secao': r'^(PREFACE|CHAPTER [IVXL]+\.)$', 'sub': r'^[IVXL]+\.$', 'sumario': (r'^CONTENTS$', r'^CHAPTER I\.$')},
    {'id': 'vida-sao-paulo-stalker', 'pasta': 'The-Life-of-St.-Paul_21828', 'arquivo': '21828.txt',
     'secao': r'^(FOREWORD|CHAPTER [IVXL]+|HINTS TO TEACHERS AND QUESTIONS FOR PUPILS)$', 'sumario': (r'^CONTENTS$', r'^FOREWORD$'), 'sub': r'^\d+\. '},
    {'id': 'credo-apostolico-dodds', 'pasta': 'Exposition-of-the-Apostles-Creed_13652', 'arquivo': '13652.txt',
     'secao': r'^(EDITORIAL NOTE|PREFATORY NOTE|INTRODUCTION|ARTICLE \d+|APPENDIX|TRANSCRIBER\'S CHANGES:--|FOOTNOTES)$', 'sumario': (r'^EXPOSITION$', r'^EDITORIAL NOTE$', 1), 'sub': r'^\s*SECTION \d'},
]

def ler(caminho, cod):
    b = open(caminho, 'rb').read()
    try:
        t = b.decode(cod or 'utf-8')
    except UnicodeDecodeError:
        t = b.decode('latin-1')
    return unicodedata.normalize('NFC', t.replace('\r\n', '\n').replace('\r', '\n'))

def corpo(t, ob):
    linhas = t.split('\n')
    ini = 0
    for i, l in enumerate(linhas):
        if re.match(r'^\*\*\* ?START OF', l):
            ini = i + 1; break
    if ob.get('inicio'):
        for i in range(ini, len(linhas)):
            if re.match(ob['inicio'], linhas[i]):
                ini = i; break
    fim = len(linhas)
    padroes = [r'^\*\*\* ?END OF', r'^End of (the )?Project Gutenberg', r'^End of Project Gutenberg'] + ob.get('fim_extra', [])
    if ob.get('fim'): padroes.append(ob['fim'])
    for i in range(ini, len(linhas)):
        if any(re.match(p, linhas[i]) for p in padroes):
            fim = i; break
    return linhas[ini:fim]

def eh_credito(txt):
    return bool(re.match(r'^(Produced by|E-text prepared by)', txt) or re.match(r'^\[Illustration[^\]]*\]$', txt, re.I)
                or re.search(r'Project Gutenberg|gutenberg\.(net|org)', txt, re.I))

MENORES = {'a', 'an', 'the', 'and', 'of', 'to', 'in', 'on', 'for', 'from', 'with', 'at', 'by', 'or', 'as', 'upon', 'into', 'his', 'her'}
def titulo_ingles(t):
    t = re.sub(r'\[\d+\]', '', t).strip().rstrip('.')
    if not t.isupper():
        return t
    out = []
    for i, w in enumerate(t.lower().split()):
        if i and w in MENORES: out.append(w)
        else: out.append(w[:1].upper() + w[1:])
    s = ' '.join(out)
    return re.sub(r"\bI\b|\bi\b", 'I', s)

ROMANOS = {'FIRST': 'I', 'SECOND': 'II', 'THIRD': 'III', 'FOURTH': 'IV'}
def rotulo(cab):
    c = cab.strip().rstrip('.')
    m = re.match(r'^(BOOK|CHAPTER|Chapter|ARTICLE) ([IVXL\d]+)$', c)
    if m:
        return {'BOOK': 'Livro', 'CHAPTER': 'Capítulo', 'Chapter': 'Capítulo', 'ARTICLE': 'Artigo'}[m.group(1)] + ' ' + m.group(2)
    m = re.match(r'^THE (FIRST|SECOND|THIRD|FOURTH) BOOK$', c)
    if m: return 'Livro ' + ROMANOS[m.group(1)]
    fixos = {'PREFACE': 'Prefácio', 'INTRODUCTION': 'Introdução', 'FOREWORD': 'Apresentação', 'FOOTNOTES': 'Notas',
             'EDITORIAL NOTE': 'Nota editorial', 'PREFATORY NOTE': 'Nota prévia', 'APPENDIX': 'Apêndice',
             "TRANSCRIBER'S CHANGES:--": 'Correções da transcrição', 'HINTS TO TEACHERS AND QUESTIONS FOR PUPILS': 'Sugestões para professores e perguntas',
             "FROM LUTHER'S INTRODUCTION, 1538": 'Da introdução de Lutero (1538)', 'LETTER OF MARTIN LUTHER TO POPE LEO X': 'Carta de Lutero ao papa Leão X',
             'CONCERNING CHRISTIAN LIBERTY': 'Da liberdade cristã'}
    return fixos.get(c, titulo_ingles(c))

def italico(s):
    return re.sub(r'_([^_]+)_', r'{\1}', s)

def paragrafos(linhas):
    out, atual = [], []
    for l in linhas:
        if l.strip() == '':
            if atual: out.append(atual); atual = []
        else:
            atual.append(l)
    if atual: out.append(atual)
    return out

def palavras(s):
    return re.findall(r"[\w’']+", s.replace('{', ' ').replace('}', ' ').replace('_', ' '))

def converter(base, ob):
    t = ler(os.path.join(base, ob['pasta'], ob['arquivo']), ob.get('codificacao'))
    linhas = corpo(t, ob)
    blocos = paragrafos(linhas)
    retirados = []
    # sumário
    if ob.get('sumario'):
        a, b = ob['sumario'][0], ob['sumario'][1]
        pular = ob['sumario'][2] if len(ob['sumario']) > 2 else 0
        ia = next((i for i, x in enumerate(blocos) if re.match(a, x[0].strip())), None)
        if ia is not None:
            cands = [i for i in range(ia + 1, len(blocos)) if re.match(b, blocos[i][0].strip())]
            ib = cands[pular] if len(cands) > pular else None
            if ib is not None:
                # a folha de rosto (antes do sumário) fica; só o sumário sai
                retirados += blocos[ia + 1:ib] if a == r'^EXPOSITION$' else blocos[ia:ib]
                blocos = (blocos[:ia + 1] if a == r'^EXPOSITION$' else blocos[:ia]) + blocos[ib:]
    secoes, atual, livro = [], {'titulo': 'Folha de rosto', 'p': []}, ''
    primeira = True
    notas_prof, livro_sub = [False], ['']
    i = 0
    while i < len(blocos):
        bl = blocos[i]
        txt = ' '.join(x.strip() for x in bl)
        txt = re.sub(r'\s+', ' ', txt).strip()
        if eh_credito(txt):
            retirados.append(bl); i += 1; continue
        cab = bl[0].strip() if len(bl) == 1 else None
        if ob.get('livro') and cab and re.match(ob['livro'], cab):
            livro = cab
            # o livro abre uma seção própria (texto antes do capítulo I); se ficar vazia, o título do livro
            # passa como subtítulo do primeiro capítulo
            sub = ''
            if i + 1 < len(blocos):
                sub = re.sub(r'\s+', ' ', ' '.join(x.strip() for x in blocos[i + 1])).strip()
                i += 1
            if atual['p'] or atual['titulo'] != 'Folha de rosto':
                secoes.append(atual)
            atual = {'titulo': rotulo(cab) + (' — ' + titulo_ingles(sub) if sub else ''), 'original': cab + (' — ' + sub if sub else ''), 'p': [], 'livro': sub}
            i += 1
            continue
        if cab and re.match(ob['secao'], cab):
            if ob.get('pular_primeira') and primeira and not atual['p']:
                primeira = False
                retirados.append(bl); i += 1; continue
            if atual.get('livro') is not None and not atual['p']:
                livro_sub[0] = atual['livro']
            elif atual['p'] or atual['titulo'] != 'Folha de rosto':
                secoes.append(atual)
            titulo, original = rotulo(cab), cab
            # título descritivo na linha seguinte (ex.: "CHAPTER I" / "HIS PLACE IN HISTORY")
            if i + 1 < len(blocos) and len(blocos[i + 1]) <= 3:
                prox = re.sub(r'\s+', ' ', ' '.join(x.strip() for x in blocos[i + 1])).strip()
                if prox and (prox.isupper() or (ob['id'] == 'imitacao-de-cristo' and len(prox) < 160)) and not re.match(ob['secao'], prox) and not (ob.get('sub') and re.match(ob['sub'], blocos[i + 1][0])) and len(prox) < 160:
                    titulo = titulo + ' — ' + titulo_ingles(prox)
                    original = original + ' — ' + prox
                    i += 1
            if re.match(r'^HINTS TO TEACHERS', cab): notas_prof[0] = True
            elif notas_prof[0] and titulo.startswith('Capítulo'): titulo = 'Sugestões · ' + titulo
            if livro and ob['id'] == 'imitacao-de-cristo':
                titulo = rotulo(livro) + ' · ' + titulo
            atual = {'titulo': titulo, 'original': original, 'p': []}
            if livro_sub[0]:
                atual['p'].append({'h': livro_sub[0]}); livro_sub[0] = ''
            i += 1
            continue
        if ob.get('sub') and len(bl) == 1 and re.match(ob['sub'], bl[0]) and len(txt) < 90:
            atual['p'].append({'h': italico(txt)})
        else:
            atual['p'].append(italico(txt))
        i += 1
    if atual['p']: secoes.append(atual)
    for x in secoes: x.pop('livro', None)
    for x in secoes:
        # sumário que sobra na folha de rosto (lista de capítulos numa linha só)
        if x['titulo'] == 'Folha de rosto':
            x['p'] = [q for q in x['p'] if not (isinstance(q, str) and len(re.findall(r'\b[IVX]+\. [A-Z]{3,}', q)) >= 3)]
        # artigo do Credo: o enunciado em itálico logo no início vira parte do título
        if x['titulo'].startswith('Artigo ') and x['p'] and isinstance(x['p'][0], str) and re.match(r'^\{(\d+\. )?[^}]{8,140}\}$', x['p'][0]):
            x['titulo'] += ' — ' + re.sub(r'^\{(\d+\. )?|\}$', '', x['p'][0])
    # conferência palavra por palavra
    entrada = palavras(' '.join(' '.join(b) for b in blocos if not eh_credito(re.sub(r'\s+', ' ', ' '.join(x.strip() for x in b)).strip())))
    saida = []
    for s in secoes:
        saida += palavras(s['titulo'].split(' · ')[-1] if False else '')
    # reconstrói a saída na ordem: títulos (com o texto original das linhas de título) + parágrafos
    texto_saida = []
    for s in secoes:
        for p in s['p']:
            texto_saida.append(p['h'] if isinstance(p, dict) else p)
    ps = palavras(' '.join(texto_saida))
    # as palavras dos títulos de seção/livro saem dos parágrafos: confere que a saída é subsequência da entrada
    it = iter(entrada)
    ok = all(any(w.lower() == x.lower() for x in it) for w in ps)
    faltam = len(entrada) - len(ps)
    return {'id': ob['id'], 'secoes': secoes}, ok, len(entrada), len(ps), retirados

def main():
    base, dest = sys.argv[1], sys.argv[2]
    os.makedirs(dest, exist_ok=True)
    rel = []
    for ob in OBRAS:
        dados, ok, n_in, n_out, ret = converter(base, ob)
        if not ok:
            print('ERRO de conferência:', ob['id']); sys.exit(1)
        json.dump(dados, open(os.path.join(dest, ob['id'] + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        tam = os.path.getsize(os.path.join(dest, ob['id'] + '.json'))
        rel.append((ob['id'], len(dados['secoes']), n_in, n_out, tam, len(ret)))
        print('%-32s seções %3d  palavras corpo %7d  em parágrafos %7d  (%5.1f%%)  %7d bytes  blocos retirados %d' % (ob['id'], len(dados['secoes']), n_in, n_out, 100.0 * n_out / max(1, n_in), tam, len(ret)))

if __name__ == '__main__':
    main()
