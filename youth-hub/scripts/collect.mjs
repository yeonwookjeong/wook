// Collects open notices from public APIs into src/data/collected/<source>.json, in the shape of src/lib/items.ts Item.
// Run: DATA_GO_KR_KEY=... npm run collect   (the key comes from data.go.kr after 활용신청; never commit it)
// Each source is its own function; one failing source keeps its last file and does not stop the others.
import { writeFile, mkdir } from "node:fs/promises";

const OUT = new URL("../src/data/collected/", import.meta.url);
const KEY = process.env.DATA_GO_KR_KEY ?? "";
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

// "20261120" → "2026-11-20"
const ymd = (s) => (/^\d{8}$/.test(s ?? "") ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : null);

const REGION_SHORT = {
  서울: "서울", 경기: "경기", 인천: "인천", 강원: "강원", 충청북: "충북", 충북: "충북", 충청남: "충남", 충남: "충남",
  대전: "대전", 세종: "세종", 전라북: "전북", 전북: "전북", 전라남: "전남", 전남: "전남", 광주: "광주",
  경상북: "경북", 경북: "경북", 경상남: "경남", 경남: "경남", 대구: "대구", 울산: "울산", 부산: "부산", 제주: "제주",
};
const regionsOf = (text = "") => {
  const found = new Set();
  for (const [k, v] of Object.entries(REGION_SHORT)) if (text.includes(k)) found.add(v);
  return found.size ? [...found] : ["전국"];
};

// 잡알리오 공공기관 채용정보 (기획재정부, data.go.kr). Field names follow the API's 활용가이드;
// check them against the guide once the key is issued and adjust here if any differ.
async function alio() {
  const url = new URL("https://apis.data.go.kr/1051000/recruitment/list");
  url.searchParams.set("serviceKey", KEY);
  url.searchParams.set("resultType", "json");
  url.searchParams.set("numOfRows", "500");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("ongoingYn", "Y");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`alio HTTP ${res.status}`);
  const body = await res.json();
  const rows = body?.result ?? body?.response?.body?.items ?? [];
  if (!Array.isArray(rows)) throw new Error("alio: unexpected response shape");

  return rows.map((r) => {
    const hire = r.hireTypeNmLst ?? "";
    const n = Number(r.recrutNope) || null;
    return {
      id: `alio-${r.recrutPblntSn}`,
      category: "job",
      title: r.recrutPbancTtl,
      org: r.instNm,
      summary: [r.recrutSeNm, r.acbgCondNmLst, r.ncsCdNmLst].filter(Boolean).join(" · "),
      benefit: `${hire.split(",")[0] || "채용"}${n ? ` ${n}명` : ""}`,
      valueKrw: null,
      regions: regionsOf(r.workRgnNmLst),
      ages: null,
      method: "screening",
      effort: 3,
      start: ymd(r.pbancBgngYmd),
      end: ymd(r.pbancEndYmd),
      url: r.srcUrl || `https://job.alio.go.kr/recruitview.do?idx=${r.recrutPblntSn}`,
      tags: [
        /학력무관/.test(r.acbgCondNmLst ?? "") && "학력무관",
        /정규직/.test(hire) && "정규직",
        /인턴/.test(hire) && "인턴",
      ].filter(Boolean),
      // A person writes the real hook for the cards worth it; until then a plain one from the data.
      hook: `${r.instNm} ${r.recrutSeNm ?? ""} 모집`.trim(),
      pick: false,
      updated: today,
    };
  }).filter((it) => it.id && it.title && (!it.end || it.end >= today));
}

const sources = { "job-alio": alio };

await mkdir(OUT, { recursive: true });
let failed = 0;
for (const [name, fn] of Object.entries(sources)) {
  if (!KEY) { console.log(`skip ${name}: DATA_GO_KR_KEY is not set`); continue; }
  try {
    const items = await fn();
    await writeFile(new URL(`${name}.json`, OUT), JSON.stringify(items, null, 2) + "\n");
    console.log(`${name}: ${items.length} items`);
  } catch (e) {
    failed++;
    console.error(`${name} failed, keeping the last file:`, e.message);
  }
}
process.exit(failed ? 1 : 0);
