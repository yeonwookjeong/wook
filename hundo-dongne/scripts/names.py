"""지명 한자 → 이름 속 기운(src/data/names.json).

사용: python3 -I scripts/names.py
scripts/placehanja.txt: 시군구 코드와 그 이름의 한자(시, 군, 구 글자는 빼고, 일반구는 구 이름만). 사람이 적은 표라,
돌릴 때마다 jojeong/lib/naming/hanja.tsv(대법원 인명용 한자)의 음과 한 글자씩 맞춰 보고 틀리면 멈춘다.
오행은 같은 표의 자원오행(el)이다. 오행이 없는 글자(中, 光 등)는 이름 기운에 넣지 않는다.
"""
import csv, json, sys

ALT = {"노": "로", "나": "라", "낙": "락", "녀": "려", "니": "리", "이": "리", "여": "려", "영": "령", "양": "량", "예": "례",
       "유": "류", "육": "륙", "윤": "륜", "율": "률", "연": "련", "열": "렬", "염": "렴", "엽": "렵", "용": "룡", "요": "료",
       "임": "림", "인": "린", "입": "립", "내": "래", "능": "릉", "논": "론", "농": "롱", "누": "루", "낭": "랑", "남": "람", "녹": "록"}
EL = {"木": 0, "火": 1, "土": 2, "金": 3, "水": 4}

H = {r["ch"]: r for r in csv.DictReader(open("../jojeong/lib/naming/hanja.tsv"), delimiter="\t")}
regions = {r["code"]: r["name"] for r in json.load(open("src/data/regions.json"))["regions"]}
table = dict(l.split() for l in open("scripts/placehanja.txt") if l.strip())
if set(table) != set(regions):
    sys.exit(f"codes differ: {set(table) ^ set(regions)}")


def core(name):
    n = name.split(" ")[-1]
    return n[:-1] if n[-1] in "시군구" and len(n) > 1 else n


out = {}
for code, hj in sorted(table.items()):
    ko = core(regions[code])
    if len(ko) != len(hj):
        sys.exit(f"{code} {regions[code]} {hj}: length")
    els = []
    for k, ch in zip(ko, hj):
        r = H.get(ch)
        reads = r["ko"].split("/") if r else []
        if not r or not (k in reads or ALT.get(k) in reads or any(ALT.get(x) == k for x in reads)):
            sys.exit(f"{code} {regions[code]}: {ch} is not read {k}")
        if r["el"] in EL:
            els.append(EL[r["el"]])
    out[code] = {"h": hj, "el": els}
json.dump(out, open("src/data/names.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), sum(1 for v in out.values() if v["el"]))
