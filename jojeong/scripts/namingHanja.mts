// Builds lib/naming/hanja.tsv: every 인명용 한자 with what naming needs (docs/naming-study.md, 11장).
// Inputs (not kept in the repo, see lib/naming/SOURCES.md):
//   1. data-gov.csv from github.com/rutopio/Korean-Name-Hanja-Charset (MIT): the Supreme Court list, one row per reading
//   2. moji.db from npm @mandel59/mojidata: Unicode Unihan (kRSUnicode, kTotalStrokes, kDefinition, kKoreanEducationHanja)
// Run: npx tsx scripts/namingHanja.mts <data-gov.csv> <moji.db>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const [csvPath, dbPath] = process.argv.slice(2);
if (!csvPath || !dbPath) {
  console.error("usage: npx tsx scripts/namingHanja.mts <data-gov.csv> <moji.db>");
  process.exit(1);
}

// 강희 부수 214개의 본래 획수 (원획법의 바탕)
const RAD_STROKES: number[] = [];
for (const [a, b, s] of [[1, 6, 1], [7, 29, 2], [30, 60, 3], [61, 94, 4], [95, 117, 5], [118, 146, 6], [147, 166, 7], [167, 175, 8], [176, 186, 9], [187, 194, 10], [195, 200, 11], [201, 204, 12], [205, 208, 13], [209, 210, 14], [211, 211, 15], [212, 213, 16], [214, 214, 17]])
  for (let i = a; i <= b; i++) RAD_STROKES[i] = s;

// 자원오행 (0木 1火 2土 3金 4水). sure: 부수만으로 작명 사전들이 같은 말을 하는 것.
// 日→火, 玉→金은 흔하지만 갈리는 사전이 있어 sure가 아님. 나머지 부수는 미정(-)으로 두고 추천에 쓰지 않는다.
const SURE: Record<number, number> = { 75: 0, 140: 0, 118: 0, 115: 0, 120: 0, 86: 1, 32: 2, 46: 2, 102: 2, 167: 3, 112: 3, 85: 4, 173: 4, 15: 4 };
const COMMON: Record<number, number> = { 72: 1, 96: 3 };
const EL = "木火土金水";

// 영어 뜻의 첫 뜻(; 앞)에 이런 말이 있으면 이름 후보에서 뺀다 (사람 검수 전 1차 거르기).
// 뜻이 둘인 말(fall=가을, cold, lie, low, mean)은 넣지 않는다: 秋·泊 같은 좋은 글자가 걸린다
const NEG = /\b(death|die|dies|dead|corpse|ghost|demon|devil|disease|sick|illness|ill|pain|poison|thief|steal|rob|evil|wicked|bad|ugly|stupid|foolish|crazy|mad|filth|dirty|excrement|urine|grave|tomb|funeral|mourn|weep|cry|sorrow|grief|sad|lonely|widow|orphan|poor|poverty|beggar|prison|punish|crime|kill|murder|slaughter|war|fight|battle|enemy|curse|disaster|calamity|misfortune|ruin|destroy|decay|rot|rotten|wither|perish|fail|lose|loss|shame|disgrace|hate|anger|angry|fear|afraid|false|deceive|cheat|lewd|obscene|insect|worm|snake|rat|pig|dog|blood|wound|injure|harm|slave|servant|vulgar|empty|lack|bitter|perverse|rebel|betray)\b/i;

const NUMERALS = new Set([..."一二三四五六七八九十"]);

// CSV: hangul,consonant,unicode,hanja (한 글자의 음이 여럿이면 줄이 여럿이거나 한 칸에 "가,하")
const readings = new Map<string, Set<string>>();
for (const line of readFileSync(csvPath, "utf8").split(/\r?\n/).slice(1)) {
  if (!line.trim()) continue;
  // 음이 여럿인 칸은 따옴표로 묶여 있다: "도,탁",ㄷ,...
  const cells = [...line.matchAll(/("([^"]*)"|[^,]*)(,|$)/g)].map((m) => m[2] ?? m[1]).slice(0, 4);
  const hanja = (cells[3] ?? "").trim();
  if (!hanja) continue;
  // CJK 호환 한자(F900–FAFF 등)는 같은 글자의 통합 코드로 합쳐 본다
  const ch = hanja.normalize("NFC");
  if (!readings.has(ch)) readings.set(ch, new Set());
  for (const sound of cells[0].split(",")) if (sound.trim()) readings.get(ch)!.add(sound.trim());
}

// node:sqlite는 Node 22부터 있고 프로젝트의 @types/node(20)에는 없어서, 사이트 빌드의 타입 검사에 걸리지 않게 이름을 조립해 불러온다
type Sqlite = { DatabaseSync: new (path: string, opts: { readOnly: boolean }) => { prepare(sql: string): { get(...args: unknown[]): unknown } } };
const { DatabaseSync }: Sqlite = await import("node:" + "sqlite");
const db = new DatabaseSync(dbPath, { readOnly: true });
const one = (table: string) => {
  const st = db.prepare(`select value from ${table} where UCS = ?`);
  return (ch: string) => (st.get(ch) as { value: string } | undefined)?.value ?? null;
};
const rsOf = one("unihan_kRSUnicode");
const totalOf = one("unihan_kTotalStrokes");
const defOf = one("unihan_kDefinition");
const eduOf = one("unihan_kKoreanEducationHanja");

type Row = { ch: string; ko: string; rad: number; won: number; pil: number; el: string; sure: number; edu: number; neg: number; num: number; pool: number; def: string };
const rows: Row[] = [];
let missing = 0;
for (const [ch, sounds] of readings) {
  const rs = rsOf(ch);
  const tot = totalOf(ch);
  if (!rs || !tot) {
    missing++;
    continue;
  }
  const [radPart, restPart] = rs.split(" ")[0].split(".");
  const rad = Number(radPart.replace(/'+$/, ""));
  const rest = Number(restPart);
  const pil = Number(tot.split(" ")[0]);
  // 원획: 부수를 본래 획수로 센다 (氵=4, 扌=4, 艹=6, 阝=7·8, 辶=7 …). 글자 자체가 부수(나머지 0)면 보이는 획수 그대로 (王=4)
  const won = rest === 0 ? pil : Math.max(pil, RAD_STROKES[rad] + rest);
  const sureEl = SURE[rad];
  const commonEl = COMMON[rad];
  const el = sureEl !== undefined ? EL[sureEl] : commonEl !== undefined ? EL[commonEl] : "-";
  const def = (defOf(ch) ?? "").replace(/[\t"]/g, " ").trim();
  const edu = eduOf(ch) ? 1 : 0;
  const neg = NEG.test(def.split(";")[0]) ? 1 : 0;
  const sure = sureEl !== undefined ? 1 : 0;
  // pool 1: 교육용 한자(친숙함) + 자원오행 있음 + 뜻 무난 → 먼저 쓰는 후보
  // pool 2: 교육용은 아니지만 이름에 흔히 쓰일 만한 글자(필획 17 이하) → 사람 검수 뒤에 쓰는 후보
  const ok = el !== "-" && !neg;
  const pool = ok && edu ? 1 : ok && pil <= 17 ? 2 : 0;
  rows.push({ ch, ko: [...sounds].join("/"), rad, won, pil, el, sure, edu, neg, num: NUMERALS.has(ch) ? 1 : 0, pool, def });
}
rows.sort((a, b) => a.ko.localeCompare(b.ko, "ko") || a.ch.localeCompare(b.ch));

const head = "ch\tko\trad\twon\tpil\tel\tsure\tedu\tneg\tnum\tpool\tdef";
const body = rows.map((r) => [r.ch, r.ko, r.rad, r.won, r.pil, r.el, r.sure, r.edu, r.neg, r.num, r.pool, r.def].join("\t"));
mkdirSync(new URL("../lib/naming/", import.meta.url), { recursive: true });
writeFileSync(new URL("../lib/naming/hanja.tsv", import.meta.url), [head, ...body].join("\n") + "\n");

const count = (f: (r: Row) => boolean) => rows.filter(f).length;
console.log(`인명용 ${readings.size}자 → 표 ${rows.length}자 (Unihan에 없음 ${missing})`);
console.log(`자원오행 확실 ${count((r) => r.sure === 1)} · 흔한 기준(日·玉) ${count((r) => r.el !== "-" && !r.sure)} · 미정 ${count((r) => r.el === "-")}`);
console.log(`교육용 ${count((r) => r.edu === 1)} · 부정적 뜻 ${count((r) => r.neg === 1)} · 후보 1군 ${count((r) => r.pool === 1)} · 2군 ${count((r) => r.pool === 2)}`);
for (let e = 0; e < 5; e++) console.log(`  ${EL[e]}: 1군 ${count((r) => r.pool === 1 && r.el === EL[e])} · 2군 ${count((r) => r.pool === 2 && r.el === EL[e])}`);
