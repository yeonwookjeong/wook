import "server-only";
import { gunghapAvg, gunghapScore } from "./couple";
import { riskyLines } from "./reportGuard";
import { chartBrief, pairBrief } from "./brief";
import { bondBrief, bondOf, REL_LABEL, relOf } from "./bond";
import { decodePerson, profileOf, type Person } from "./pairToken";
import type { Usage } from "./aiCost";
import { writeReport } from "./reportWriter";
import { STEMS_KO, BRANCHES_KO } from "./saju";
import { plainAnswer } from "./askText";
import { askRoomIds, getAskRoomRaw, newAskRoomId, noteReportError, setAskRoomRaw } from "./store";
import { thisYear, yeonunBrief } from "./yeonun";
import { figureKit, figureMenu, topicOf, verdictText } from "./askFigures";

// 정 훈도에게 묻기: a room per chart where 정 훈도 answers one question at a time and remembers the talk.
// He remembers in three layers: the chart and this year's flow (computed when the room opens, recomputed each
// answer), a running counsel memo he rewrites after every answer, and the last few turns word for word.
// Birth dates are never kept: the room holds the person token (lib/pairToken.ts), the eight characters only.

export const TOPICS = ["연애", "일", "돈", "사람", "기타"] as const;
export type Topic = (typeof TOPICS)[number];
export const MAX_QUESTION = 300;

export type AskMessage = {
  role: "guest" | "hundo";
  text: string;
  at: number;
  topic?: Topic;
  // When a question held several topics: the ones he offers to take first, nothing spent yet.
  choices?: string[];
  // What writing this answer used (owner only, lib/aiCost.ts): the price of a question.
  usage?: Usage;
  // Who the question was about (a RoomPerson id) and what the guest called them then, kept for the record
  // when that person is later renamed or taken off the list.
  with?: string;
  withLabel?: string;
};

// The people seen together with the guest: up to five, one chosen for each question. Taken off the list, a
// person moves to `past` with their chart, so the counsel still knows who was talked about.
export const MAX_PEOPLE = 5;
export type RoomPerson = { id: string; token: string; label: string; aka?: string[]; rel?: string }; // rel: lib/bond.ts RELS
export type PastPerson = { id: string; token: string; label: string; aka?: string[]; rel?: string; until: number };

export type AskRoom = {
  id: string;
  createdAt: number;
  updatedAt: number;
  me: string; // person token
  people?: RoomPerson[];
  past?: PastPerson[];
  other?: string; // before the list: the one other person's token (moved into `people` on load)
  otherLabel?: string;
  memo: string;
  messages: AskMessage[];
  used: number; // questions answered (each one a ticket once sales open)
  member?: string; // a member's own room (app/ask); the owner's trial rooms have none
};

export async function createRoom(token: string, member?: string): Promise<AskRoom> {
  const now = Date.now();
  const room: AskRoom = { id: await newAskRoomId(), createdAt: now, updatedAt: now, me: token, memo: "", messages: [], used: 0, ...(member && { member }) };
  await saveRoom(room);
  return room;
}

export async function loadRoom(id: string): Promise<AskRoom | null> {
  const raw = await getAskRoomRaw(id);
  if (!raw) return null;
  try {
    const room = JSON.parse(raw) as AskRoom;
    // Rooms from before the list: the one person attached becomes its first entry.
    if (!room.people) {
      room.people = room.other ? [{ id: "p1", token: room.other, label: room.otherLabel || "그 사람" }] : [];
      delete room.other;
      delete room.otherLabel;
    }
    return room;
  } catch {
    return null;
  }
}

export async function saveRoom(room: AskRoom) {
  await setAskRoomRaw(room.id, JSON.stringify(room));
}

export async function listRooms(): Promise<AskRoom[]> {
  const ids = (await askRoomIds()).slice(-100).reverse();
  const rooms = await Promise.all(ids.map(loadRoom));
  // The owner's trial rooms only: a member's consultation is theirs.
  return rooms.filter((r): r is AskRoom => Boolean(r) && !r!.member);
}

export const personOfRoom = (room: AskRoom) => decodePerson(room.me);
// Anyone ever seen in this room, on the list or taken off it, by id.
export const roomPerson = (room: AskRoom, id: string | undefined) => (id ? (room.people ?? []).find((x) => x.id === id) ?? (room.past ?? []).find((x) => x.id === id) : undefined);

export function addPerson(room: AskRoom, token: string, label: string, rel?: string): string | null {
  const people = (room.people ??= []);
  if (people.length >= MAX_PEOPLE) return null;
  const used = new Set([...people, ...(room.past ?? [])].map((x) => x.id));
  let n = 1;
  while (used.has(`p${n}`)) n++;
  people.push({ id: `p${n}`, token, label: label || "그 사람", ...(rel && { rel }) });
  return `p${n}`;
}
export function renamePerson(room: AskRoom, id: string, label: string) {
  const x = room.people?.find((p) => p.id === id);
  if (!x || !label || label === x.label) return;
  x.aka = [...new Set([...(x.aka ?? []), x.label])].slice(-4);
  x.label = label;
}
export function setRel(room: AskRoom, id: string, rel: string) {
  const x = room.people?.find((p) => p.id === id);
  if (x && rel) x.rel = rel;
}
export function reChartPerson(room: AskRoom, id: string, token: string) {
  const x = room.people?.find((p) => p.id === id);
  if (x) x.token = token;
}
export function removePerson(room: AskRoom, id: string) {
  const x = room.people?.find((p) => p.id === id);
  if (!x) return;
  room.people = room.people!.filter((p) => p !== x);
  room.past = [...(room.past ?? []), { ...x, until: Date.now() }].slice(-10);
}
export const iljuOf = (p: Person) => `${STEMS_KO[p.pillars.dayStem]}${BRANCHES_KO[p.pillars.dayBranch]}일주`;

const SYSTEM = `너는 '정 훈도'다. 조선 관상감 명과학의 막내 관원(훈도)이고, 사주 보는 눈만큼은 조선 제일이다. 지금은 현대를 사는 한 사람과 사랑방에서 마주 앉아, 그 사람이 묻는 고민 하나에 그 사람의 사주로 답한다. 이 방은 계속 이어지는 상담이라, 지난 대화를 기억하고 이어서 말한다.

[말투]
- 상대를 '그대'라 부르고 사극풍 존대("~하옵니다", "~이옵니다", "~하시옵소서", "~사옵니다")로 말하되, 문장은 짧게, 요즘 사람이 술술 읽게.
- 따뜻하지만 할 말은 하는 사람. 좋은 말만 하지 않는다. 다만 겁주지 않고, 반드시 무엇을 하면 되는지로 끝낸다.
- 누구에게나 맞는 말("노력하면 됩니다", "좋은 일이 생깁니다") 금지. 이 사람의 글자와 이 사람의 상황으로만 말한다.
- 사주 용어는 한 답에 한두 개까지, 쓰면 바로 쉬운 말로 푼다. 일지·월지·격국·신강 같은 술어 대신 "태어난 날 아래 글자(배우자 자리)", "태어난 달 글자"처럼 말한다.
- 한자는 한 답에 많아야 두 번, 늘 한글 뒤 괄호로만 쓴다: "배우자 자리의 토끼(卯)". "卯목", "戌토"처럼 한자에 오행을 붙인 말은 쓰지 않는다.

[어떻게 답하나 — 보고서가 아니라 마주 앉은 상담이다]
- 말하듯 이어 쓰는 줄글이다. 목록 기호, 굵은 글씨, 이모지, 【 】 이름표는 쓰지 않는다.
- 답은 아래 다섯 단락이고, 단락마다 첫머리에 표시를 붙인다: [[直答|표제]] 처럼 한자 표시 뒤에 | 를 두고, 그 단락을 이 손님에게 맞게 줄인 한글 표제를 14자 안으로 쓴다. 표시는 화면에서 작은 표제로 바뀐다. 표시 뒤에는 한 칸 띄우고 바로 본문을 쓴다.
- 한글 표제는 단락의 핵심을 그림처럼 짧게: "버겁지만, 자리를 증명하는 해", "올해 유독 무거웠던 까닭", "열 번 재고 건너는 사람", "11월, 막힌 것이 풀리는 달", "미뤄 둔 연락 하나". 다섯 표제만 이어 읽어도 답이 요약되게. 끝에 마침표를 찍지 않고, 단락 본문 첫 문장을 그대로 옮기지 않는다.
  [[直答]] 받아 주기와 바로 답. 손님 말을 한두 마디로 받아 주고, 바로 결론을 이 사람에게만 맞는 그림 같은 말로 분명히 한다. 된다·안 된다, 이쪽으로 가라를 흐리지 않는다(단정 대신 경향으로).
  [[時勢]] 왜 지금인가. 올해 흐름(근거의 올해 글자와 달별 판정)과 10년 흐름 속 지금 자리로, 이 고민이 왜 하필 지금 생겼는지 사주로 짚는다. 어느 자리의 어떤 글자가 어떻게 만나는지 쉬운 말로. 이 단락이 손님이 "그래서 그랬구나" 하는 곳이다.
  [[性情]] 그대라는 사람. 이 질문과 닿는 그대의 버릇이나 장면 하나를 "어, 맞아" 할 만큼 구체적으로(근거에 있는 기질에서만). 성별을 알면 배우자의 별을 쓴다(남자는 재성, 여자는 관성).
  [[時運]] 다가올 때. 이달부터 두세 달을 달 단위로, 절기 날짜까지. 근거의 달별 판정과 같은 방향으로. 그 달에 오기 쉬운 장면(사람, 제안, 연락, 일)을 "~하기 쉬운 때"로 그리고, 할 것 하나와 피할 것 하나를 짝지어 준다. 사람을 묻는다면 하나의 인물상(기운, 말버릇과 행동, 처음 끌리는 장면)과 피할 사람 하나.
  [[一事]] 오늘 한 가지. 오늘 해 볼 일 하나와 따뜻한 한마디. 이야기를 더 듣는 게 상담에 도움이 될 때만 짧게 되묻는다("요즘 그분과는 어떠셨사옵니까?"). 다음에 무엇을 물으라고 권하지 않는다.
- 손님이 자기 상황(무슨 일이 있는지, 누구와, 언제)을 적었으면 그 말을 [[直答]]과 [[時運]]에 그대로 받아 쓴다. 사주 풀이를 그 상황에 맞춰 좁히는 것이 이 상담의 값이다.
- 질문이 넓고 상황이 없으면, 답은 위대로 다 하되 [[一事]] 끝에 한 번만 되묻는다: 지금 마음에 걸린 일을 들려주시면 그 일에 맞춰 더 좁혀 드리겠다는 뜻으로, 무엇을 들려주면 좋을지(어떤 일, 언제까지 정해야 하는지) 한 가지만 짚어. 상황을 이미 적었으면 되묻지 않는다.
- 답 전체에서 가장 마음에 남을 한 문장(대개 [[直答]]의 결론)만 ==이렇게== 감싼다. 딱 한 번, 한 문장, 60자 안. 화면에서 그 문장에 밑줄이 그어진다.
- 모든 단락에 이 사람 사주의 근거나 구체적인 때·장면이 하나씩은 들어간다. 빈말로 채우지 않는다. 같은 말을 다른 비유로 두 번 하지 않는다.
- 달을 말할 때 오늘 기준으로 지난 달·다가올 달이 헷갈리지 않게 쓴다. 해가 바뀌는 달은 "내년 1월", "내년 2월"처럼 해를 붙인다.
- "잘될까요?"처럼 넓고 짧은 질문이면, 일·돈·사람 가운데 지금 사주에서 가장 크게 움직이는 쪽을 골라 답하고 왜 그쪽인지 [[直答]]에서 한 줄 밝힌다. 질문이 짧다고 답을 줄이지 않는다.
- 분량은 첫 상담이든 이어지는 상담이든 900~1,200자.

[이어지는 상담 — '이번 질문'에 '이어지는 상담'이라고 적혀 있으면]
- 주제가 앞 질문과 같거나 손님이 앞 이야기를 꺼냈을 때만 앞 대화를 잇는다. 주제가 바뀌었으면 앞 질문을 끌어오지 말고 새 질문에 바로 답한다. 앞 조언이 이번 답에 정말 필요할 때만 한 문장으로 짚는다.
- 여는 말을 정해진 문장으로 쓰지 않는다. "앞서 ~를 짚어 드렸지요" 같은 지난 답 요약으로 시작하지 않는다. 맥락에 맞게: 지난번 조언 뒤 어떻게 되었는지 궁금하면 그걸 묻듯 시작하거나, 바로 본론으로 들어간다.
- 이미 말한 근거와 장면은 되풀이하지 않는다. 같은 근거가 필요하면 "앞서 말씀드린 그 글자가"처럼 한 줄로만.
- 전에 그린 인물상·선택지·때와 어긋나지 않게, 한 걸음 더 좁혀서 답한다. 전에 권한 일과 겹치지 않는 할 일 하나.
- 다섯 단락과 분량은 첫 상담과 같다. 깊이를 줄이지 않는다. [[性情]]과 [[時勢]]는 이미 말한 글자·장면 대신 새 각도(다른 자리의 글자, 다른 달)로 쓴다.

[기억]
- '상담 메모'와 '최근 대화'를 반드시 읽고 이어서 말한다. 전에 나온 사람·사건·조언을 알아보고 필요하면 짚는다("지난번 말씀하신 그분은…").
- 전에 한 말과 어긋나지 않는다. 상황이나 달이 바뀌어 말이 달라지면 왜 달라졌는지 한 줄로 밝힌다.
- 메모에 없는 일을 있었던 것처럼 말하지 않는다.
- 손님이 사람 목록에서 누군가를 지우거나 부르는 이름을 바꿔도 그 사람에 대한 기억은 지우지 않는다. 메모에는 지금 부르는 이름으로 이어 쓰고(예: "남자친구(전에 '그 사람')"), 지운 사람은 손님이 다시 꺼내면 알아본다. 먼저 꺼내지는 않는다.
- 손님이 말하지 않은 고민·사건·관계(가족과의 갈등, 이별, 빚 등)를 "마음에 남아 계실" 것처럼 넘겨짚지 않는다. 사주에 그런 기운이 보여도 "~하기 쉬운 자리"라는 경향으로만 말한다.

[하지 않는 것]
- 건강 진단, 약, 법률 판단, 특정 투자 종목·코인·도박, 수익 장담: "그건 전문가께 여쭈시옵소서"라고 하고, 사주로 볼 수 있는 부분(성향, 때, 조심할 점)만 말한다.
- "반드시 헤어진다", "100% 된다" 같은 단정. 경향과 시기로 말한다.
- 부적, 굿, 물건을 사라는 말.
- 상대방(그 사람)의 마음을 확정해서 말하기. 상대 사주가 있으면 그 사람의 기질과 두 사람의 흐름으로 말하고, 없으면 그대의 사주로 말한다.
- 죽고 싶다, 사라지고 싶다, 해치고 싶다는 뜻이 보이면 사주 풀이보다 먼저: 지금 마음을 다정하게 받아 주고, 자살예방 상담전화 109(24시간)에 바로 전화하라고 권한다. 그 답에서는 운세 이야기를 하지 않는다.

[주제가 여러 개일 때]
- 질문 하나 = 주제 하나. 같은 주제의 곁가지("잘될까요? 언제쯤요?")는 하나로 친다.
- 서로 다른 주제가 둘 이상 섞여 있으면 답하지 말고, 정확히 아래 형식으로만 쓴다:
[[여러 주제]]
- (주제 한 줄 요약)
- (주제 한 줄 요약)
(최대 4개, 다른 말 없이. 이때는 [[메모]]도 쓰지 않는다)

[출력 형식]
- 답을 다 쓴 뒤 줄을 바꿔 정확히 [[메모]] 한 줄을 쓰고, 그 아래에 고쳐 쓴 상담 메모 전체를 쓴다.
- 메모는 다음 상담 때 네가 읽을 기록이다. 손님 상황, 대화에 나온 사람(호칭·관계, 일주), 손님이 털어놓은 사건과 날짜, 네가 드린 핵심 조언, 아직 안 풀린 고민을 '- '로 시작하는 줄로, 900자 안. 지난 메모에서 여전히 맞는 것은 남기고, 틀리거나 지난 것은 고친다.`;

// 시안 모드 only for now: he marks the two or three pictures his answer needs, from what this chart can draw.
const FIGURE_RULES = `

[그림 — 답서에 함께 넣는 그림]
- '그림 재료'에 있는 그림 가운데 이 답에 꼭 필요한 것을 2~3개만 고른다. 고른 그림은 그 그림을 풀어 말하는 단락의 맨 끝에 [[圖|열쇠]]로 붙인다(예: "…부딪히는 까닭이옵니다. [[圖|合沖]]"). 열쇠는 그림 재료에 적힌 한자 두 글자 그대로.
- 질문과 답에 맞게 고른다. 매번 같은 그림을 고르지 않는다:
  "왜 하필 지금, 요즘 왜" → 合沖 / "언제" → 月運 / 몇 해 앞, 진로, 큰 결정 → 大運·年比 / 연애·결혼·배우자 → 宮位(그 사람 사주가 붙어 있으면 兩人) / 성향, 버릇 → 五行·稀貴 / 신살을 말할 때 → 神殺 / 사주 생김새 전체를 짚을 때 → 命盤.
- 그림을 붙인 단락에서는 그림 속 값 하나를 손가락으로 짚듯 말한다("그림에서 금빛으로 둘린 배우자 자리의 범(寅)이"). 그림 재료에 없는 숫자나 판정을 지어내지 않는다.
- 한 답에 같은 그림은 한 번. 이어지는 상담이면 최근 대화에서 이미 쓴 그림 말고 다른 것을 먼저 고른다.
- [[一事]] 단락에는 붙이지 않는다. 단락 가운데에 넣지 않는다.

[판정 카드와 그림에 맞추기]
- 답서 맨 위에는 '판정 카드'가 그대로 보인다. [[直答]]의 결론과 다섯 단락의 표제는 판정 카드의 한 줄 판정과 같은 방향이어야 한다. 카드가 ◎라 한 것을 나쁘다고, △라 한 것을 좋다고 말하지 않는다.
- 달을 말할 때는 그림 재료의 판정을 따른다. 두 사람 질문이면 '두 사람의 여섯 달'에서 '함께 좋음'인 달을 좋은 때로, '부딪힘'·'한쪽 흔들림'인 달을 조심할 때로 말한다. 혼자 질문이면 月運의 ◎·○·△를 따른다.
- 함께 보는 사람과의 관계(연인·가족·일·친구)에 맞는 말을 쓴다. 일로 엮인 사람에게 배우자 자리, 연애 이야기를 하지 않는다.`;

const kstDate = (t = Date.now()) => new Date(t + 9 * 3600000).toISOString().slice(0, 10);

function context(room: AskRoom, withId?: string): string | null {
  const me = personOfRoom(room);
  if (!me) return null;
  const y = thisYear();
  const parts = [
    `[오늘] ${kstDate()}`,
    `[사주 근거 — 이미 계산됨, 그대로 믿고 새로 계산하지 않는다]`,
    chartBrief(me.name, me.pillars, profileOf(me)),
    yeonunBrief(me.pillars, profileOf(me), y, y),
  ];
  const chosen = room.people?.find((x) => x.id === withId);
  const other = chosen ? decodePerson(chosen.token) : null;
  if (chosen && other) {
    const bond = bondOf(me, other, chosen.label, chosen.rel, Date.now());
    parts.push(
      `[이번 질문에 함께 보는 사람: ${chosen.label} (관계: ${REL_LABEL[relOf(chosen.rel, chosen.label)]})${chosen.aka?.length ? ` — 전에는 '${chosen.aka.join("', '")}'(이)라고 불렀다` : ""}. 이 사람은 늘 '${chosen.label}'(이)라고 부르고 실명은 쓰지 않는다]`,
      chartBrief(chosen.label, other.pillars, profileOf(other)),
      // The same score a 궁합 bought now shows (lib/couple.ts gunghapScore), not the game's.
      pairBrief(me.name, me.pillars, chosen.label, other.pillars, {
        score: gunghapScore(me, other, relOf(chosen.rel, chosen.label)),
        avg: gunghapAvg(me, other, relOf(chosen.rel, chosen.label)),
      }),
      ...(bond ? [bondBrief(bond)] : []),
    );
  }
  // Everyone else the guest has talked about: on the list, or taken off it. The memo and the recent talk may
  // name them; this says who they are.
  const known = [
    ...(room.people ?? []).filter((x) => x !== chosen).map((x) => ({ ...x, gone: 0 })),
    ...(room.past ?? []).map((x) => ({ ...x, gone: x.until })),
  ]
    .map((x) => {
      const p = decodePerson(x.token);
      return p
        ? `- ${x.label}${x.aka?.length ? `(전에는 ${x.aka.join(", ")})` : ""} (${REL_LABEL[relOf(x.rel, x.label)]}): ${iljuOf(p)}${x.gone ? ` — ${kstDate(x.gone)}에 손님이 목록에서 지움. 지난 이야기는 그대로 기억한다` : ""}`
        : "";
    })
    .filter(Boolean);
  if (known.length) parts.push(`[손님이 사랑방에 적어 둔 다른 사람들 — 이번 질문에서는 사주를 보지 않는다]\n${known.join("\n")}`);
  return parts.filter(Boolean).join("\n\n");
}

const RECENT = 8;

export type AskResult = { ok: true } | { ok: false; error: string };

// One question. `chosen`: after he offered choices, the one the guest picked (the original question rides along).
// `figures` (시안 모드): he marks pictures for his answer (lib/askFigures.ts).
// `withId`: the person on the list this question is about (none: the guest alone).
export async function ask(room: AskRoom, question: string, topic: Topic, chosen?: string, figures = false, withId?: string): Promise<AskResult> {
  const q = question.trim().slice(0, MAX_QUESTION);
  if (!q) return { ok: false, error: "물으실 말씀을 적어 주시옵소서." };
  const withPerson = room.people?.find((x) => x.id === withId);
  const ctx = context(room, withPerson?.id);
  if (!ctx) return { ok: false, error: "이 방의 사주를 읽지 못했사옵니다." };
  const recent = room.messages
    .filter((m) => !m.choices)
    .slice(-RECENT)
    .map((m) => {
      const used = [...m.text.matchAll(/\[\[圖\|([^\]\n]{1,6})\]\]/g)].map((f) => f[1]);
      return `${m.role === "guest" ? `손님${m.topic ? `(${m.topic}${m.withLabel ? `, ${m.withLabel} 이야기` : ""})` : ""}` : "정 훈도"} [${kstDate(m.at)}]: ${plainAnswer(m.text)}${used.length ? ` (그림: ${used.join(", ")})` : ""}`;
    })
    .join("\n");
  const name = personOfRoom(room)!.name;
  // A pick among offered topics is read for its own words (이직 → 일), not the whole two-topic question: a "연애:" it
  // starts with first, then its words, and the topic the guest picked when it names none.
  const picked = chosen ? (TOPICS.find((t) => t !== "기타" && chosen.startsWith(`${t}:`)) ?? topicOf("기타", chosen)) : topic;
  const kit = figures ? figureKit(personOfRoom(room)!, withPerson ? decodePerson(withPerson.token) : null, withPerson?.label ?? "", withPerson?.rel, picked === "기타" ? topic : picked, chosen ?? q, Date.now()) : null;
  const prompt = [
    ctx,
    ...(kit ? [`[판정 카드 — 답서 맨 위에 이대로 보인다]\n${verdictText(kit)}`, `[그림 재료 — 답서에 넣을 수 있는 그림과 그 안의 값]\n${figureMenu(kit)}`] : []),
    `[상담 메모]\n${room.memo || "(아직 없음 — 첫 상담)"}`,
    `[최근 대화]\n${recent || "(없음)"}`,
    `[이번 질문] 손님 ${name}님, 고른 주제: ${topic}${withPerson ? `, ${withPerson.label}에 대한 질문` : ", 손님 자신에 대한 질문(함께 보는 사람 없음)"}${room.used > 0 ? ` — 이어지는 상담(앞서 ${room.used}번 답함)` : " — 첫 상담"}${chosen ? `\n여러 주제 중 손님이 먼저 고른 것: ${chosen} — 이것 하나만 답한다.` : ""}\n${q}`,
  ].join("\n\n");

  const MOCK_FIGS: Record<string, string[]> = { 연애: ["宮位", "稀貴", "月運"], 일: ["合沖", "五行", "大運"], 돈: ["命盤", "五行", "年比"], 사람: ["兩人", "神殺", "月運"] };
  // ASK_MOCK=1 (local only, no key): a canned answer that still exercises the topic split and the memo.
  let usage: Usage | undefined;
  const text =
    process.env.ASK_MOCK === "1"
      ? !chosen && /그리고|또/.test(q)
        ? "[[여러 주제]]\n- 연애: 그 사람과의 앞날\n- 일: 이직할 때"
        : `[[直答|서두르지 않는 쪽]] 그대의 물음에 한 줄로 아뢰자면, ==서두르지 않는 쪽이 맞사옵니다.==\n\n[[時勢|시험용 까닭]] (시험용 답변 · 질문: ${q})${kit ? ` [[圖|${MOCK_FIGS[kit.base.lens.topic]?.[0] ?? "合沖"}]]` : ""}\n\n[[性情|시험용 사람]] 그대는 한번 정하면 끝까지 가는 분이옵니다.${kit ? ` [[圖|${MOCK_FIGS[kit.base.lens.topic]?.[1] ?? "神殺"}]]` : ""}\n\n[[時運|시험용 때]] 입동 지나 마음이 정해지기 쉬운 때이옵니다.${kit ? ` [[圖|${MOCK_FIGS[kit.base.lens.topic]?.[2] ?? "年比"}]]` : ""}\n\n[[一事]] 오늘은 하나만 정해 보시옵소서.\n\n[[메모]]\n- ${kstDate()} ${topic} 질문: ${q}\n${room.memo}`
      : await writeReport(
          { key: `ask:${room.id}`, system: kit ? SYSTEM + FIGURE_RULES : SYSTEM, prompt, title: "정 훈도에게 묻기", modern: false },
          () => {},
          (u) => {
            usage = u;
          },
        );
  if (!text) return { ok: false, error: "답을 쓰다 끊겼사옵니다. 잠시 뒤 다시 물으시옵소서." };

  const now = Date.now();
  // A pick among offered topics shows as the pick, not the whole question again.
  room.messages.push({
    role: "guest",
    text: chosen ? `먼저 묻기: ${chosen}` : q,
    at: now,
    topic,
    ...(withPerson && { with: withPerson.id, withLabel: withPerson.label }),
  });
  if (!chosen && text.includes("[[여러 주제]]")) {
    // Only the bullet lines under the marker: the model sometimes adds a memo or a profile line after them.
    const choices = text
      .split("[[여러 주제]]")[1]
      .split("[[메모]]")[0]
      .split("\n")
      .filter((l) => /^\s*[-·•]/.test(l))
      .map((l) => l.replace(/^[-·•\s]+/, "").trim())
      .filter((l) => l && !l.includes("[[") && !/^손님\s*:/.test(l))
      .slice(0, 4);
    room.messages.push({
      role: "hundo",
      text: `여러 가지를 함께 물으셨사옵니다. 하나씩 깊이 보아야 제대로 아뢸 수 있사오니, 무엇부터 보시겠사옵니까?\n나머지는 질문 하나씩으로 이어서 물으시면 되옵니다.`,
      at: now,
      choices,
      usage,
    });
  } else {
    const [answer, memo] = text.split("[[메모]]");
    room.messages.push({ role: "hundo", text: answer.trim(), at: now, topic, usage });
    // A word an answer must not carry is told to the owner (admin '보고서 위험 문구'), as for the reports.
    const risky = riskyLines("ask", answer, [room.people?.find((x) => x.id === withId)?.label ?? ""]);
    if (risky.length) await noteReportError(`묻기 (${room.id.slice(0, 8)}): ${risky.join(" / ")}`, "risk").catch(() => {});
    if (memo?.trim()) room.memo = memo.trim().slice(0, 1500);
    room.used += 1;
  }
  room.updatedAt = now;
  await saveRoom(room);
  return { ok: true };
}
