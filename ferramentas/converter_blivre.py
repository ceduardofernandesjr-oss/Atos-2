"""Converte os arquivos-fonte f4 da Bíblia Livre (repositório oficial blivre/BibliaLivre,
pasta textos/f4/tr) em JSON por livro para o ATOS 2.

Uso: python3 -I converter_blivre.py <pasta_geral> <pasta_saida> <data_versao>
(pasta_geral = textos/f4/geral; a edição Textus Receptus é selecionada aqui, ver filtrar_condicional)

Formato de saída (um arquivo por livro, <ID>.json):
  { "id": "GEN", "nome": "Gênesis", "nomeLongo": "...", "abrev": "Gn",
    "caps": [ [ "texto v1", "texto v2", ... ], ... ],      # caps[c-1][v-1]
    "titulos": { "3": "Salmo de Davi..." },                  # títulos de salmos (não numerados)
    "notas": { "1:6": [ {"t": "Ou: ...", "k": "expansão", "o": 37} ] },  # notas do tradutor
    "refs": { "2:9": ["Isaías 64:4"] } }                     # referências de citação
Palavras acrescentadas pelos tradutores (itálico nas edições impressas) ficam entre { }.
Nenhuma palavra do texto é alterada: só espaços em excesso são normalizados.
"""
import json, os, re, sys

ORDEM = ("GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM "
         "EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL "
         "1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV").split()


def sem_chaves(s):
    """Chaves soltas nos arquivos-fonte (ex.: Mc 14:70, Rm 16:20) não são texto; as chaves da
    saída são reservadas para marcar palavras acrescentadas."""
    return s.replace("{", "").replace("}", "")


def limpa(s):
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"([“‘(])\s+", r"\1", s)
    s = re.sub(r"\s+([,.;:!?)])", r"\1", s)
    s = re.sub(r"\{\s+", "{", s)
    s = re.sub(r"\s+\}", "}", s)
    return s.strip()


# Correções de MARCAÇÃO nos arquivos-fonte (nenhuma palavra é alterada).
# Cada correção confere o trecho exato; se a fonte mudar, a conversão para com erro.
CORRECOES = {
    # Mc 5:19 — falta o marcador do versículo; o texto do v. 19 ficou colado ao v. 18.
    "mar.txt": [(["E quando ele entrava no barco, o que estivera endemoninhado rogou-lhe que estivesse com ele.", "Porém "],
                 ["E quando ele entrava no barco, o que estivera endemoninhado rogou-lhe que estivesse com ele.", "\\v Mc.5.19", "Porém "])],
    "luc.txt": [# Lc 14:4 — segunda nota fechada com "\fn" em vez de "\*fn".
                (["\\fn", "Lit. tomando-o", "\\fn"], ["\\fn", "Lit. tomando-o", "\\*fn"])],
    # Jo 16:14 — acréscimo aberto duas vezes; palavras mantidas, itálico em "que é meu" e "o".
    "joao.txt": [(["Ele me glorificará, porque receberá do ", "\\added", "que é meu, e ", "\\added ", " o", "\\*added"],
                  ["Ele me glorificará, porque receberá do ", "\\added", "que é meu", "\\*added", ", e ", "\\added", "o", "\\*added"])],
}
# Sl 144:14 — nota aberta no lugar errado e acréscimo sem fechamento.
CORRECOES["sal.txt"] = [(["\\*added,", "\\fn", ", nem saídas ", "\\added", " ao cativeiro,", "\\fn"],
                         ["\\*added", ", nem saídas ", "\\added", "ao cativeiro", "\\*added", ",", "\\fn"])]
# Versículos sem texto nos arquivos-fonte atuais (não preenchidos com outra revisão).
SEM_TEXTO = {("ACT", 28, 29): "O texto deste versículo não consta nos arquivos-fonte atuais da Bíblia Livre "
                               "(edição Textus Receptus). Ele não foi preenchido a partir de outra revisão "
                               "para não misturar edições."}

# Avisos sobre prováveis erros de digitação da fonte: o texto NÃO é alterado, só recebe uma nota.
AVISOS = {("GEN", 19, 26): ("sai", "Nos arquivos-fonte da Bíblia Livre consta “estátua de sai”, provável erro de digitação; "
                                   "as edições de Almeida trazem “estátua de sal”. O texto foi mantido como está na fonte."),
          ("GEN", 14, 20): ("mão.", "Nos arquivos-fonte da Bíblia Livre falta o final deste versículo, presente no hebraico e nas outras traduções: "
                                    "“E deu-lhe o dízimo de tudo” (Almeida 1911). O texto foi mantido como está na fonte.")}


MARCADORES_TR = {"tr", "trnc"}
GRAFIAS = {"tnrc": "trnc", "tn": "tr", "pr": "rp"}   # variações encontradas nos arquivos-base
ABRE = ("\\fn",)   # só notas: o conteúdo de \\added condicional é texto comum (muda só o itálico)


def filtrar_condicional(linhas, marcadores=MARCADORES_TR):
    """Gera a edição a partir dos arquivos-base (pasta geral), corrigindo o gerador oficial:
    - "{a|b}texto": o texto (até o fim da linha) só entra se algum marcador estiver na edição;
      o que vem antes do marcador na mesma linha é comum a todas as edições;
    - "{a: texto}": só o trecho entre chaves é condicional; o resto da linha é mantido;
    - nota excluída ({n4}\\fn) é pulada inteira até o fechamento,
      inclusive linhas de continuação sem marcador (o gerador oficial as deixava vazar no texto)."""
    def tags(s):
        return {GRAFIAS.get(t.strip(), t.strip()) for t in s.split("|")}
    out, pular = [], None
    for l in linhas:
        if pular:
            if re.match(r"^(?:\{[^}:]*\})?\\\*" + re.escape(pular) + r"\b", l):
                pular = None
            continue
        # trechos inline "{tags: texto}"
        l = re.sub(r"\{([a-z0-9|]+):\s?([^}]*)\}", lambda m: m.group(2) if tags(m.group(1)) & marcadores else "", l)
        m = re.search(r"\{([a-z0-9|]+)\}", l)
        if not m:
            out.append(l)
            continue
        antes, depois = l[:m.start()], l[m.end():]
        if tags(m.group(1)) & marcadores:
            out.append(antes + depois)
        else:
            if antes.strip():
                out.append(antes)
            d = depois.strip()
            for a in ABRE:
                if d == a:
                    pular = a[1:]
                    break
    return out


def aplica_correcoes(nome, linhas):
    for antes, depois in CORRECOES.get(nome, []):
        achou = [k for k in range(len(linhas) - len(antes) + 1) if [x.rstrip() for x in linhas[k:k + len(antes)]] == [x.rstrip() for x in antes]]
        if len(achou) != 1:
            sys.exit(f"Correção de {nome} não encontrada exatamente uma vez ({len(achou)}): {antes[:2]}")
        k = achou[0]
        linhas[k:k + len(antes)] = depois
    return linhas


def ler_fonte(caminho):
    """Lê um arquivo-base (pasta geral) e devolve as linhas da edição Textus Receptus já corrigidas."""
    linhas = open(caminho, encoding="utf-8-sig").read().replace("\r", "").split("\n")
    return aplica_correcoes(os.path.basename(caminho), filtrar_condicional(linhas))


def converter(caminho):
    linhas = ler_fonte(caminho)
    meta, i = {}, 0
    caps, titulos, notas, refs = {}, {}, {}, {}
    cap = ver = None
    buf = []          # pedaços do versículo atual
    titulo_pendente = None
    avisos = []

    def fecha():
        if cap is not None:
            caps.setdefault(cap, {})[ver] = limpa("".join(buf))

    def fechamento(l, marca):
        m = re.match(r"\\?\*" + re.escape(marca) + r"(?![\w-])(.*)$", l)
        return m.group(1) if m else None

    def bloco(marca, j):
        """Lê o conteúdo de \\marca até \\*marca (tolerante a fechamento ausente).
        Texto colado depois do fechamento (ex.: "\\*added,") volta ao versículo."""
        out = []
        while j < len(linhas):
            l = linhas[j]
            resto = fechamento(l, marca)
            if resto is not None:
                if resto.strip():
                    linhas[j] = resto
                    return " ".join(out), j
                return " ".join(out), j + 1
            if l.startswith("\\v ") or (l.startswith("\\") and not l.startswith("\\key") and not l.startswith("\\*key") and marca != "fn"):
                avisos.append(f"{os.path.basename(caminho)}:{j+1}: \\{marca} sem fechamento")
                return " ".join(out), j
            if marca == "fn" and l.startswith("\\v "):
                avisos.append(f"{os.path.basename(caminho)}:{j+1}: \\fn sem fechamento")
                return " ".join(out), j
            out.append(l)
            j += 1
        return " ".join(out), j

    while i < len(linhas):
        l = linhas[i]
        m = re.match(r"\\(name-long|name-short|abbreviation|ubs-code)\s*$", l.strip())
        if m:
            meta[m.group(1)] = linhas[i + 1].strip()
            i += 2
            continue
        if l.startswith("\\*") and l.strip()[2:] in ("name-long", "name-short", "abbreviation", "ubs-code"):
            i += 1
            continue
        m = re.match(r"\\v\s+(\w+)\.(\d+)\.(\d+)\s*(.*)$", l)
        if m:
            fecha()
            cap, ver = int(m.group(2)), int(m.group(3))
            buf = [m.group(4) + " "] if m.group(4) else []
            if titulo_pendente and ver == 1:
                titulos[str(cap)] = titulo_pendente
            titulo_pendente = None
            i += 1
            continue
        if l.startswith("\\added"):
            txt, i = bloco("added", i + 1)
            buf.append("{" + limpa(sem_chaves(txt)) + "}")
            continue
        if l.startswith("\\fn"):
            j, chave_, corpo = i + 1, None, []
            while j < len(linhas) and fechamento(linhas[j], "fn") is None and not linhas[j].startswith("\\v "):
                if linhas[j].startswith("\\key"):
                    chave_ = linhas[j + 1].strip()
                    j += 3 if j + 2 < len(linhas) and linhas[j + 2].startswith("\\*key") else 2
                    continue
                corpo.append(linhas[j])
                j += 1
            if j < len(linhas) and fechamento(linhas[j], "fn") is not None:
                resto = fechamento(linhas[j], "fn")
                if resto.strip():
                    linhas[j] = resto
                else:
                    j += 1
            else:
                avisos.append(f"{os.path.basename(caminho)}:{i+1}: \\fn sem fechamento")
            nota = {"t": limpa(" ".join(corpo)), "o": len(limpa("".join(buf)))}
            if chave_:
                nota["k"] = chave_
            if cap is not None:
                notas.setdefault(f"{cap}:{ver}", []).append(nota)
            i = j
            continue
        if l.startswith("\\ref"):
            txt, i = bloco("ref", i + 1)
            if cap is not None:
                refs.setdefault(f"{cap}:{ver}", []).append(limpa(txt))
            continue
        if l.startswith("\\psalm-title"):
            txt, i = bloco("psalm-title", i + 1)
            titulo_pendente = limpa(txt)
            continue
        if l.startswith("\\") and l.strip():
            avisos.append(f"{os.path.basename(caminho)}:{i+1}: marcador desconhecido {l[:20]!r}")
            i += 1
            continue
        if cap is not None:
            buf.append(sem_chaves(l) + " ")
        i += 1
    fecha()

    # monta matriz, conferindo sequência contínua de capítulos e versículos
    lista = []
    for c in range(1, max(caps) + 1):
        if c not in caps:
            avisos.append(f"{meta.get('ubs-code')}: capítulo {c} ausente")
            lista.append([])
            continue
        vs = caps[c]
        n = max(vs)
        for v in range(1, n + 1):
            if v not in vs:
                avisos.append(f"{meta.get('ubs-code')} {c}:{v} ausente")
            elif not vs[v]:
                if (meta.get("ubs-code"), c, v) in SEM_TEXTO:
                    notas.setdefault(f"{c}:{v}", []).insert(0, {"t": SEM_TEXTO[(meta["ubs-code"], c, v)], "o": 0, "editorial": True})
                else:
                    avisos.append(f"{meta.get('ubs-code')} {c}:{v} vazio")
            if v in vs and (meta.get("ubs-code"), c, v) in AVISOS:
                palavra, aviso = AVISOS[(meta["ubs-code"], c, v)]
                texto_v = vs[v]
                pos = texto_v.rfind(palavra) + len(palavra) if palavra in texto_v else len(texto_v)
                notas.setdefault(f"{c}:{v}", []).append({"t": aviso, "o": pos, "editorial": True})
        lista.append([vs.get(v, "") for v in range(1, n + 1)])
    livro = {"id": meta["ubs-code"], "nome": meta["name-short"], "nomeLongo": meta["name-long"],
             "abrev": meta["abbreviation"], "caps": lista}
    if titulos: livro["titulos"] = titulos
    if notas: livro["notas"] = notas
    if refs: livro["refs"] = refs
    return livro, avisos


def main():
    origem, destino, data_versao = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(destino, exist_ok=True)
    livros, todos_avisos = {}, []
    for nome in sorted(os.listdir(origem)):
        if nome.endswith(".txt") and "\\ubs-code" in open(os.path.join(origem, nome), encoding="utf-8-sig").read(3000):
            livro, av = converter(os.path.join(origem, nome))
            livros[livro["id"]] = livro
            todos_avisos += av
    faltando = [b for b in ORDEM if b not in livros]
    if faltando or len(livros) != 66:
        sys.exit(f"Livros faltando: {faltando}")
    indice = []
    total = 0
    for n, b in enumerate(ORDEM):
        lv = livros[b]
        with open(os.path.join(destino, b + ".json"), "w", encoding="utf-8") as f:
            json.dump(lv, f, ensure_ascii=False, separators=(",", ":"))
        nv = [len(c) for c in lv["caps"]]
        total += sum(nv)
        indice.append({"id": b, "nome": lv["nome"], "abrev": lv["abrev"], "nomeLongo": lv["nomeLongo"],
                       "test": "AT" if n < 39 else "NT", "versos": nv})
    meta = {
        "id": "blivre", "sigla": "BLIVRE", "nome": "Bíblia Livre",
        "edicao": "Textus Receptus — arquivos-fonte de " + data_versao,
        "base": "Revisão da tradução de João Ferreira de Almeida (edição de 1819)",
        "licenca": "Creative Commons Atribuição 3.0 Brasil",
        "licencaUrl": "https://creativecommons.org/licenses/by/3.0/br/",
        "credito": "Bíblia Livre (BLIVRE), Copyright © Diego Santos, Mario Sérgio e Marco Teles, "
                   "https://sites.google.com/site/biblialivre/ — arquivos-fonte de " + data_versao +
                   ". Licença Creative Commons Atribuição 3.0 Brasil. Reprodução permitida desde que "
                   "devidamente mencionados fonte e autores.",
        "fonte": "https://github.com/blivre/BibliaLivre",
        "alteracoes": "Convertido para JSON pelo ATOS 2 sem alteração de palavras; espaços normalizados; "
                      "palavras acrescentadas marcadas entre chaves para exibição em itálico.",
        "totalVersiculos": total, "livros": indice}
    with open(os.path.join(destino, "indice.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))
    print("versiculos", total)
    print("avisos", len(todos_avisos))
    for a in todos_avisos:
        print("  ", a)


if __name__ == "__main__":
    main()
