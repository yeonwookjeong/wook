import {
  BLOOPERS,
  CHILDHOOD,
  CRISES,
  DARK_FAREWELL,
  DARK_FIRST,
  DARK_GOLDEN,
  DARK_PEOPLE,
  DARK_RESOLVE,
  DARK_SAGWAN,
  DARK_TURN,
  FAREWELL,
  FIRST_ACTS,
  GOLDEN,
  RESOLVE,
} from "./episodes";
import { josa } from "./josa";
import { chartOf, readChart } from "./myeongri";
import { isClash, isWonjin, lifespan, mix, ratings, reignTier, TIERS } from "./reign";
import type { Seat } from "./court";
import type { Pillars } from "./saju";

// Deterministic fictional chronicle: the same pillars always produce the same record.

const EPITHETS: string[][] = [
  ["태창", "개원", "홍업"],
  ["화평", "탕평", "중화"],
  ["광휘", "명성", "찬덕"],
  ["인혜", "명현", "자성"],
  ["안태", "중정", "태평"],
  ["애민", "혜민", "풍덕"],
  ["무열", "강단", "위무"],
  ["명철", "정명", "예성"],
  ["홍원", "광대", "해량"],
  ["지략", "현명", "심원"],
];

const ERAS: [string, string][] = [
  ["학문의 시대", "밤마다 궁궐 서고의 불이 꺼지지 않았다. 전하의 치세에 편찬된 책만 백 권이 넘는다."],
  ["개간의 시대", "황무지가 논밭으로 바뀌었다. 전하의 치세 동안 나라 곳간이 빈 해가 없었다."],
  ["개척의 시대", "북방으로 땅을 넓히고 새 고을을 세웠다. 새 땅으로 옮겨 가는 백성들이 전하의 이름을 불렀다."],
  ["문예가 꽃핀 시대", "전쟁 없는 봄날이 이어졌다. 한양 저잣거리에 책방과 화방이 두 배로 늘었다."],
  ["대개혁의 시대", "낡은 제도를 뜯어고쳤다. 반대가 거셌으나 훗날 사람들은 이 시대를 조선의 전환점이라 불렀다."],
  ["외교의 시대", "칼 대신 붓으로 나라를 지켰다. 사신단이 오갈 때마다 조선의 위상이 높아졌다."],
  ["부흥의 시대", "궁궐 밖까지 잔치 소리가 끊이지 않았다. 광대와 소리꾼이 가장 대접받던 시절이다."],
  ["풍요의 시대", "대풍년이 거듭되어 백성들이 배를 두드렸다. 쌀값이 가장 쌌던 시절로 기억된다."],
  ["발명의 시대", "장인들이 궁궐에 불려 와 새 기계를 만들었다. 물시계와 수레가 한층 정교해졌다."],
  ["법치의 시대", "흐트러진 법전을 새로 엮었다. 억울한 옥사가 크게 줄었다."],
  ["수호의 시대", "성곽을 높이 쌓고 군사를 길렀다. 전하의 치세에 국경을 넘은 외적은 없었다."],
  ["포용의 시대", "굶주린 백성에게 곳간을 열었다. 서얼과 천민에게도 길을 터준 너그러운 시절이었다."],
];

const SAGWAN = [
  "왕은 옳다고 믿는 일에는 물러섬이 없어, 신하들이 몇 번이나 엎드려 간했으나 끝내 뜻을 굽히지 않았다. 그 고집이 새 길을 열었다.",
  "왕은 어느 당에도 기울지 않아 양쪽 모두의 원망을 샀으나, 그 덕에 조정이 무너지지 않았다.",
  "왕이 드는 자리마다 웃음이 일었다. 다만 경연에 늦는 일이 잦아 사관이 여러 번 적었다.",
  "왕은 밤늦도록 상소를 읽고 일일이 답을 달았다. 신하들은 그 정성에 감복하면서도 잠이 모자라다 투덜댔다.",
  "왕은 말이 적고 움직임이 무거웠다. 급한 신하들은 답답해했으나, 큰일이 닥칠수록 왕의 침착함이 빛났다.",
  "왕은 궐 밖 백성의 밥상을 먼저 물었다. 수라상 반찬 가짓수를 스스로 줄인 일이 여러 번 기록에 남았다.",
  "왕은 결단이 빠르고 상벌이 분명했다. 두려워하는 신하가 많았으나, 탐관오리는 그보다 더 두려워했다.",
  "왕은 작은 허물도 그냥 넘기는 법이 없어 조정에 긴장이 가시지 않았으나, 그 덕에 나라의 기강이 섰다.",
  "왕은 늘 먼 곳을 보았다. 신하들이 당장의 일을 아뢰면 십 년 뒤의 일로 답하여 모두를 어리둥절하게 했다.",
  "왕은 속을 좀처럼 드러내지 않았다. 신하들은 왕의 뜻을 짐작하느라 애를 먹었으나, 돌이켜 보면 왕은 늘 한 수 앞에 있었다.",
];

// Paired with GOLDEN in episodes.ts: each nickname comes from that episode.
const COURT_NICKNAMES: [string, string][] = [
  ["직진 전하", "큰 나무 전하"],
  ["줄타기 전하", "버들 전하"],
  ["해님 전하", "잔치 전하"],
  ["야근 전하", "촛불 전하"],
  ["바위 전하", "느긋 전하"],
  ["살림꾼 전하", "어머니 전하"],
  ["칼날 전하", "호랑이 전하"],
  ["돋보기 전하", "깐깐 전하"],
  ["바다 전하", "꿈꾸는 전하"],
  ["여우 전하", "안개 전하"],
];

const PEOPLE: [string, string][] = [
  ["부지런한 임금님", "새벽닭보다 먼저 일어나 정사를 본다는 소문이 저잣거리에 돌았다."],
  ["우직한 임금님", "한번 한 말은 반드시 지킨다 하여, 장터 흥정에 ‘임금님 약속’이라는 말이 생겼다."],
  ["범 같은 임금님", "탐관오리가 전하의 이름만 들어도 도망친다는 노래가 아이들 사이에 퍼졌다."],
  ["다정한 임금님", "행차 때마다 길가 아이들에게 엿을 나눠 준다는 소문이 자자했다."],
  ["하늘이 내린 임금님", "즉위하던 날 오색구름이 떴다는 이야기가 팔도에 퍼졌다."],
  ["눈치 빠른 임금님", "암행어사보다 먼저 고을 사정을 안다 하여 수령들이 벌벌 떨었다."],
  ["바람 같은 임금님", "궁궐에 가만있질 않고 팔도를 누빈다 하여 붙은 이름이다."],
  ["순한 임금님", "백성의 억울한 사연에 눈물을 보였다는 이야기가 전해진다."],
  ["재주꾼 임금님", "직접 그린 그림을 몰래 장터에 내다 팔았다는 소문이 있다."],
  ["깔끔한 임금님", "행차 길을 쓸고 닦게 하여, 한양 거리가 가장 깨끗했던 시절로 기억된다."],
  ["의리의 임금님", "한번 믿은 신하는 끝까지 감쌌다 하여 ‘임금님 의리’라는 말이 생겼다."],
  ["복 많은 임금님", "치세 내내 풍년이 들어 ‘임금님 복이 나라 복’이라는 말이 돌았다."],
];

const OMENS = [
  "즉위하던 날 새벽, 궁궐 창고의 쥐들이 일제히 자취를 감추었다. 사람들은 곳간이 넘칠 징조라 수군댔다.",
  "즉위식 날, 황소 한 마리가 광화문 앞에 엎드려 끝내 비키지 않았다. 사람들은 우직한 치세의 징조라 했다.",
  "즉위하던 밤, 인왕산에서 범 울음소리가 세 번 들렸다.",
  "즉위하던 날, 궁궐 뜰에 때아닌 매화가 피었다.",
  "즉위식 날, 오색구름 사이로 용 모양 구름이 떠 도성 사람들이 모두 하늘을 올려다보았다.",
  "즉위하던 날 아침, 경회루 연못의 물이 거울처럼 맑았다.",
  "즉위식 날, 사복시의 말들이 일제히 울었다.",
  "즉위하던 해, 팔도에 대풍년이 들었다.",
  "즉위식 날 종일 내리던 비가, 행렬이 지나는 동안만 거짓말처럼 그쳤다.",
  "즉위하던 새벽, 궁궐 닭이 평소보다 한 시진이나 일찍 울었다.",
  "즉위식 날, 궁궐 문지기 개가 새 왕 앞에서만 꼬리를 흔들었다.",
  "즉위하던 해, 대궐 연못의 잉어가 곱절로 불어났다.",
];

// Age at death. 영조·태조·고종·광해군·정종 follow the figures cited in 황상익's study; others are computed from recorded birth and death dates.
const KING_AGES: [string, number][] = [
  ["영조", 82], ["태조", 72], ["광해군", 66], ["고종", 66], ["정종", 62], ["숙종", 58], ["중종", 56],
  ["선조", 55], ["태종", 54], ["인조", 53], ["세종", 52], ["순종", 52], ["세조", 50], ["정조", 47],
  ["순조", 44], ["효종", 39], ["문종", 37], ["성종", 37], ["경종", 35], ["명종", 33], ["현종", 33],
  ["철종", 32], ["인종", 30], ["연산군", 29], ["헌종", 21], ["예종", 19], ["단종", 16],
];

export const KING_AVG_LIFESPAN = 46.1;

export type Cast = { yeong?: string; gansin?: string; yubae?: string; witness?: string };

// Who from the court appears in the story: the chief minister, the traitor, the exile and one plain witness.
export function castOf(seats: Seat[]): Cast {
  return {
    yeong: seats.find((s) => s.role === "yeong")?.minister.name,
    gansin: seats.find((s) => s.role === "gansin")?.minister.name,
    yubae: seats.find((s) => s.role === "yubae")?.minister.name,
    witness: seats.find((s) => !["yeong", "gansin", "yubae"].includes(s.role))?.minister.name,
  };
}

// Where the age at death sits among the 27 real kings. Stated flatly: short lives are not softened.
function lifespanRank(death: number) {
  const older = KING_AGES.filter(([, age]) => age > death);
  const rank = older.length + 1;
  const younger = KING_AGES.filter(([, age]) => age < death).length;
  if (rank === 1) return { rank, note: "조선 최장수 왕 영조(82세)의 기록마저 넘어섰다." };
  const [aboveName, aboveAge] = older[older.length - 1];
  if (death >= 60) return { rank, note: `${aboveName}(${aboveAge}세) 다음가는 장수였다. 회갑을 넘긴 조선 왕은 다섯뿐이었다.` };
  if (death > KING_AVG_LIFESPAN) return { rank, note: `조선 왕 평균 수명 ${KING_AVG_LIFESPAN}세는 넘겼다.` };
  if (death >= 30) return { rank, note: `조선 왕 평균 수명 ${KING_AVG_LIFESPAN}세에 미치지 못했다.` };
  if (death === 16) return { rank, note: "조선 최단명 왕 단종과 같은 나이였다." };
  if (younger === 0) return { rank, note: "조선 최단명 왕 단종(16세)보다도 짧은 생이었다." };
  return { rank, note: `조선 27왕 가운데 이보다 짧게 산 왕은 ${younger}명뿐이다.` };
}

// Fills {key} and {key|particle} placeholders; "이/가"-style pairs pick by final consonant, others are appended.
function fill(text: string, vars: Record<string, string>) {
  return text.replace(/\{([^|}]+)(?:\|([^}]+))?\}/g, (_, key: string, particle?: string) => {
    const word = vars[key];
    if (!particle) return word;
    return particle.includes("/") ? josa(word, particle as Parameters<typeof josa>[1]) : word + particle;
  });
}

export function sillok(p: Pillars, { cast = {}, kingName = "" }: { cast?: Cast; kingName?: string } = {}) {
  const seed = (n: number) =>
    (p.dayStem * 131 + p.dayBranch * 31 + p.yearBranch * 7 + (p.hourBranch ?? 12) * 3 + n * 17) >>> 0;

  const life = lifespan(p);
  const reading = readChart(p);
  const { tier, reasons: tierReasons } = reignTier(p);
  const t = TIERS[tier];
  const deposed = tier === "pok";
  const { headline, rows } = ratings(p, tier);

  const death = life.death;
  // Short lives start young so even a brief reign has a few years to tell.
  const accession = Math.max(8, Math.min(13 + (seed(1) % 20), death - Math.max(3, Math.floor((death - 8) / 2))));
  // A deposed king lives on in exile for a few years after losing the throne.
  const exile = deposed ? Math.min(1 + (mix(seed(3)) % 3), Math.max(0, death - accession - 1)) : 0;
  const reign = Math.max(1, death - accession - exile);
  const { rank, note: rankNote } = lifespanRank(death);

  const epithet = deposed ? `${kingName || "폐"}군` : `${EPITHETS[p.dayStem][p.dayBranch % 3]}대왕`;
  const [eraTitle, eraText] = ERAS[p.dayBranch];
  const [peopleName, rumor] = t.dark ? DARK_PEOPLE[p.yearBranch % DARK_PEOPLE.length] : PEOPLE[p.yearBranch];
  const firstYear = 1 + (seed(8) % Math.min(3, Math.max(1, Math.floor(reign / 3))));
  const crisisYear = Math.min(reign, firstYear + 1 + (seed(6) % Math.max(1, Math.floor(reign / 2) - firstYear)));
  const peakYear = Math.min(reign, crisisYear + 3 + (seed(9) % 8));
  const who = { 영의정: cast.yeong ? `영의정 ${cast.yeong}` : "영의정" };

  const childhood = CHILDHOOD[p.dayStem];
  const ch1 = [
    childhood.text,
    `그리고 ${accession}세, 마침내 보위에 올랐다. ${OMENS[p.yearBranch]}`,
    accession < 18
      ? "나이가 어려 한동안 대비가 수렴청정하였으나, 어린 왕은 발 너머에서 모든 것을 듣고 있었다."
      : accession >= 28
        ? "늦은 즉위였으나, 오래 준비해 온 임금이었다."
        : "",
    t.dark ? DARK_TURN[p.dayStem] : "",
  ];

  const first = t.dark ? DARK_FIRST[p.dayStem] : FIRST_ACTS[p.dayStem][p.yearBranch % 2];
  const ch2 = [
    t.dark ? `훗날 사람들은 이 치세를 ‘잃어버린 ${reign}년’이라 불렀다.` : `훗날 사람들은 전하의 치세를 ‘${eraTitle}’라 부른다. ${eraText}`,
    fill(first.text, { ...who, 년: String(firstYear) }),
  ];

  const crisis = isClash(p.dayBranch, p.yearBranch)
    ? CRISES.clash
    : isWonjin(p.dayBranch, p.yearBranch)
      ? CRISES.wonjin
      : CRISES.others[seed(7) % CRISES.others.length];
  const ch3 = [
    fill(crisis.text, { 년: String(crisisYear) }) +
      (cast.gansin ? ` 이 틈을 타 간신 ${josa(cast.gansin, "이/가")} “전하, 소신만 믿으소서” 하며 곁을 파고들었다.` : ""),
    t.dark ? DARK_RESOLVE[p.dayStem] : RESOLVE[p.dayStem],
    cast.gansin
      ? t.dark
        ? `모든 일이 끝난 뒤, 벼슬이 오른 것은 간신 ${josa(cast.gansin, "이었다/였다")}. 전하는 끝내 그 속셈을 알아채지 못했다.`
        : `모든 일이 끝난 뒤, 전하는 간신 ${josa(cast.gansin, "을/를")} 조용히 불러 그간의 속셈을 하나하나 짚어 주었다. 그날 밤 ${josa(cast.gansin, "은/는")} 식은땀을 흘리며 잠을 이루지 못했다.`
      : "",
    cast.yubae
      ? t.dark
        ? `이 무렵 전하에게 바른말을 하던 ${josa(cast.yubae, "은/는")} 먼 섬으로 유배되었다. 떠나는 날 배웅하는 이는 아무도 없었다.`
        : `이 무렵 전하와 사사건건 부딪치던 ${josa(cast.yubae, "은/는")} 먼 섬으로 유배되었다. 떠나는 날, 전하는 아무도 모르게 겨울옷 한 벌을 보냈다.`
      : "",
  ];

  // Day stem and day branch always share yin/yang, so branch % 2 would pin one nickname per stem; use the next bit.
  const nick = (p.dayBranch >> 1) % 2;
  const golden = t.dark ? DARK_GOLDEN[p.dayStem] : GOLDEN[p.dayStem][nick];
  const nickname = t.dark ? DARK_GOLDEN[p.dayStem].nickname : COURT_NICKNAMES[p.dayStem][nick];
  const ch4 = [
    `${fill(golden.text, { 년: String(peakYear) })} 이 일로 조정에서는 뒤에서 몰래 ‘${nickname}’라 불렀다.`,
    `백성들은 전하를 ‘${peopleName}’${josa(peopleName, "이라/라").slice(peopleName.length)} 불렀다. ${rumor}`,
  ];

  const blooper = BLOOPERS[seed(5) % BLOOPERS.length];
  const ch5 = [
    `정사에는 없으나 야사는 이렇게 전한다. ${blooper.text}`,
    cast.witness ? `이 광경을 목격한 ${josa(cast.witness, "은/는")} 평생 입을 다물었다고 한다.` : "",
  ];

  const ending = deposed
    ? {
        title: "폐위",
        paras: [
          `재위 ${reign}년, 마침내 반정이 일어났다. 반정군이 궐문을 열었을 때, 전하를 지키려 나선 군사는 한 명도 없었다.` +
            (cast.yeong ? ` 반정군의 맨 앞에는 영의정 ${josa(cast.yeong, "이/가")} 서 있었다.` : ""),
          `왕위에서 쫓겨난 전하는 ‘${epithet}’으로 강등되어 먼 섬으로 유배되었고, ${exile > 0 ? `${exile}년 뒤 ` : "그 해 "}향년 ${death}세로 그곳에서 생을 마쳤다. ${rankNote}`,
          "폐위된 왕에게는 묘호도 존호도 올리지 않았다. 무덤은 능(陵)이 아닌 묘(墓)라 불렸고, 치세의 기록은 실록이 아닌 ‘일기’로 낮추어 불렸다.",
        ],
      }
    : {
        title: "마지막 날",
        paras: [
          t.dark ? DARK_FAREWELL[seed(11) % DARK_FAREWELL.length] : fill(FAREWELL[p.dayStem], who),
          `재위 ${reign}년, 향년 ${death}세. ${rankNote}`,
          `신하들은 ${epithet}이라는 존호를 올렸다.`,
        ],
      };

  return {
    tier,
    tierLabel: t.label,
    tierHanja: t.hanja,
    tierLine: t.line,
    deposed,
    headline,
    ratings: rows,
    epithet,
    nickname,
    peopleName,
    accession,
    reign,
    death,
    rank,
    lifeVerdict: life.verdict,
    // The full chart leads with the day master's strength and 용신; then the verdict and one lifespan reason,
    // avoiding a second mention of the zodiac clash.
    reasons: [
      ...(reading ? reading.reasons : []),
      ...tierReasons.slice(0, reading ? 1 : 2),
      life.reasons.find((r) => !r.includes("띠")) ?? life.reasons[0],
    ],
    chart: reading && {
      slots: chartOf(p as Parameters<typeof chartOf>[0]),
      elements: reading.elements,
      strength: reading.strength,
      yong: reading.yong,
      missing: reading.missing,
    },
    chapters: [
      { title: childhood.title, paras: ch1 },
      { title: first.title, paras: ch2 },
      { title: crisis.title, paras: ch3 },
      { title: golden.title, paras: ch4 },
      { title: blooper.title, paras: ch5 },
      ending,
    ].map((c) => ({ title: c.title, paras: c.paras.filter(Boolean) })),
    sagwan: t.dark ? DARK_SAGWAN[p.dayStem] : SAGWAN[p.dayStem],
  };
}
