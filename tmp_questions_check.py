import re, os, math
root = r"C:\Users\HP\Documents\GiithubREPOSITORIES\CODEX\opus-dei-quiz\src"
files = ["questions.ts","questions_alvaro.ts","questions_javier.ts","questions_guadalupe.ts"]
items = []
for f in files:
    path = os.path.join(root, f)
    with open(path, encoding='utf-8') as fh:
        data = fh.read()
    for m in re.finditer(r'text:\s*"(.*?)"', data):
        text = m.group(1).strip()
        norm = re.sub(r"[^a-z0-9]+"," ", text.lower()).strip()
        tokens = set(norm.split())
        items.append((f, text, tokens))

# find near-duplicates within and across files
pairs = []
for i in range(len(items)):
    f1, t1, tok1 = items[i]
    for j in range(i+1, len(items)):
        f2, t2, tok2 = items[j]
        # skip cross if totally different token counts
        inter = len(tok1 & tok2)
        union = len(tok1 | tok2)
        if union == 0: continue
        jacc = inter/union
        if jacc >= 0.75:
            pairs.append((jacc, f1, t1, f2, t2))

pairs.sort(reverse=True, key=lambda x: x[0])
print("NEAR DUPLICATES:")
for jacc, f1, t1, f2, t2 in pairs:
    print(f"{jacc:.2f} :: {t1} [{f1}] <-> {t2} [{f2}]")
