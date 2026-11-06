"""Verificação independente do JSON gerado:
1) contagem de capítulos/versículos de cada livro comparada à versificação da KJV (open-bibles);
2) ida e volta: as palavras da fonte (sem marcadores, notas, títulos e referências) são
   exatamente as palavras do JSON (sem as chaves de itálico), livro a livro.
Uso: python3 -I verificar_biblia.py <pasta_json> <kjv.osis.xml> <pasta_geral>
"""
import json, os, re, sys, xml.etree.ElementTree as ET

pasta, kjv, tr = sys.argv[1:4]
OSIS = dict(zip(("GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV").split(),
                ("Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev").split()))
cont = {}
for ev, el in ET.iterparse(kjv):
    if el.tag.endswith("verse") and el.get("osisID"):
        for oid in el.get("osisID").split():
            b, c, v = oid.split(".")
            cont.setdefault(b, {}).setdefault(int(c), set()).add(int(v))
    el.clear()
idx = json.load(open(os.path.join(pasta, "indice.json"), encoding="utf-8"))
dif = []
for lv in idx["livros"]:
    k = cont[OSIS[lv["id"]]]
    if len(k) != len(lv["versos"]):
        dif.append(f"{lv['id']}: {len(lv['versos'])} caps vs KJV {len(k)}")
    for c, n in enumerate(lv["versos"], 1):
        if c in k and max(k[c]) != n:
            dif.append(f"{lv['id']} {c}: {n} vv vs KJV {max(k[c])}")
print("Diferenças de versificação em relação à KJV:", len(dif))
for d in dif: print("  ", d)

# ida e volta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from converter_blivre import ler_fonte
falhas = 0
for nome in sorted(os.listdir(tr)):
    if not nome.endswith(".txt") or "\\ubs-code" not in open(os.path.join(tr, nome), encoding="utf-8-sig").read(3000):
        continue
    linhas = ler_fonte(os.path.join(tr, nome))
    out, pula, i = [], None, 0
    for l in linhas:
        s = l.strip()
        if pula:
            m = re.match(r"\\?\*" + pula + r"(?![\w-])(.*)$", s)
            if m:
                pula = None
                out.append(m.group(1))
            continue
        if s in ("\\fn", "\\ref", "\\psalm-title", "\\name-long", "\\name-short", "\\abbreviation", "\\ubs-code"):
            pula = s[1:]; continue
        m = re.match(r"\\?\*added(.*)$", s)
        if m:
            out.append(m.group(1)); continue
        if s.startswith("\\v ") or s == "\\added":
            continue
        out.append(l)
    fonte = re.findall(r"[\wÀ-ÿ'’-]+", " ".join(out).replace("{", " ").replace("}", " "))
    livro_id = None
    m = re.search(r"\\ubs-code\s*\n(\S+)", "\n".join(linhas))
    js = json.load(open(os.path.join(pasta, m.group(1) + ".json"), encoding="utf-8"))
    texto = " ".join(v for cap in js["caps"] for v in cap).replace("{", " ").replace("}", " ")
    saida = re.findall(r"[\wÀ-ÿ'’-]+", texto)
    if fonte != saida:
        falhas += 1
        k = next((j for j in range(min(len(fonte), len(saida))) if fonte[j] != saida[j]), min(len(fonte), len(saida)))
        print("  DIVERGE", nome, k, fonte[k-5:k+5], saida[k-5:k+5])
print("Livros com divergência de palavras:", falhas)
