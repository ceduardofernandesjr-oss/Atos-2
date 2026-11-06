import json, glob, re, sys, collections, os
def palavras(pasta):
    c = collections.Counter()
    for f in glob.glob(os.path.join(pasta, '*.json')):
        if f.endswith('indice.json'): continue
        j = json.load(open(f, encoding='utf-8'))
        textos = [t for cap in j['caps'] for t in cap]
        for k in ('notas', 'cab'):
            for lst in (j.get(k) or {}).values(): textos += [x['t'] for x in lst]
        textos += list((j.get('titulos') or {}).values())
        for t in textos:
            for w in re.findall(r"[A-Za-zÀ-ÿ']+(?:-[A-Za-zÀ-ÿ']+)*", t): c[w] += 1
    return c
if __name__ == '__main__':
    out = {}
    for v in sys.argv[2:]: out[v] = palavras(os.path.join(sys.argv[1], v))
    json.dump({k: dict(v) for k, v in out.items()}, open('/home/claude/grafia/vocab.json', 'w'), ensure_ascii=False)
    for k, v in out.items(): print(k, len(v), sum(v.values()))
