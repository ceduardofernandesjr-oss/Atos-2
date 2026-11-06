"""Verificação de uma tradução convertida para o ATOS 2.
1) versificação de cada capítulo comparada com a KJV (open-bibles), listando as diferenças;
2) versículos vazios;
3) ida e volta: as palavras da fonte (sem notas, títulos e marcações) == palavras do JSON (sem chaves de itálico).
Uso: python3 -I verificar_traducao.py <pasta_json> <kjv.osis.xml> usfm <pasta_usfm>
     python3 -I verificar_traducao.py <pasta_json> <kjv.osis.xml> gutenberg <pasta_OEBPS>
"""
import json, os, re, sys, glob, html, xml.etree.ElementTree as ET

pasta, kjv, tipo, fonte = sys.argv[1:5]
ORDEM = [l["id"] for l in json.load(open(os.path.join(pasta, "indice.json"), encoding="utf-8"))["livros"]]
OSIS = dict(zip("GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV".split(),
                "Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev".split()))
cont = {}
for ev, el in ET.iterparse(kjv):
    if el.tag.endswith("verse") and el.get("osisID"):
        for oid in el.get("osisID").split():
            b, c, v = oid.split(".")
            cont.setdefault(b, {}).setdefault(int(c), set()).add(int(v))
    el.clear()
livros = {b: json.load(open(os.path.join(pasta, b + ".json"), encoding="utf-8")) for b in ORDEM}
dif, vazios = [], []
for b in ORDEM:
    k = cont[OSIS[b]]
    caps = livros[b]["caps"]
    if len(caps) != len(k): dif.append(f"{b}: {len(caps)} capítulos (KJV {len(k)})")
    for c, vs in enumerate(caps, 1):
        if c in k and len(vs) != max(k[c]): dif.append(f"{b} {c}: {len(vs)} versículos (KJV {max(k[c])})")
        for v, t in enumerate(vs, 1):
            if not t.strip(): vazios.append(f"{b} {c}:{v}")
print("Diferenças de versificação em relação à KJV:", len(dif))
for d in dif: print("  ", d)
print("Versículos vazios:", len(vazios), vazios[:20])

PAL = r"[\wÀ-ÿ'’-]+"
def palavras(s): return re.findall(PAL, s)
def saida(b): return palavras(" ".join(v for c in livros[b]["caps"] for v in c).replace("{", " ").replace("}", " "))

falhas = 0
if tipo == "usfm":
    for f in sorted(glob.glob(os.path.join(fonte, "*.usfm"))):
        s = open(f, encoding="utf-8-sig").read()
        b = re.search(r"\\id\s+(\S+)", s).group(1)
        if b not in livros: continue
        s = re.sub(r"\\f\s.*?\\f\*", " ", s, flags=re.S)                       # notas
        s = re.sub(r"^\\(id|ide|h|toc\d|mt\d?|d|s\d?|sp|qa|ms\d?|r|rem)\b.*$", " ", s, flags=re.M)   # títulos/cabeçalhos
        s = re.sub(r"\\(c|v)\s+\d+", " ", s)                                     # números
        s = re.sub(r"\\\+?[a-z]+\d?\*", "", s)                                   # fechamentos (\\nd*): colados
        s = re.sub(r"\\\+?[a-z]+\d?", " ", s)                                     # demais marcadores
        if palavras(s) != saida(b):
            falhas += 1; a, o = palavras(s), saida(b)
            k = next((j for j in range(min(len(a), len(o))) if a[j] != o[j]), min(len(a), len(o)))
            print("  DIVERGE", b, k, a[k-4:k+4], o[k-4:k+4])
else:
    textos = {}
    for f in glob.glob(os.path.join(fonte, "*.xhtml")):
        s = open(f, encoding="utf-8").read()
        for m in re.finditer(r'<p id="([A-Za-z]+)(\d+)-(\d+)">(.*?)</p>', s, re.S):
            t = m.group(4)
            t = re.sub(r'<a class="fnanchor[^"]*"[^>]*>.*?</a>', " ", t)
            t = re.sub(r'<span class="x-ebookmaker-pageno".*?</span>\s*\d+\s', " ", t)   # quebra de página + número do versículo seguinte (Os 11:5)
            t = re.sub(r'<span class="x-ebookmaker-pageno".*?</span>', " ", t)
            t = re.sub(r'<span class="first">.*?</span>', " ", t)
            t = re.sub(r'<span class="smcap">(Aleph|Beth|Gimel|Daleth|He|Vau|Zain|Heth|Teth|Jod|Caph|Lamed|Mem|Nun|Samech|Ain|Pe|Tsade|Koph|Resh|Schin|Tau)\.</span>', " ", t)
            t = html.unescape(re.sub(r"<[^>]+>", " ", t))
            t = re.sub(r"^\s*\d+\s", " ", t)                                       # número do versículo no início
            textos[(m.group(1), int(m.group(2)), int(m.group(3)))] = t
    PREF = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "almeida1911_livros.json"), encoding="utf-8"))
    for pref, b in PREF.items():
        ks = sorted(k for k in textos if k[0] == pref)
        a = palavras(" ".join(textos[k] for k in ks))
        if a != saida(b):
            falhas += 1; o = saida(b)
            k = next((j for j in range(min(len(a), len(o))) if a[j] != o[j]), min(len(a), len(o)))
            print("  DIVERGE", b, k, a[k-4:k+4], o[k-4:k+4])
print("Livros com divergência de palavras:", falhas)
