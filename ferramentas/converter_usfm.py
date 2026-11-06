"""Converte uma Bíblia em USFM (ex.: Biblica® Open Nova Bíblia Viva, do eBible.org) para o JSON do ATOS 2.

Uso: python3 -I converter_usfm.py <pasta_usfm> <pasta_saida> <id> <sigla> <nome> <arquivo_meta.json>

Mesmo formato do conversor da Bíblia Livre, com um campo a mais:
  "cab": { "c:v": [ {"o": posição, "t": "texto"} ] }  — cabeçalhos que NÃO são texto bíblico
       (\\s1 títulos de seção, \\sp quem fala em Cantares, \\qa letras do Salmo 119).
Regras: nenhuma palavra do texto é alterada; \\nd (nome divino) vira texto normal; \\it vira itálico {…};
notas \\f…\\f* vão para "notas" com a posição em que aparecem; títulos \\d antes do v. 1 vão para "titulos".
"""
import json, os, re, sys

ORDEM = ("GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM "
         "EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL "
         "1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV").split()
NOTA = "\ue000"          # marcador interno de posição de nota/cabeçalho
PARAGRAFO = {"p", "m", "pi", "pi1", "pi2", "q", "q1", "q2", "q3", "li", "li1", "li2", "b", "nb", "lh", "lf", "pmo", "pc", "mi", "qc", "qr"}
CABECALHO = {"s", "s1", "s2", "s3", "sp", "qa", "ms", "ms1", "r", "mr"}
META = {"id", "ide", "h", "toc1", "toc2", "toc3", "mt", "mt1", "mt2", "rem", "usfm"}


def limpa(s):
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\s+([,.;:!?)”’])", r"\1", s)
    s = re.sub(r"([“‘(])\s+", r"\1", s)
    s = re.sub(r"\{\s+", "{", s)
    s = re.sub(r"\s+\}", "}", s)
    return s.strip()


def texto_inline(s):
    """Marcas de caractere: \\nd e \\+nd viram texto; \\it vira {…}; demais marcas de caractere são removidas mantendo o texto."""
    s = re.sub(r"\\\+?it\s", "{", s)
    s = re.sub(r"\\\+?it\*", "}", s)
    s = re.sub(r"\\\+?(nd|add|bk|qt|wj|sc|em|bd|k|tl|pn|w)\s", "", s)
    s = re.sub(r"\\\+?(nd|add|bk|qt|wj|sc|em|bd|k|tl|pn|w)\*", "", s)
    return s


def nota_texto(corpo):
    """Conteúdo de \\f + \\fr 1.2 \\ft texto \\xt ref \\f*  ->  ('texto ref', chave)"""
    chave = None
    m = re.search(r"\\fk\s+(.*?)(?=\\f[a-z]|\Z)", corpo)
    if m:
        chave = texto_inline(m.group(1)).strip()
    corpo = re.sub(r"^\s*[+\-?]\s*", "", corpo)
    corpo = re.sub(r"\\fr\s+[^\\]*", "", corpo)
    corpo = re.sub(r"\\fk\s+(.*?)(?=\\f[a-z]|\Z)", "", corpo)
    corpo = re.sub(r"\\(ft|fq|fqa|xt|fv|fl|fw|fp)\*?\s?", " ", corpo)
    return limpa(texto_inline(corpo).replace("{", "").replace("}", "")), chave


def converter_livro(caminho):
    bruto = open(caminho, encoding="utf-8-sig").read().replace("\r", "")
    meta = {}
    notas_pend = []          # notas extraídas, na ordem dos marcadores NOTA

    def tira_notas(s):
        def rep(m):
            notas_pend.append(nota_texto(m.group(1)))
            return NOTA
        return re.sub(r"\\f\s(.*?)\\f\*", rep, s, flags=re.S)
    bruto = tira_notas(bruto)

    caps, titulos, notas, cab = {}, {}, {}, {}
    cap = ver = None
    buf = []
    pend_cab = []            # cabeçalhos aguardando posição
    fila_notas = iter(notas_pend)
    avisos = []

    def registra_cab(c, v, o, t):
        cab.setdefault(f"{c}:{v}", []).append({"o": o, "t": t})

    def fecha():
        if cap is None or ver is None:
            return
        texto = limpa("".join(buf))
        # posições das notas: remove os marcadores e anota o deslocamento
        out, pos_notas = "", []
        for ch in texto:
            if ch == NOTA:
                pos_notas.append(len(out.rstrip()) if out.endswith(" ") else len(out))
            else:
                out += ch
        out = limpa(out)
        for p in pos_notas:
            t, k = next(fila_notas)
            n = {"t": t, "o": min(p, len(out))}
            if k:
                n["k"] = k
            notas.setdefault(f"{cap}:{ver}", []).append(n)
        if f"{cap}:{ver}" in caps.get(cap, {}):
            avisos.append(f"{meta.get('id')} {cap}:{ver} repetido")
        caps.setdefault(cap, {})[ver] = out

    def adiciona_texto(t):
        nonlocal pend_cab
        if not t.strip():
            buf.append(t)
            return
        if pend_cab and ver is not None:
            o = len(limpa("".join(buf).replace(NOTA, "")))
            for h in pend_cab:
                registra_cab(cap, ver, o, h)
            pend_cab = []
        buf.append(t)

    for linha in bruto.split("\n"):
        if not linha.strip():
            continue
        linha = texto_inline(linha)       # \nd, \it etc. resolvidos antes de separar parágrafos e versos
        # cada linha pode ter vários marcadores; quebra nos marcadores de parágrafo/verso/capítulo
        partes = re.split(r"(\\(?:c|v)\s+\d+[a-z]?(?:-\d+)?\s?|\\[a-z]+[0-9]?(?=\s|$))", linha)
        i = 0
        while i < len(partes):
            p = partes[i]
            m = re.match(r"\\(c|v)\s+(\d+)(?:-(\d+))?", p or "")
            mm = re.match(r"\\([a-z]+[0-9]?)$", p or "")
            if m:
                if m.group(3):
                    avisos.append(f"{meta.get('id')}: versículos combinados {p.strip()} (não tratado)")
                n = int(m.group(2))
                if m.group(1) == "c":
                    fecha(); cap, ver, buf = n, None, []
                else:
                    fecha(); ver, buf = n, []
                    if pend_cab:
                        for h in pend_cab:
                            registra_cab(cap, ver, 0, h)
                        pend_cab = []
                i += 1
                continue
            if mm:
                marca = mm.group(1)
                resto = partes[i + 1] if i + 1 < len(partes) else ""
                if marca in META:
                    meta[marca] = resto.strip()
                    i += 2
                    continue
                if marca == "d":
                    t = limpa(texto_inline(resto).replace(NOTA, ""))
                    for _ in range(resto.count(NOTA)):
                        next(fila_notas)          # notas de título de salmo: descartadas com aviso
                        avisos.append(f"{meta.get('id')} {cap}: nota em título de salmo descartada")
                    if ver is None:
                        titulos[str(cap)] = t
                    else:
                        pend_cab.append(t)
                    i += 2
                    continue
                if marca in CABECALHO:
                    t = limpa(texto_inline(resto).replace(NOTA, ""))
                    for _ in range(resto.count(NOTA)):
                        tn, _k = next(fila_notas)
                        t += " [" + tn + "]"
                    if t:
                        pend_cab.append(t)
                    i += 2
                    continue
                if marca in PARAGRAFO:
                    i += 1
                    continue
                if marca == "c" or marca == "v":
                    i += 1
                    continue
                avisos.append(f"{meta.get('id')}: marcador desconhecido \\{marca}")
                i += 1
                continue
            if p:
                adiciona_texto(texto_inline(p) + " ")
            i += 1
    fecha()

    livro_id = meta.get("id", "").split()[0]
    lista = []
    for c in range(1, max(caps) + 1):
        vs = caps.get(c, {})
        if not vs:
            avisos.append(f"{livro_id}: capítulo {c} ausente"); lista.append([]); continue
        n = max(vs)
        for v in range(1, n + 1):
            if v not in vs:
                avisos.append(f"{livro_id} {c}:{v} ausente")
            elif not vs[v]:
                avisos.append(f"{livro_id} {c}:{v} vazio")
        lista.append([vs.get(v, "") for v in range(1, n + 1)])
    lv = {"id": livro_id, "nome": meta.get("h", livro_id), "nomeLongo": meta.get("toc1", meta.get("h", livro_id)),
          "abrev": meta.get("toc3", livro_id), "caps": lista}
    if titulos: lv["titulos"] = titulos
    if notas: lv["notas"] = notas
    if cab: lv["cab"] = cab
    return lv, avisos


def main():
    origem, destino, vid, sigla, nome, arq_meta = sys.argv[1:7]
    extra = json.load(open(arq_meta, encoding="utf-8"))
    os.makedirs(destino, exist_ok=True)
    livros, avisos = {}, []
    for f in sorted(os.listdir(origem)):
        if f.lower().endswith((".usfm", ".sfm")):
            lv, av = converter_livro(os.path.join(origem, f))
            if lv["id"] in ORDEM:
                livros[lv["id"]] = lv; avisos += av
    faltam = [b for b in ORDEM if b not in livros]
    if faltam:
        sys.exit(f"Livros faltando: {faltam}")
    indice, total = [], 0
    for n, b in enumerate(ORDEM):
        lv = livros[b]
        json.dump(lv, open(os.path.join(destino, b + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        nv = [len(c) for c in lv["caps"]]; total += sum(nv)
        indice.append({"id": b, "nome": lv["nome"], "abrev": lv["abrev"], "nomeLongo": lv["nomeLongo"], "test": "AT" if n < 39 else "NT", "versos": nv})
    meta = dict(extra, id=vid, sigla=sigla, nome=nome, totalVersiculos=total, livros=indice)
    json.dump(meta, open(os.path.join(destino, "indice.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("versiculos", total, "avisos", len(avisos))
    for a in avisos[:60]:
        print("  ", a)


if __name__ == "__main__":
    main()
