#!/usr/bin/env python3
"""
ATOS 2 — Converte os dados abertos do STEPBible (CC BY 4.0, www.STEPBible.org) para o app:
  app/originais/<LIVRO>.json   {"c:v": [[original, transliteração, strong, morfologia, tradução palavra-a-palavra (inglês)], ...]}
  app/originais/lexico-g.json  {strong: [lema, transliteração, classe, glosa (inglês), total, [refs...]]}
  app/originais/lexico-h.json  (idem, hebraico e aramaico)
  app/originais/morfologia.json {codigo: descrição em português}
Fontes: TAGNT (grego; só palavras presentes no Textus Receptus, base da BLIVRE e da Almeida),
        TAHOT (hebraico, Leningrado; leitura Qere quando difere do Ketiv), TBESG/TBESH (léxicos breves),
        TEGMC/TEHMC (códigos de morfologia).
Uso:  python3 -I ferramentas/converter_originais.py <pasta stepbible-data> <pasta app/originais>
"""
import sys, os, re, json, unicodedata
from collections import defaultdict

ORIGEM, DESTINO = sys.argv[1], sys.argv[2]
os.makedirs(DESTINO, exist_ok=True)

LIVROS = {  # STEPBible → id do app
 'Gen':'GEN','Exo':'EXO','Lev':'LEV','Num':'NUM','Deu':'DEU','Jos':'JOS','Jdg':'JDG','Rut':'RUT','1Sa':'1SA','2Sa':'2SA','1Ki':'1KI','2Ki':'2KI',
 '1Ch':'1CH','2Ch':'2CH','Ezr':'EZR','Neh':'NEH','Est':'EST','Job':'JOB','Psa':'PSA','Pro':'PRO','Ecc':'ECC','Sng':'SNG','Isa':'ISA','Jer':'JER',
 'Lam':'LAM','Ezk':'EZK','Dan':'DAN','Hos':'HOS','Jol':'JOL','Amo':'AMO','Oba':'OBA','Jon':'JON','Mic':'MIC','Nam':'NAM','Hab':'HAB','Zep':'ZEP',
 'Hag':'HAG','Zec':'ZEC','Mal':'MAL','Mat':'MAT','Mrk':'MRK','Luk':'LUK','Jhn':'JHN','Act':'ACT','Rom':'ROM','1Co':'1CO','2Co':'2CO','Gal':'GAL',
 'Eph':'EPH','Php':'PHP','Col':'COL','1Th':'1TH','2Th':'2TH','1Ti':'1TI','2Ti':'2TI','Tit':'TIT','Phm':'PHM','Heb':'HEB','Jas':'JAS','1Pe':'1PE',
 '2Pe':'2PE','1Jn':'1JN','2Jn':'2JN','3Jn':'3JN','Jud':'JUD','Rev':'REV'}

def sem_cantilacao(s):
    # retira acentos de cantilação hebraicos (U+0591–U+05AF), mantém vogais; normaliza
    return unicodedata.normalize('NFC', re.sub('[֑-ֽ֯]', '', s))

livros = defaultdict(dict)          # id -> "c:v" -> [palavras]
ocorr = defaultdict(list)           # strong -> refs
pasta = os.path.join(ORIGEM, 'Translators Amalgamated OT+NT')
linha_ref = re.compile(r'^([1-3]?[A-Z][a-z]{1,2})\.(\d+)\.(\d+)(?:\([^)]*\))?#(\d+)=(\S+)')
morf_usadas = set()

def strong_principal(campo):
    m = re.search(r'\{([HG]\d+[A-Za-z]?)\}', campo)
    if m: return m.group(1)
    m = re.match(r'([HG]\d+[A-Za-z]?)', campo)
    return m.group(1) if m else ''

for nome in sorted(os.listdir(pasta)):
    if not nome.endswith('.txt'): continue
    grego = nome.startswith('TAGNT')
    with open(os.path.join(pasta, nome), encoding='utf-8') as f:
        for linha in f:
            m = linha_ref.match(linha)
            if not m: continue
            liv, c, v, _, tipo = m.groups()
            if liv not in LIVROS: continue
            col = linha.rstrip('\n').split('\t')
            if grego:
                if 'TR' not in col[5].split('+'): continue
                orig_tr = col[1]; mm = re.match(r'(.*?)\s*\((.*)\)\s*$', orig_tr)
                orig, translit = (mm.group(1).strip(), mm.group(2).strip()) if mm else (orig_tr.strip(), '')
                orig = unicodedata.normalize('NFC', orig)
                trad = col[2].strip()
                sm = col[3].split('=', 1)
                strong = re.sub(r'[^\dG]', '', sm[0][:6]) if sm else ''
                strong = re.match(r'G\d+', sm[0]).group(0) if re.match(r'G\d+', sm[0]) else ''
                morf = sm[1].strip() if len(sm) > 1 else ''
            else:
                if tipo.startswith('X') or tipo.startswith('R'): continue
                orig = sem_cantilacao(col[1].replace('/', '').replace('\\', ' ')).replace('׃', '').replace('׀', '').strip()
                translit = col[2].replace('/', '').strip()
                trad = col[3].replace('/ ', ' ').replace('/', ' ').strip()
                strong = strong_principal(col[4])
                morf = col[5].strip()
            k = f'{int(c)}:{int(v)}'
            livros[LIVROS[liv]].setdefault(k, []).append([orig, translit, strong, morf, trad])
            if strong: ocorr[strong].append(f'{LIVROS[liv]} {int(c)}:{int(v)}')
            morf_usadas.add(morf)

for lv, vs in livros.items():
    with open(os.path.join(DESTINO, lv + '.json'), 'w', encoding='utf-8') as f:
        json.dump({'livro': lv, 'v': vs}, f, ensure_ascii=False, separators=(',', ':'))

# ------------------------------------------------------------------ léxicos
def lexico(arquivo, prefixo):
    out = {}
    with open(os.path.join(ORIGEM, 'Lexicons', arquivo), encoding='utf-8') as f:
        for linha in f:
            col = linha.rstrip('\n').split('\t')
            if len(col) < 7: continue
            s = col[1].split(' ')[0].strip()       # coluna 2 traz o Strong estendido da entrada (H2617A =, G0002 = ...)
            if not re.match(prefixo + r'\d+[A-Za-z]?$', s): continue
            if s in out: continue
            out[s] = [unicodedata.normalize('NFC', col[3].strip()), col[4].strip(), col[5].strip(), col[6].strip()]
    return out

def gravar_lexico(lex, prefixo, nome):
    final = {}
    for s, refs in ocorr.items():
        if not s.startswith(prefixo): continue
        num = re.sub(r'[A-Za-z]$', '', s)
        base = lex.get(s) or lex.get(num) or next((lex[k] for k in sorted(lex) if re.sub(r'[A-Za-z]$', '', k) == num), None)
        if not base: continue
        unicos = list(dict.fromkeys(refs))
        final[s] = base + [len(refs), unicos[:150] if len(unicos) <= 1500 else []]
    with open(os.path.join(DESTINO, nome), 'w', encoding='utf-8') as f:
        json.dump(final, f, ensure_ascii=False, separators=(',', ':'))
    return len(final)

ng = gravar_lexico(lexico('TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt', 'G'), 'G', 'lexico-g.json')
nh = gravar_lexico(lexico('TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt', 'H'), 'H', 'lexico-h.json')

# ------------------------------------------------------------------ morfologia em português
CHAVES = {'Function': '', 'Case': 'caso', 'Number': 'número', 'Gender': 'gênero', 'Tense': 'tempo', 'Voice': 'voz', 'Mood': 'modo', 'Person': 'pessoa',
          'Stem': 'tronco', 'Form': 'forma', 'State': 'estado', 'Extra': '', 'Name type': '', 'Adj.Numb.': '', 'Original language': ''}
VAL = {
 'Noun':'substantivo','Verb':'verbo','Adjective':'adjetivo','Adverb':'advérbio','Conjunction':'conjunção','Preposition':'preposição','Particle':'partícula',
 'Definite article':'artigo definido','Personal pronoun':'pronome pessoal','Demonstrative pronoun':'pronome demonstrativo','Relative pronoun':'pronome relativo',
 'Interrogative pronoun':'pronome interrogativo','Indefinite pronoun':'pronome indefinido','Possessive pronoun':'pronome possessivo','Reflexive pronoun':'pronome reflexivo',
 'Reciprocal pronoun':'pronome recíproco','Correlative pronoun':'pronome correlativo','Correlative or Interrogative pronoun':'pronome correlativo ou interrogativo',
 'Pronoun':'pronome','Interjection':'interjeição','Negative Particle':'partícula negativa','Interrogative Particle':'partícula interrogativa','Suffix':'sufixo',
 'Particle or Disjunctive':'partícula ou disjuntiva','Indeclinable Proper Noun':'nome próprio indeclinável','Indeclinable Noun of Other type':'substantivo indeclinável',
 'Aramaic transliterated word':'palavra aramaica transliterada','Adverb or adverb and particle combined':'advérbio','Demonstrative pronoun+Conjunction':'pronome demonstrativo + conjunção',
 'Nominative':'nominativo','Genitive':'genitivo','Dative':'dativo','Accusative':'acusativo','Vocative':'vocativo',
 'Singular':'singular','Plural':'plural','Dual':'dual','Masculine':'masculino','Feminine':'feminino','Neuter':'neutro','Either gender':'qualquer gênero',
 'Present':'presente','Imperfect':'imperfeito','Future':'futuro','Aorist':'aoristo','Perfect':'perfeito','Pluperfect':'mais-que-perfeito',
 '2nd Aorist':'aoristo segundo','2nd Future':'futuro segundo','2nd Perfect':'perfeito segundo','2nd Pluperfect':'mais-que-perfeito segundo','2nd Present':'presente segundo',
 'indefinite tense':'tempo indefinido','Active':'ativa','Middle':'média','Passive':'passiva','Middle or Passive':'média ou passiva','Middle Deponent':'média depoente',
 'Passive Deponent':'passiva depoente','Middle or Passive Deponent':'média ou passiva depoente','impersonal active':'ativa impessoal','indefinite voice':'voz indefinida',
 'Indicative':'indicativo','Subjunctive':'subjuntivo','Optative':'optativo','Imperative':'imperativo','Infinitive':'infinitivo','Participle':'particípio',
 'Participle passive':'particípio passivo','1st':'1ª','2nd':'2ª','3rd':'3ª','First':'1ª','Second':'2ª','Third':'3ª','1st Person':'1ª','2nd Person':'2ª',
 'Common':'comum','Proper':'próprio','Gentilic':'gentílico','Absolute':'absoluto','Construct':'construto','Definite':'definido','Consecutive Imperfect':'imperfeito consecutivo (wayyiqtol)',
 'Consecutive Perfect':'perfeito consecutivo','Conjunction+Imperfect':'conjunção + imperfeito','Cohortative':'coortativo','Jussive':'jussivo','Directional':'direcional',
 'Object indicator':'marcador de objeto','Relative':'relativo','Interrogative':'interrogativo','Negative':'negativo','Numerical':'numeral','Numerical position':'ordinal',
 'Personal':'pessoal','Demonstrative':'demonstrativo','Title':'título','Location':'lugar','Individual':'pessoa','Comparative':'comparativo','Superlative':'superlativo',
 'Contracted form':'forma contraída','Attic Greek form':'forma ática','Indeclinable Numeral':'numeral indeclinável','Numeral':'numeral',
 'Definite article (Hebrew)':'artigo definido','Definite article (Aramaic)':'artigo definido (aramaico)','Paragogic Hé':'he paragógico','Paragogic Nun':'nun paragógico',
 'Conditional':'condicional','Consecutive':'consecutivo','Abbreviated':'abreviado','Transitive':'transitivo','Interjection ':'interjeição'}
TRONCOS_ACAO = {'Simple':'simples','Causative/declarative':'causativo','Intensive/resultive/transtive':'intensivo','Reflexive/iterative':'reflexivo'}

def expansoes(arquivo):
    d = {}
    with open(os.path.join(ORIGEM, 'Morphology codes', arquivo), encoding='utf-8') as f:
        for linha in f:
            col = linha.rstrip('\n').split('\t')
            if len(col) >= 2 and re.match(r'^[A-Z][A-Za-z0-9-]*$', col[0]) and '=' in col[1] and col[0] not in d: d[col[0]] = col[1]
    return d
EXP = expansoes('TEGMC - Translators Expansion of Greek Morphhology Codes - STEPBible.org CC BY.txt')
EXP.update(expansoes('TEHMC - Translators Expansion of Hebrew Morphology Codes - STEPBible.org CC BY.txt'))

def traduzir_exp(exp):
    partes = []
    for p in exp.split(';'):
        p = p.strip()
        if '=' not in p: continue
        k, v = p.split('=', 1); k, v = k.strip(), v.strip()
        acao = re.search(r'Action=([^;)]+)', p)
        v = re.sub(r'\s*\(hence.*$', '', v).rstrip(')').strip()
        if k == 'Stem':
            partes.append('tronco ' + v + (' (' + TRONCOS_ACAO.get(acao.group(1).strip(), '') + ')' if acao and TRONCOS_ACAO.get(acao.group(1).strip()) else ''))
            continue
        if k not in CHAVES: continue
        tv = VAL.get(v, VAL.get(v.strip(), None))
        if tv is None: continue
        rot = CHAVES[k]
        partes.append((tv + ' pessoa') if k == 'Person' else tv if not rot or k in ('Case', 'Number', 'Gender', 'Tense', 'Mood', 'State', 'Form') else rot + ' ' + tv)
    return ', '.join(partes)

morf = {}
for cod in morf_usadas:
    if not cod: continue
    if cod.startswith(('H', 'A')) and '/' in cod:          # hebraico: prefixos e sufixos separados por /
        lingua, segs = cod[0], cod[1:].split('/')
        desc = [traduzir_exp(EXP.get(lingua + s, '')) or s for s in segs]
        morf[cod] = ' + '.join(desc)
    elif ' + ' in cod:                                         # grego: crase (duas palavras numa)
        desc = [traduzir_exp(EXP.get(re.sub(r'^G\d+[A-Za-z]?=', '', x), '')) or x for x in cod.split(' + ')]
        morf[cod] = ' + '.join(desc)
    else:
        morf[cod] = traduzir_exp(EXP.get(cod, '')) or cod
with open(os.path.join(DESTINO, 'morfologia.json'), 'w', encoding='utf-8') as f:
    json.dump(morf, f, ensure_ascii=False, separators=(',', ':'), sort_keys=True)

print('livros', len(livros), 'palavras', sum(len(w) for vs in livros.values() for w in vs.values()), 'lexico grego', ng, 'hebraico', nh, 'morfologias', len(morf),
      'sem tradução', sum(1 for k, v in morf.items() if v == k))
