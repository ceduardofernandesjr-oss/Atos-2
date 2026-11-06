#!/usr/bin/env python3
"""
ATOS 2 — Almeida 1911 com ortografia atualizada.

Lê a edição convertida de 1911 (biblia/alm1911) e grava uma nova edição (biblia/alm1911at)
em que SÓ a grafia muda: as palavras, a ordem, a pontuação e a versificação ficam como em 1911.

Como cada palavra é decidida (nesta ordem):
  1. Já existe na grafia atual (vocabulário da Bíblia Livre e da Nova Bíblia Viva) → fica.
  2. Tabela manual (casos que as regras não alcançam: Jehovah → Jeová, eis-que → eis que…).
  3. Regras ortográficas (ph→f, th→t, y→i, consoantes dobradas, ct/pt mudos, ch grego, m antes de
     consoante, -ae/-aes → -ai/-ais, -eo → -eu, z/s, h mudo, acentos) geram candidatos; vale o
     candidato que existe no vocabulário atual (acentos restaurados pelo vocabulário).
  4. Alinhamento: no mesmo versículo da Bíblia Livre (também Almeida), a palavra mais parecida
     — usado para nomes próprios (David → Davi) e variantes (logar → lugar, egreja → igreja).
  5. Dicionário pt-BR (LibreOffice/VERO) para confirmar candidatos fora do vocabulário bíblico.
  6. Sem decisão segura → fica como está e entra no relatório.

Também atualiza ênclise/mesóclise antigas (vel-o-hei → vê-lo-ei, matal-o-ha → matá-lo-á),
contrações com apóstrofo (d’elle → dele) e converte as referências cruzadas para as
abreviações do app (Psa. 132.11 → Sl 132:11). As posições das notas são recalculadas.

Uso: python3 -I atualizar_grafia_1911.py <app/biblia> <pt-br.dic> <relatorio.tsv>
"""
import json, os, re, sys, unicodedata, collections, itertools

BASE, DIC, RELATORIO = sys.argv[1], sys.argv[2], sys.argv[3]
ORIG, NOVA = 'alm1911', 'alm1911at'

def sem_acento(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').replace('ç', 'c')
def carregar(v):
    ix = json.load(open(os.path.join(BASE, v, 'indice.json'), encoding='utf-8'))
    return ix, {l['id']: json.load(open(os.path.join(BASE, v, l['id'] + '.json'), encoding='utf-8')) for l in ix['livros']}

ix1911, L1911 = carregar(ORIG)
_, LBL = carregar('blivre')
_, LNBV = carregar('onbv')

PAL = r"[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[’'][A-Za-zÀ-ÖØ-öø-ÿ]+)*(?:-[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[’'][A-Za-zÀ-ÖØ-öø-ÿ]+)*)*"
RE_PAL = re.compile(PAL)

# ------------------------------------------------------------------ vocabulário atual
freq = collections.Counter()
for livros in (LBL, LNBV):
    for lv in livros.values():
        for cap in lv['caps']:
            for t in cap:
                for w in RE_PAL.findall(t or ''):
                    freq[w.lower()] += 1
                    for p in w.lower().split('-'): freq[p] += 0  # partes de compostos também existem
chave = collections.defaultdict(list)       # sem acento (e sem hífen) → formas atuais
for w, n in freq.items():
    chave[sem_acento(w)].append(w)
    if '-' in w: chave[sem_acento(w).replace('-', '')].append(w)
for k in chave: chave[k] = sorted(set(chave[k]), key=lambda x: -freq[x])
dic = set()
for linha in open(DIC, encoding='utf-8'):
    w = linha.split('/')[0].strip()
    if w and not w[0].isdigit(): dic.add(w.lower())
dic_chave = collections.defaultdict(set)
for w in dic: dic_chave[sem_acento(w)].add(w)

# Sinais de grafia antiga; palavra sem nenhum deles só pode ganhar acento, nunca trocar letras.
MARCA = re.compile(r"ph|th|rh|y|([bcdfglmnpt])\1|ct|pt|gn|mn|^sc|ch[rl]|ae$|aes$|eo$|eos$|z$|[aeiou]h|^h|xh|ç[ãa]o|m[cdfgjlnqrstvxz]|[áéíóúâêô]|^[ei]g|ue$|iu$|oe$|ou|oi|cç|pç|s[aeiou]|z[aeiou]")
def tem_marca(w): return bool(MARCA.search(w))

def acento_nao_final(f):
    """O acento restaurado não cai na última sílaba (evita tornes → tornês, paria → pariá)."""
    vog = [i for i, ch in enumerate(f) if ch in 'aeiouáéíóúâêôãõ']
    ac = [i for i, ch in enumerate(f) if ch in 'áéíóúâêô']
    if not ac: return True
    # última sílaba = a partir da penúltima vogal não adjacente
    grupos, ant = [], -2
    for i in vog:
        if i != ant + 1: grupos.append(i)
        ant = i
    return ac[0] < (grupos[-1] if grupos else 0)

def dominante(w):
    """Se w existe, mas outra grafia da mesma palavra (só acento diferente) é muito mais comum hoje
    (espirito → espírito, principio → princípio), devolve essa; senão None."""
    if w != sem_acento(w) or len(w) < 5 or re.search(r'(ara|era|ira|aram|eram|iram)$', w): return None
    fs = chave.get(sem_acento(w), [])
    if fs and fs[0] != w and freq[fs[0]] >= 20 * max(1, freq.get(w, 0)) and acento_nao_final(fs[0]): return fs[0]
    return None
def flexao_valida(w):
    for corte, add in ((1, 'o'), (2, 'o'), (1, ''), (2, ''), (2, 'ão'), (3, 'ão')):
        if len(w) - corte >= 3 and w[:len(w) - corte] + add in dic and w[len(w) - corte:] in ('a', 'as', 's', 'es', 'os', 'ões', 'ães'): return True
    return False
FORTE = re.compile(r"ph|th|rh|y|([bcdfglmnpt])\1|[aeiou]ct|[aeiou]pt|mn|ch[rl]|ae$|aes$|eo$|eos$|xh|cç|pç")
def forte(w): return bool(FORTE.search(w))
def atual(w):  # w já existe na grafia atual?
    if forte(w): return freq.get(w, 0) >= 3
    return w in freq or w in dic or (not tem_marca(w) and flexao_valida(w))

# ------------------------------------------------------------------ tabela manual
MANUAL = {
    'jehovah': 'jeová', 'he': 'é', 'ha': 'há', 'hade': 'há de', 'hão-de': 'hão de', 'ha-de': 'há de', 'hei-de': 'hei de', 'has-de': 'hás de',
    'eis-que': 'eis que', 'eis-aqui': 'eis aqui', 'eis-ahi': 'eis aí', 'cantor-mór': 'cantor-mor', 'mór': 'mor',
    'comnosco': 'conosco', 'tambem': 'também', 'ninguem': 'ninguém', 'alguem': 'alguém', 'porem': 'porém',
    'emfim': 'enfim', 'emfim,': 'enfim', 'comtudo': 'contudo', 'emquanto': 'enquanto', 'bemdito': 'bendito', 'bemdita': 'bendita',
    'bemditos': 'benditos', 'bemditas': 'benditas', 'bemaventurado': 'bem-aventurado', 'bemaventurados': 'bem-aventurados',
    'bemaventurada': 'bem-aventurada', 'bemaventuradas': 'bem-aventuradas', 'bemaventurança': 'bem-aventurança',
    'quasi': 'quase', 'logar': 'lugar', 'logares': 'lugares', 'oiro': 'ouro', 'cousa': 'coisa', 'cousas': 'coisas',
    'dous': 'dois', 'egreja': 'igreja', 'egrejas': 'igrejas', 'edade': 'idade', 'edades': 'idades',
    'similhante': 'semelhante', 'similhantes': 'semelhantes', 'similhança': 'semelhança', 'similhantemente': 'semelhantemente',
    'cincoenta': 'cinquenta', 'creado': 'criado', 'creados': 'criados', 'creada': 'criada', 'creadas': 'criadas',
    'crear': 'criar', 'creou': 'criou', 'creação': 'criação', 'creatura': 'criatura', 'creaturas': 'criaturas', 'creador': 'criador',
    'poz': 'pôs', 'puz': 'pus', 'quiz': 'quis', 'mez': 'mês', 'atraz': 'atrás', 'detraz': 'detrás', 'traz': 'traz',
    'pozeram': 'puseram', 'pozera': 'pusera', 'pozesse': 'pusesse', 'quizer': 'quiser', 'quizeres': 'quiseres', 'quizerem': 'quiserem',
    'quizera': 'quisera', 'quizeram': 'quiseram', 'quizesse': 'quisesse', 'quizessem': 'quisessem', 'poderam': 'puderam',
    'satanaz': 'satanás', 'tribu': 'tribo', 'tribus': 'tribos', 'veiu': 'veio', 'frecha': 'flecha', 'frechas': 'flechas',
    'dextra': 'destra', 'descanço': 'descanso', 'pateo': 'pátio', 'pateos': 'pátios', 'hontem': 'ontem', 'herva': 'erva', 'hervas': 'ervas',
    'ahi': 'aí', 'd’ahi': 'daí', "d'ahi": 'daí', 'sahir': 'sair', 'cahir': 'cair', 'preza': 'presa', 'prezas': 'presas',
    'azas': 'asas', 'aza': 'asa', 'carmezim': 'carmesim', 'taboa': 'tábua', 'taboas': 'tábuas', 'sêde': 'sede', 'vêr': 'ver',
    'crêr': 'crer', 'lêr': 'ler', 'vêem': 'veem', 'crêem': 'creem', 'lêem': 'leem', 'dêem': 'deem', 'vôo': 'voo',
    'judeo': 'judeu', 'judeos': 'judeus', 'hebreos': 'hebreus', 'phariseo': 'fariseu', 'phariseos': 'fariseus', 'sadduceo': 'saduceu', 'sadduceos': 'saduceus',
    'philisteo': 'filisteu', 'philisteos': 'filisteus', 'chaldeo': 'caldeu', 'chaldeos': 'caldeus', 'europeos': 'europeus',
    'hin': 'him', 'syro': 'sírio', 'syros': 'sírios', 'syria': 'síria', 'syrio': 'sírio', 'syrios': 'sírios', 'creança': 'criança', 'creanças': 'crianças',
    'creancinha': 'criancinha', 'peior': 'pior', 'peiores': 'piores', 'magestade': 'majestade', 'devéras': 'deveras', 'balac': 'balaque',
    'hadad': 'hadade', 'decimas': 'décimas', 'amalekitas': 'amalequitas', 'amalekita': 'amalequita', 'lembrae': 'lembrai', 'alegrae': 'alegrai',
    'recto': 'reto', 'rectos': 'retos', 'recta': 'reta', 'rectas': 'retas', 'matheus': 'mateus', 'bello': 'belo', 'bella': 'bela',
    'aquel’outro': 'aquele outro', 'aquel’outros': 'aqueles outros', 'aquell’outro': 'aquele outro', 'aquell’outra': 'aquela outra', 'aquell’outros': 'aqueles outros', 'aquell’outras': 'aquelas outras', 'trazeim’os': 'trazei-mos',
    'forca': 'forca', 'forcas': 'forcas', 'cosida': 'cosida', 'cosido': 'cosido', 'tres': 'três', 'agua': 'água', 'benção': 'bênção', 'bençãos': 'bênçãos', 'paes': 'pais', 'pae': 'pai', 'mana': 'maná',
    'á': 'à', 'ás': 'às', 'áquelle': 'àquele', 'áquelles': 'àqueles', 'áquella': 'àquela', 'áquellas': 'àquelas', 'áquillo': 'àquilo',
    'chamma': 'chama', 'chammas': 'chamas', 'bath': 'bato', 'baths': 'batos', 'kohathitas': 'coatitas', 'kohathita': 'coatita',
}

# ------------------------------------------------------------------ regras
OBRIG = [  # quase sempre certas
    (r'ph', 'f'), (r'th', 't'), (r'rh', 'r'), (r'y', 'i'), (r'ch(?=[rl])', 'c'),
    (r'([bdfglmnpt])\1', r'\1'), (r'cc(?=[aouáóúâôãõçr])', 'c'), (r'cc(?=[eiéíê])', 'c'), (r'cç', 'ç'), (r'mpç', 'nç'), (r'pç', 'ç'),
    (r'm(?=[cdfgjlnqrstvxz])', 'n'), (r'nn', 'n'), (r'cc(?=l)', 'c'), (r'xh', 'x'),
    (r'sanct', 'sant'), (r'fruct', 'frut'), (r'inct', 'int'), (r'(?<=[aeiou])dict', 'dit'), (r'ject', 'jet'), (r'flect', 'flet'),
    (r'(?<=[^s])rect', 'ret'), (r'^rect', 'ret'), (r'exact', 'exat'), (r'captiv', 'cativ'), (r'bapt', 'bat'), (r'script', 'scrit'), (r'mpt', 'nt'),
    (r'assign', 'assin'), (r'descanç', 'descans'),
    (r'aveis$', 'áveis'), (r'iveis$', 'íveis'), (r'oveis$', 'óveis'), (r'avel$', 'ável'), (r'ivel$', 'ível'), (r'ovel$', 'óvel'),
]
OPC = [  # testadas: vale o candidato que existir na grafia atual
    (r'ch(?=[aou])', 'c'), (r'ch(?=[ei])', 'qu'), (r'(?<=[aeiouáéíóú])ct', 't'), (r'(?<=[aeiouáéíóún])ct', 't'), (r'pt', 't'),
    (r'mpt', 'nt'), (r'nct', 'nt'), (r'^ps', 's'), (r'g(?=[eé])', 'j'), (r'(?<=[aeiou])c(?=t[aeiou])', ''), (r'gn', 'n'), (r'mn', 'n'), (r'^sc(?=[ei])', 'c'), (r'(?<=[aeiou])sc(?=[ei])', 'sc'),
    (r'ae(s?)$', r'ai\1'), (r'oe(s?)$', r'oi\1'), (r'ue(s?)$', r'ui\1'), (r'eo(s?)$', r'eu\1'), (r'eo(s?)$', r'io\1'),
    (r'iu$', 'io'), (r'z$', 's'), (r'(?<=[aeiouãõáéíóúâêô])z(?=[aeiouáéíóú])', 's'), (r'(?<=[aeiou])s(?=[aeiou])', 'ss'),
    (r'^h', ''), (r'(?<=[aeiouáéíóú])h(?=[aeiouáéíóú])', ''), (r'nç', 'ns'), (r'x', 'ch'), (r'ã$', 'am'), (r'ão$', 'am'),
    (r'(?<=[^aeiou])r(?=r)', ''), (r'^e(?=[gn])', 'i'), (r'i(?=lh)', 'e'), (r'ou', 'oi'), (r'oi', 'ou'),
    (r'[áéíóúâêô]', lambda m: sem_acento(m.group(0))),
]

def candidatos(w):
    """Retorna (base, {candidato: custo}); custo = quantas regras opcionais foram aplicadas."""
    base = w
    for a, b in OBRIG: base = re.sub(a, b, base)
    custo = {base: 0}
    nivel = {base}
    for k in range(1, 4):
        prox = set()
        for c in nivel:
            for a, b in OPC:
                d = re.sub(a, b, c)
                if d != c and d not in custo: custo[d] = k; prox.add(d)
        nivel = prox
        if len(custo) > 1500 or not nivel: break
    return base, custo

def no_dic(c, custo):
    """Forma do dicionário pt-BR para c. Com regra aplicada (custo ≥ 1) só vale a forma exata;
    sem regra, também vale restaurar um acento que não caia na última sílaba (apostolos → apóstolos)."""
    if c in dic: return c
    if custo >= 1:
        if c.endswith('s') and len(c) > 5 and c[:-1] in dic: return c
        return None
    ds = dic_chave.get(sem_acento(c))
    if ds and len(ds) == 1:
        f = next(iter(ds))
        if acento_nao_final(f): return f
    if c.endswith('s') and len(c) > 5:
        r = c[:-1]
        if r in dic: return c
        ds = dic_chave.get(sem_acento(r))
        if ds and len(ds) == 1:
            f = next(iter(ds))
            if acento_nao_final(f): return f + 's'
    return None

def escolher(custo):
    """Menor custo primeiro; no mesmo custo, forma exata > forma do vocabulário bíblico > dicionário."""
    por = collections.defaultdict(list)
    for c, k in custo.items(): por[k].append(c)
    for k in sorted(por):                       # 1.º vocabulário bíblico atual
        cs = por[k]
        exatos = [c for c in cs if freq.get(c, 0) >= (3 if forte(c) else 1)]
        if exatos: return max(exatos, key=lambda c: freq[c]), 'regra'
        formas = collections.Counter()
        for c in cs:
            for f in chave.get(sem_acento(c), []):
                if freq[f] >= (3 if forte(f) else 1): formas[f] += freq[f] + 1
        if formas: return formas.most_common(1)[0][0], 'regra'
    for c, k in sorted(custo.items(), key=lambda x: (forte(x[0]), x[1], len(x[0]))):   # 2.º dicionário
        d = no_dic(c, k)
        if d and not forte(d): return d, 'dicionário'
    return None, None

CONFIANTES = [(r'ae(s?)$', r'ai\1'), (r'eo(s?)$', r'eu\1'), (r'^ps', 's')]

# ------------------------------------------------------------------ alinhamento com a Bíblia Livre
def lev(a, b):
    if len(a) < len(b): a, b = b, a
    ant = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1): cur.append(min(ant[j] + 1, cur[j - 1] + 1, ant[j - 1] + (ca != cb)))
        ant = cur
    return ant[-1]
def esqueleto(x):
    x = sem_acento(x.lower()).replace('-', '')
    for a, b in ((r'ph', 'f'), (r'th', 't'), (r'h', ''), (r'y', 'i'), (r'qu', 'k'), (r'ch', 'k'), (r'c(?=[aou]|$)', 'k'), (r'c(?![ei])', 'k'),
                 (r'(.)\1', r'\1'), (r'(?<=[^aeiou])e$', ''), (r'm$', 'n'), (r'ao$', 'an'), (r'z', 's'), (r'w', 'v')):
        x = re.sub(a, b, x)
    return x
def parecido(a, b):
    a, b = esqueleto(a), esqueleto(b)
    if not a or not b: return 0
    return 1 - lev(a, b) / max(len(a), len(b))

ocorr = collections.defaultdict(list)   # palavra 1911 (minúscula) → [(livro, c, v)]
for b, lv in L1911.items():
    for ci, cap in enumerate(lv['caps']):
        for vi, t in enumerate(cap):
            for w in RE_PAL.findall(t):
                for p in re.split(r'-', w): ocorr[p.lower()].append((b, ci, vi))

FINAIS_ANTIGOS = ('ae', 'aes', 'eo', 'eos', 'iu', 'z', 'oe', 'ue')
def fon(x):
    """Pronúncia aproximada: duas grafias da MESMA palavra dão o mesmo resultado (visinho/vizinho, cançado/cansado)."""
    x = sem_acento(x.lower().replace('ç', 's')).replace('-', '')
    for a, b in ((r'ph', 'f'), (r'th', 't'), (r'ch', 'k'), (r'h', ''), (r'y', 'i'), (r'qu(?=[ei])', 'k'), (r'gu(?=[ei])', 'g'),
                 (r'g(?=[ei])', 'j'), (r'c(?=[ei])', 's'), (r'c', 'k'), (r'z', 's'), (r'(.)\1', r'\1'), (r'gm', 'm'), (r'[cp]t', 't'),
                 (r'i', 'e'), (r'u', 'o'), (r'(.)\1', r'\1')):
        x = re.sub(a, b, x)
    return x
def alinhar(w, base, nome, custo=None, hifen=False, forte=False):
    votos, n = collections.Counter(), 0
    chaves_cand = {sem_acento(c): c for c in (custo or {})}
    for (b, ci, vi) in ocorr[w][:80]:
        try: t = LBL[b]['caps'][ci][vi]
        except (IndexError, KeyError): continue
        n += 1
        melhor, nota = None, 0
        for bw in set(RE_PAL.findall(t)):
            if nome != bw[0].isupper(): continue
            if ('-' in bw) != hifen: continue
            bl = bw.lower()
            if sem_acento(bl) in chaves_cand: melhor, nota = bl, 2; break
            sc = max(parecido(base, bl), parecido(w, bl))
            if sc > nota: melhor, nota = bl, sc
        if melhor and nota >= (0.67 if nome else 0.75):
            if not nome and nota < 2 and fon(melhor) not in (fon(w), fon(base)): continue
            votos[melhor] += 1
    if not votos: return None
    f, k = votos.most_common(1)[0]
    if k >= max(1, (0.6 if forte else 0.5) * n): return f
    return None

# ------------------------------------------------------------------ decisão por palavra
decisao, motivo = {}, {}
def modernizar(w):
    if w in decisao: return decisao[w]
    r, m = None, None
    if w.endswith('teem') and len(w) >= 4:              # teem → têm, reteem → retêm, conteem → contêm
        decisao[w], motivo[w] = w[:-4] + 'têm', 'manual'; return decisao[w]
    nome = any(x[0].isupper() for x in ORIG_CASE.get(w, [w])) and not any(x[0].islower() for x in ORIG_CASE.get(w, [w]))
    if w in MANUAL: r, m = MANUAL[w], 'manual'
    elif nome and len(ocorr[w]) >= 2 and (lambda al: al and al != w and (decisao.__setitem__(w, al) or True))(alinhar(w, candidatos(w)[0], True, candidatos(w)[1], forte=True)):
        motivo[w] = 'alinhamento (nome)'; return decisao[w]
    elif atual(w):
        d = dominante(w)
        r, m = (d, 'acento') if d else (w, 'igual')
    else:
        base, custo = candidatos(w)
        if nome:
            al = alinhar(w, base, True, custo)
            if al: r, m = al, 'alinhamento'
        if not r:
            r, m = escolher(custo if tem_marca(w) else {base: 0})
        if not r:
            al = alinhar(w, base, nome, custo)
            if al: r, m = al, 'alinhamento'
        if not r:
            f = base
            for a2, b2 in CONFIANTES: f = re.sub(a2, b2, f)
            r, m = (f, 'regra fixa') if f != w else (w, 'sem decisão')
    decisao[w], motivo[w] = r, m
    return r

ORIG_CASE = collections.defaultdict(set)
for b, lv in L1911.items():
    for cap in lv['caps']:
        for t in cap:
            for w in RE_PAL.findall(t):
                for p in w.split('-'): ORIG_CASE[p.lower()].add(p)

def caixa(orig, novo):
    if orig.isupper() and len(orig) > 1: return novo.upper()
    if orig[0].isupper(): return novo[0].upper() + novo[1:]
    return novo

CLITICOS = {'me', 'te', 'se', 'lhe', 'lhes', 'nos', 'vos', 'o', 'a', 'os', 'as', 'lo', 'la', 'los', 'las', 'no', 'na', 'nas', 'mo', 'ma', 'mos', 'mas', 'to', 'ta', 'tos', 'tas', 'lho', 'lha', 'lhos', 'lhas', 'vol', 'nol'}
FUTURO = {'hei': 'ei', 'has': 'ás', 'ha': 'á', 'hemos': 'emos', 'heis': 'eis', 'hão': 'ão',
          'hia': 'ia', 'hias': 'ias', 'hiamos': 'íamos', 'hieis': 'íeis', 'hiam': 'iam'}
ACENTO_FINAL = {'a': 'á', 'e': 'ê', 'o': 'ô', 'i': 'i'}

comp_ocorr = collections.defaultdict(list)
for b_, lv_ in L1911.items():
    for ci_, cap_ in enumerate(lv_['caps']):
        for vi_, t_ in enumerate(cap_):
            for w_ in RE_PAL.findall(t_):
                if '-' in w_: comp_ocorr[w_.lower()].append((b_, ci_, vi_))
def alinhar_composto(tok):
    votos, n = collections.Counter(), 0
    for (b, ci, vi) in comp_ocorr[tok.lower()][:60]:
        try: t = LBL[b]['caps'][ci][vi]
        except (IndexError, KeyError): continue
        n += 1
        melhor, nota = None, 0
        for bw in set(RE_PAL.findall(t)):
            if not bw[0].isupper() or bw.count('-') not in (0, tok.count('-')): continue
            sc = parecido(tok, bw)
            if sc > nota: melhor, nota = bw, sc
        if melhor and nota >= 0.6: votos[melhor.lower()] += 1
    if not votos: return None
    f, k = votos.most_common(1)[0]
    return f if k >= max(1, 0.5 * n) else None

def palavra(tok):
    """Moderniza um token (pode ter hífen e apóstrofo)."""
    if '-' in tok: tok = re.sub(r"(?<![A-Za-zÀ-ÿ])(lh|m|t)[’'](?=[ao]s?(?:-|$))", r"\1", tok)
    if tok.lower() in MANUAL: return caixa(tok, MANUAL[tok.lower()])
    # contração com apóstrofo: d’elle → dele, n’aquelle → naquele
    m = re.match(r"^([A-Za-z]{1,2})[’']([A-Za-zÀ-ÿ].*)$", tok)
    if m:
        pre, resto = m.group(1), m.group(2)
        if resto[0].isupper() and pre.lower() in ('d', 'n'):        # d’Abrahão → de Abraão
            return caixa(pre, {'d': 'de', 'n': 'em'}[pre.lower()]) + ' ' + palavra(resto)
        junto = palavra(pre + resto)
        if junto.lower() in freq or pre.lower() not in ('d', 'n'): return junto
        return caixa(pre, {'d': 'de', 'n': 'em'}[pre.lower()]) + ' ' + palavra(resto)   # d’uma → de uma
    partes = tok.split('-')
    if len(partes) == 1:
        return caixa(tok, modernizar(tok.lower()))
    low = [p.lower() for p in partes]
    # composto conhecido inteiro (Beth-el → Betel)?
    inteiro = ''.join(low)
    if not any(p in CLITICOS or p in FUTURO for p in low[1:]):
        if tok.lower() in freq: return tok
        if partes[0][0].isupper():
            k = 'C:' + tok.lower()
            if k not in decisao:
                fs = chave.get(sem_acento(inteiro), [])
                al = fs[0] if fs else None
                if not al: al = alinhar_composto(tok)
                decisao[k], motivo[k] = (al, 'composto') if al else (None, 'composto sem decisão')
            if decisao[k]: return caixa(tok, decisao[k])
        return '-'.join(palavra(p) for p in partes)
    out = [palavra(partes[0])]
    i = 1
    while i < len(partes):
        p, pl = partes[i], low[i]
        if pl in FUTURO and i > 0 and (low[i - 1] in CLITICOS or out[-1].lower() in CLITICOS):
            out.append(FUTURO[pl]); i += 1; continue
        if pl in ('o', 'a', 'os', 'as') and partes[i - 1].lower().endswith('l') and partes[i - 1].lower() not in CLITICOS - {'vol', 'nol'}:
            orig_ant = partes[i - 1]
            if orig_ant.lower() in ('vol', 'nol'): ant = orig_ant[:-1]
            else:
                inf = modernizar(orig_ant[:-1].lower() + 'r')       # chamal → chamar → chama
                ant = caixa(orig_ant, inf[:-1] if inf.endswith('r') else orig_ant[:-1].lower())
            if orig_ant.lower() in ('vol', 'nol'): out[-1] = ant
            elif ant and ant[-1].lower() in ACENTO_FINAL:
                if ant[-1].lower() == 'i' and len(ant) > 1 and ant[-2].lower() in 'aeiou': ant = ant[:-1] + 'í'
                else: ant = ant[:-1] + ACENTO_FINAL[ant[-1].lower()]
                out[-1] = ant
            else: out[-1] = ant
            out.append('l' + pl); i += 1; continue
        out.append(caixa(p, modernizar(pl)) if pl not in CLITICOS else p)
        i += 1
    return '-'.join(out)

# ------------------------------------------------------------------ texto com mapa de posições
RE_ESPECIAL = re.compile(r"(?<![A-Za-zÀ-ÿ])(?:(?:[dDnN]|lh|[tTmM])(?:[’'][{}]|\}[’'])|[Ee]st[’'](?=\s)|[A-Za-zÀ-ÿ]+(?:-[A-Za-zÀ-ÿ]+)*-(?:lh|m|t|n)[’']\{)")
def especial(x):
    """Apóstrofo colado a uma chave de itálico: d’}hoje → de} hoje, n’{este} → em {este}, t’{a} → {ta}, est’ → esta."""
    if re.match(r"[Ee]st[’']$", x): return x[0] + 'sta'
    m = re.match(r"^(.*)-(lh|m|t|n)[’']\{$", x)
    if m: return palavra(m.group(1)) + '-{' + m.group(2)       # deu-lh’{o} → deu-{lho}
    if x[-2] == '}':                                 # d}’hoje → de} hoje ; {m}’a → {m}a
        pre = x[:-2]
        if pre.lower() in ('d', 'n'): return caixa(pre, 'de' if pre.lower() == 'd' else 'em') + '} '
        return pre + '}'
    pre, ch = x[:-2], x[-1]
    if pre.lower() in ('d', 'n'):
        rep = caixa(pre, 'de' if pre.lower() == 'd' else 'em')
        return rep + ch + ' ' if ch == '}' else rep + ' ' + ch
    return (pre + ch) if ch == '}' else ('{' + pre)
def converter_texto(t):
    """Retorna (texto novo, mapa) — mapa[i] = posição no texto plano novo para a posição i do plano antigo."""
    novo, mapa, pos = [], [], 0
    i = 0
    itens = sorted([(m.start(), m.end(), 'e') for m in RE_ESPECIAL.finditer(t)] +
                   [(m.start(), m.end(), 'p') for m in RE_PAL.finditer(t)], key=lambda x: (x[0], -x[1]))
    ultimo = 0
    for ini, fim, tipo in itens:
        if ini < ultimo: continue
        for ch in t[i:ini]:
            novo.append(ch)
            if ch not in '{}': mapa.append(pos); pos += 1
        orig = t[ini:fim]
        n = especial(orig) if tipo == 'e' else palavra(orig)
        for ch in orig:
            if ch not in '{}': mapa.append(pos)
        novo.append(n); pos += len(n.replace('{', '').replace('}', ''))
        i = ultimo = fim
    for ch in t[i:]:
        novo.append(ch)
        if ch not in '{}': mapa.append(pos); pos += 1
    mapa.append(pos)
    return re.sub(r' {2,}', ' ', ''.join(novo)), mapa

# ------------------------------------------------------------------ referências cruzadas
LIVRO_ABREV = json.load(open(os.path.join(os.path.dirname(__file__), 'almeida1911_refs.json'), encoding='utf-8'))
ABREV_APP = json.load(open(os.path.join(os.path.dirname(__file__), 'abrev_app.json'), encoding='utf-8'))
RE_LIVRO_NOTA = re.compile(r"\b((?:I{1,3}|IV)\s)?([A-ZÁÉÍÓÚ][a-záéíóúçãõâêô]+)\.?\s(?=\d)")
nao_convertidas = collections.Counter()
def converter_ref(t, livro_atual):
    def sub_livro(m):
        num = {'I ': '1', 'II ': '2', 'III ': '3'}.get(m.group(1) or '', '')
        k = (m.group(1) or '') + m.group(2)
        bid = LIVRO_ABREV.get(k)
        if not bid: nao_convertidas[k] += 1; return m.group(0)
        return ABREV_APP[bid] + ' '
    t2 = RE_LIVRO_NOTA.sub(sub_livro, t)
    t2 = re.sub(r'\bcap\.\s?(?=\d)', 'cap. ', t2)
    t2 = re.sub(r'\bver\.\s?(?=\d)', 'v. ', t2)
    t2 = re.sub(r'(\d+)\.(\d+)', r'\1:\2', t2)       # 3.23 → 3:23
    t2 = re.sub(r'\.\s(?=[1-3]?[A-ZÁÉÍÓÚ]|cap\.|v\.)', '; ', t2)   # separador entre referências
    t2 = re.sub(r'\.$', '', t2.strip())
    return t2

# letras do acróstico (Sl 119, Lm) como na Bíblia Livre
LETRAS = {'Aleph': 'Álefe', 'Beth': 'Bete', 'Gimel': 'Guímel', 'Daleth': 'Dálete', 'He': 'Hê', 'Vau': 'Vau', 'Zain': 'Záin', 'Heth': 'Hete',
          'Teth': 'Tete', 'Jod': 'Iode', 'Caph': 'Cafe', 'Lamed': 'Lâmede', 'Mem': 'Mem', 'Nun': 'Nun', 'Samech': 'Sâmeque', 'Ain': 'Áin',
          'Pe': 'Pê', 'Tsade': 'Tsadê', 'Koph': 'Cofe', 'Res': 'Rexe', 'Resch': 'Rexe', 'Sin': 'Xin', 'Schin': 'Xin', 'Tau': 'Tau'}
def cabecalho(t):
    m = re.fullmatch(r'([A-Z][a-z]+)\.', t.strip())
    if m and m.group(1) in LETRAS: return LETRAS[m.group(1)] + '.'
    return converter_texto(t)[0]

# ------------------------------------------------------------------ gravar
os.makedirs(os.path.join(BASE, NOVA), exist_ok=True)
avisos = []
for b, lv in L1911.items():
    novo = dict(lv)
    caps, notas, cab = [], {}, {}
    mapas = {}
    for ci, cap in enumerate(lv['caps']):
        nc = []
        for vi, t in enumerate(cap):
            nt, mp = converter_texto(t)
            nc.append(nt); mapas[f'{ci + 1}:{vi + 1}'] = mp
        caps.append(nc)
    novo['caps'] = caps
    for k, lst in (lv.get('notas') or {}).items():
        mp = mapas[k]
        out = []
        for x in lst:
            y = dict(x); y['o'] = mp[min(x['o'], len(mp) - 1)]
            y['t'] = converter_ref(x['t'], b) if x.get('tipo') == 'ref' else converter_texto(x['t'])[0]
            if 'k' in y: y['k'] = converter_texto(y['k'])[0]
            out.append(y)
        notas[k] = out
    for k, lst in (lv.get('cab') or {}).items():
        mp = mapas[k]
        cab[k] = [dict(x, o=mp[min(x['o'], len(mp) - 1)], t=cabecalho(x['t'])) for x in lst]
    if notas: novo['notas'] = notas
    if cab: novo['cab'] = cab
    if lv.get('titulos'): novo['titulos'] = {k: cabecalho(v) for k, v in lv['titulos'].items()}
    json.dump(novo, open(os.path.join(BASE, NOVA, b + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

meta = json.load(open(os.path.join(os.path.dirname(__file__), 'metadados', 'alm1911at.json'), encoding='utf-8'))
ix = dict(ix1911); ix.update(meta)
json.dump(ix, open(os.path.join(BASE, NOVA, 'indice.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# relatório: toda palavra que mudou, com o motivo e quantas vezes aparece
cont = collections.Counter()
for w, lst in ocorr.items(): cont[w] = len(lst)
with open(RELATORIO, 'w', encoding='utf-8') as f:
    f.write('antes\tdepois\tmotivo\tocorrencias\n')
    for w in sorted(decisao, key=lambda x: -cont[x]):
        if decisao[w] != w or motivo[w] == 'sem decisão': f.write(f'{w}\t{decisao[w]}\t{motivo[w]}\t{cont[w]}\n')
m = collections.Counter(motivo.values())
print('palavras distintas:', len(decisao), dict(m))
print('mudaram:', sum(1 for w in decisao if decisao[w] != w), ' ocorrências mudadas:', sum(cont[w] for w in decisao if decisao[w] != w))
print('abreviações não convertidas:', nao_convertidas.most_common(20))
