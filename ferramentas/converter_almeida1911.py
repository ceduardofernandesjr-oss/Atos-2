"""Converte a Almeida "Edição Revista e Corrigida" (Lisboa, Depósito das Escripturas Sagradas, 1911),
transcrita pelo Projeto Gutenberg (ebook 62383, EPUB), para o JSON do ATOS 2.

Uso: python3 -I converter_almeida1911.py <pasta_OEBPS_do_epub> <pasta_saida> <arquivo_meta.json>

- Cada versículo é um <p id="Livro{cap}-{v}">; o número inicial (e o do capítulo, em <span class="first">) sai do texto.
- <i>…</i> (palavras acrescentadas) vira {…}; números de página e âncoras de nota saem do texto.
- Notas de referência (Footnote_N) e leituras alternativas (Endnote_N) viram "notas" na posição da âncora.
- Títulos dos salmos (<p class="center"> sem links, antes do v. 1) vão para "titulos".
- Sumários dos capítulos (<h3>) e letras hebraicas do acróstico (Aleph., Beth.…) vão para "cab": não são texto bíblico.
- Grafia de 1911 mantida exatamente como na fonte.
"""
import glob, html, json, os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
PREF = json.load(open(os.path.join(AQUI, "almeida1911_livros.json"), encoding="utf-8"))
ORDEM = ("GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM "
         "EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL "
         "1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV").split()
NOMES = dict(zip(ORDEM, ["Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio", "Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel",
    "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras", "Neemias", "Ester", "Jó", "Salmos", "Provérbios", "Eclesiastes", "Cantares",
    "Isaías", "Jeremias", "Lamentações", "Ezequiel", "Daniel", "Oseias", "Joel", "Amós", "Obadias", "Jonas", "Miqueias", "Naum", "Habacuque",
    "Sofonias", "Ageu", "Zacarias", "Malaquias", "Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", "1 Coríntios", "2 Coríntios",
    "Gálatas", "Efésios", "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo", "Tito", "Filemom",
    "Hebreus", "Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João", "3 João", "Judas", "Apocalipse"]))
ACROSTICO = "Aleph|Beth|Gimel|Daleth|He|Vau|Zain|Heth|Teth|Jod|Caph|Lamed|Mem|Nun|Samech|Ain|Pe|Tsade|Koph|Resh|Schin|Tau"
MARCA = ""
QUEBRA = "\ue001"      # posição de uma quebra de página da edição impressa


def plano(fragmento):
    t = re.sub(r"<[^>]+>", " ", fragmento)
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


def limpa(s):
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\s+([,.;:!?)”’])", r"\1", s)
    s = re.sub(r"([“‘(])\s+", r"\1", s)
    s = re.sub(r"\{\s+", "{", s)
    s = re.sub(r"\s+\}", "}", s)
    s = s.replace("{}", "")
    return s.strip()


def main():
    origem, destino, arq_meta = sys.argv[1:4]
    extra = json.load(open(arq_meta, encoding="utf-8"))
    # ordem de leitura (spine)
    opf = open(os.path.join(origem, "content.opf"), encoding="utf-8").read()
    manifest = dict(re.findall(r'<item\b[^>]*\bid="([^"]+)"[^>]*\bhref="([^"]+)"', opf))
    manifest.update({a: b for b, a in re.findall(r'<item\b[^>]*\bhref="([^"]+)"[^>]*\bid="([^"]+)"', opf)})
    arquivos = [manifest[i] for i in re.findall(r'<itemref\b[^>]*idref="([^"]+)"', opf) if i in manifest]
    docs = {f: open(os.path.join(origem, f), encoding="utf-8").read() for f in arquivos if f.endswith(("xhtml", "html", "htm"))}
    # textos das notas
    notas_txt = {}
    for s in docs.values():
        for m in re.finditer(r'<a id="((?:Footnote|Endnote)_\d+)"\s*/?>(?:</a>)?(.*?)</p>', s, re.S):
            t = plano(m.group(2))
            t = re.sub(r"^\[[^\]]+\]\s*", "", t)
            t = re.sub(r"\s+([,.;:])", r"\1", t)
            notas_txt[m.group(1)] = t
    livros = {b: {"caps": {}, "titulos": {}, "notas": {}, "cab": {}} for b in ORDEM}
    avisos, pend_cab, pend_titulo = [], [], None
    padrao = re.compile(r'<h3\b[^>]*>(.*?)</h3>|<p class="center[^"]*">(.*?)</p>|<p id="([A-Za-z]+)(\d+)-(\d+)">(.*?)</p>', re.S)
    for f in arquivos:
        s = docs.get(f)
        if not s:
            continue
        s = re.sub(r'<div class="footnote">.*?</div>', "", s, flags=re.S)
        for m in padrao.finditer(s):
            if m.group(1) is not None:                      # sumário do capítulo
                t = plano(m.group(1))
                if t and not re.fullmatch(r'(VELHO|NOVO) TESTAMENTO\.?', t): pend_cab.append(t)   # divisões gerais, não do capítulo
                continue
            if m.group(2) is not None:                      # título de salmo (sem links) ou referência paralela (com links)
                if "<a " not in m.group(2):
                    pend_titulo = plano(m.group(2))
                continue
            pref, c, v, corpo = m.group(3), int(m.group(4)), int(m.group(5)), m.group(6)
            b = PREF.get(pref)
            if not b:
                avisos.append(f"prefixo desconhecido {pref}"); continue
            L = livros[b]
            # letra do acróstico
            acr = re.search(r'<span class="smcap">(' + ACROSTICO + r')\.</span>', corpo)
            if acr:
                pend_cab.append(acr.group(1) + "."); corpo = corpo.replace(acr.group(0), " ")
            corpo = re.sub(r'<span class="x-ebookmaker-pageno".*?</span>', QUEBRA, corpo, flags=re.S)
            corpo = re.sub(r'<a id="Page_\d+"[^>]*>.*?</a>|<a id="Page_\d+"[^>]*/>', " ", corpo, flags=re.S)
            corpo = re.sub(r'<span class="first">.*?</span>', " ", corpo, flags=re.S)
            ids_nota = []
            def ancora(mm):
                ids_nota.append(mm.group(1)); return MARCA
            corpo = re.sub(r'<a class="fnanchor[^"]*" href="[^"#]*#((?:Footnote|Endnote)_\d+)">.*?</a>', ancora, corpo, flags=re.S)
            corpo = re.sub(r'<a id="(?:FN|EN)anchor_\d+"\s*/>', "", corpo)
            corpo = re.sub(r"<i>", "{", corpo); corpo = re.sub(r"</i>", "}", corpo)
            texto = html.unescape(re.sub(r"<[^>]+>", " ", corpo))
            texto = re.sub(r"^((?:\s|" + MARCA + r")*)\d+\s", r"\1 ", texto)   # número do versículo (pode vir após uma âncora)
            blocos = [(v, texto)]
            # versículo seguinte colado depois de uma quebra de página (ex.: Os 11:5 no parágrafo do v. 4)
            sep = re.split(QUEBRA + r"\s*" + str(v + 1) + r"\s", texto, maxsplit=1)
            if len(sep) == 2:
                blocos = [(v, sep[0]), (v + 1, sep[1])]
                avisos.append(f"{b} {c}:{v + 1} separado do v. {v} (mesmo parágrafo na transcrição)")
            fila = iter(ids_nota)
            for vv, tx in blocos:
                tx = limpa(tx.replace(QUEBRA, " "))
                out, pos = "", []
                for ch in tx:
                    if ch == MARCA: pos.append(len(out.rstrip()))
                    else: out += ch
                out = limpa(out)
                for p in pos:
                    nid = next(fila); t = notas_txt.get(nid)
                    if t is None:
                        avisos.append(f"{b} {c}:{vv} nota {nid} sem texto"); continue
                    L["notas"].setdefault(f"{c}:{vv}", []).append({"t": t, "o": min(p, len(out)), "tipo": "ref" if nid.startswith("Foot") else "alt"})
                if pend_titulo:                       # antes do v. 1: título do salmo; no meio: letra do Sl 119 etc.
                    if vv == 1: L["titulos"][str(c)] = pend_titulo
                    else: pend_cab.append(pend_titulo)
                pend_titulo = None
                for h in pend_cab:
                    L["cab"].setdefault(f"{c}:{vv}", []).append({"o": 0, "t": h})
                pend_cab = []
                if vv in L["caps"].setdefault(c, {}):
                    avisos.append(f"{b} {c}:{vv} repetido")
                L["caps"][c][vv] = out
    os.makedirs(destino, exist_ok=True)
    indice, total = [], 0
    for n, b in enumerate(ORDEM):
        L = livros[b]
        if not L["caps"]:
            sys.exit(f"Livro ausente: {b}")
        caps = []
        for c in range(1, max(L["caps"]) + 1):
            vs = L["caps"].get(c, {})
            if not vs: avisos.append(f"{b} capítulo {c} ausente"); caps.append([]); continue
            for v in range(1, max(vs) + 1):
                if v not in vs: avisos.append(f"{b} {c}:{v} ausente")
                elif not vs[v]: avisos.append(f"{b} {c}:{v} vazio")
            caps.append([vs.get(v, "") for v in range(1, max(vs) + 1)])
        lv = {"id": b, "nome": NOMES[b], "nomeLongo": NOMES[b], "abrev": b, "caps": caps}
        for k in ("titulos", "notas", "cab"):
            if L[k]: lv[k] = L[k]
        json.dump(lv, open(os.path.join(destino, b + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        nv = [len(x) for x in caps]; total += sum(nv)
        indice.append({"id": b, "nome": NOMES[b], "abrev": b, "nomeLongo": NOMES[b], "test": "AT" if n < 39 else "NT", "versos": nv})
    json.dump(dict(extra, totalVersiculos=total, livros=indice), open(os.path.join(destino, "indice.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("versiculos", total, "avisos", len(avisos))
    for a in avisos[:60]: print("  ", a)


if __name__ == "__main__":
    main()
