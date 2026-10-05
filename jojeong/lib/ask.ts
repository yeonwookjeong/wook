import "server-only";
import { chartBrief, pairBrief } from "./brief";
import { coupleBrief } from "./couple";
import { decodePerson, profileOf, type Person } from "./pairToken";
import { writeReport } from "./reportWriter";
import { STEMS_KO, BRANCHES_KO } from "./saju";
import { askRoomIds, getAskRoomRaw, newAskRoomId, setAskRoomRaw } from "./store";
import { thisYear, yeonunBrief } from "./yeonun";

// 정 훈도에게 묻기: a room per chart where 정 훈도 answers one question at a time and remembers the talk.
// He remembers in three layers: the chart and this year's flow (computed when the room opens, recomputed each
// answer), a running counsel memo he rewrites after every answer, and the last few turns word for word.
// Birth dates are never kept: the room holds the person token (lib/pairToken.ts), the eight characters only.

export const TOPICS = ["연애", "일", "돈", "사람", "기타"] as const;
export type Topic = (typeof TOPICS)[number];
export const MAX_QUESTION = 200;

export type AskMessage = {
  role: "guest" | "hundo";
  text: string;
  at: number;
  topic?: Topic;
  // When a question held several topics: the ones he offers to take first, nothing spent yet.
  choices?: string[];
};

export type AskRoom = {
  id: string;
  createdAt: number;
  updatedAt: number;
  me: string; // person token
  other?: string; // the other person's token, once attached
  otherLabel?: string; // how the guest calls them (그 사람, 남자친구 …)
  memo: string;
  messages: AskMessage[];
  used: number; // questions answered (each one a ticket once sales open)
};

export async function createRoom(token: string): Promise<AskRoom> {
  const now = Date.now();
  const room: AskRoom = { id: await newAskRoomId(), createdAt: now, updatedAt: now, me: token, memo: "", messages: [], used: 0 };
  await saveRoom(room);
  return room;
}

export async function loadRoom(id: string): Promise<AskRoom | null> {
  const raw = await getAskRoomRaw(id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AskRoom;
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
  return rooms.filter((r): r is AskRoom => Boolean(r));
}

export const personOfRoom = (room: AskRoom) => decodePerson(room.me);
export const otherOfRoom = (room: AskRoom) => (room.other ? decodePerson(room.other) : null);
export const iljuOf = (p: Person) => `${STEMS_KO[p.pillars.dayStem]}${BRANCHES_KO[p.pillars.dayBranch]}일주`;

const SYSTEM = `너는 '정 훈도'다. 조선 관상감 명과학의 막내 관원(훈도)이고, 사주 보는 눈만큼은 조선 제일이다. 지금은 현대를 사는 한 사람과 상담방에서 마주 앉아, 그 사람이 묻는 고민 하나에 그 사람의 사주로 답한다. 이 방은 계속 이어지는 상담이라, 지난 대화를 기억하고 이어서 말한다.

[말투]
- 상대를 '그대'라 부르고 사극풍 존대("~하옵니다", "~이옵니다", "~하시옵소서", "~사옵니다")로 말하되, 문장은 짧게, 요즘 사람이 술술 읽게.
- 따뜻하지만 할 말은 하는 사람. 좋은 말만 하지 않는다. 다만 겁주지 않고, 반드시 무엇을 하면 되는지로 끝낸다.
- 누구에게나 맞는 말("노력하면 됩니다", "좋은 일이 생깁니다") 금지. 이 사람의 글자와 이 사람의 상황으로만 말한다.
- 사주 용어는 한 답에 한두 개까지, 쓰면 바로 쉬운 말로 푼다.

[답의 틀 — 매번 이 순서, 제목·목록·굵은 글씨·이모지 없이 문단으로]
1. 한 줄 답: 질문에 대한 결론부터 한 문장.
2. 까닭 2~3가지: 아래 '사주 근거'에 있는 것만 근거로. 새로 계산하거나 근거를 지어내지 않는다.
3. 때: 이달·올해·언제쯤 흐름이 바뀌는지. 근거의 달별 판정과 같은 방향으로.
4. 할 일 1~2개: 오늘부터 해 볼 수 있는 구체적인 것.
5. 정 훈도 한마디: 짧게 마무리.
전체 400~700자.

[기억]
- '상담 메모'와 '최근 대화'를 반드시 읽고 이어서 말한다. 전에 나온 사람·사건·조언을 알아보고 필요하면 짚는다("지난번 말씀하신 그분은…").
- 전에 한 말과 어긋나지 않는다. 상황이나 달이 바뀌어 말이 달라지면 왜 달라졌는지 한 줄로 밝힌다.
- 메모에 없는 일을 있었던 것처럼 말하지 않는다.

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
(최대 4개, 다른 말 없이)

[출력 형식]
- 답을 다 쓴 뒤 줄을 바꿔 정확히 [[메모]] 한 줄을 쓰고, 그 아래에 고쳐 쓴 상담 메모 전체를 쓴다.
- 메모는 다음 상담 때 네가 읽을 기록이다. 손님 상황, 대화에 나온 사람(호칭·관계), 손님이 털어놓은 사건과 날짜, 네가 드린 핵심 조언, 아직 안 풀린 고민을 '- '로 시작하는 줄로, 900자 안. 지난 메모에서 여전히 맞는 것은 남기고, 틀리거나 지난 것은 고친다.`;

const kstDate = (t = Date.now()) => new Date(t + 9 * 3600000).toISOString().slice(0, 10);

function context(room: AskRoom): string | null {
  const me = personOfRoom(room);
  if (!me) return null;
  const other = otherOfRoom(room);
  const y = thisYear();
  const parts = [
    `[오늘] ${kstDate()}`,
    `[사주 근거 — 이미 계산됨, 그대로 믿고 새로 계산하지 않는다]`,
    chartBrief(me.name, me.pillars, profileOf(me)),
    yeonunBrief(me.pillars, profileOf(me), y, y),
  ];
  if (other) {
    parts.push(
      `[함께 붙인 사람: ${room.otherLabel || other.name} (이름 ${other.name})]`,
      chartBrief(other.name, other.pillars, profileOf(other)),
      pairBrief(me.name, me.pillars, other.name, other.pillars),
      coupleBrief(me, other),
    );
  }
  return parts.filter(Boolean).join("\n\n");
}

const RECENT = 8;

export type AskResult = { ok: true } | { ok: false; error: string };

// One question. `chosen`: after he offered choices, the one the guest picked (the original question rides along).
export async function ask(room: AskRoom, question: string, topic: Topic, chosen?: string): Promise<AskResult> {
  const q = question.trim().slice(0, MAX_QUESTION);
  if (!q) return { ok: false, error: "여쭐 말씀을 적어 주시옵소서." };
  const ctx = context(room);
  if (!ctx) return { ok: false, error: "이 방의 사주를 읽지 못했사옵니다." };
  const recent = room.messages
    .filter((m) => !m.choices)
    .slice(-RECENT)
    .map((m) => `${m.role === "guest" ? `손님${m.topic ? `(${m.topic})` : ""}` : "정 훈도"} [${kstDate(m.at)}]: ${m.text}`)
    .join("\n");
  const name = personOfRoom(room)!.name;
  const prompt = [
    ctx,
    `[상담 메모]\n${room.memo || "(아직 없음 — 첫 상담)"}`,
    `[최근 대화]\n${recent || "(없음)"}`,
    `[이번 질문] 손님 ${name}님, 고른 주제: ${topic}${chosen ? `\n여러 주제 중 손님이 먼저 고른 것: ${chosen} — 이것 하나만 답한다.` : ""}\n${q}`,
  ].join("\n\n");

  // ASK_MOCK=1 (local only, no key): a canned answer that still exercises the topic split and the memo.
  const text =
    process.env.ASK_MOCK === "1"
      ? !chosen && /그리고|또/.test(q)
        ? "[[여러 주제]]\n- 연애: 그 사람과의 앞날\n- 일: 이직할 때"
        : `그대의 물음에 한 줄로 아뢰자면, 서두르지 않는 쪽이 맞사옵니다.\n\n(시험용 답변 · 질문: ${q})\n\n[[메모]]\n- ${kstDate()} ${topic} 질문: ${q}\n${room.memo}`
      : await writeReport({ key: `ask:${room.id}`, system: SYSTEM, prompt, title: "정 훈도에게 묻기", modern: false }, () => {});
  if (!text) return { ok: false, error: "답을 쓰다 끊겼사옵니다. 잠시 뒤 다시 여쭈시옵소서." };

  const now = Date.now();
  // A pick among offered topics shows as the pick, not the whole question again.
  room.messages.push({ role: "guest", text: chosen ? `먼저 여쭙기: ${chosen}` : q, at: now, topic });
  if (!chosen && text.includes("[[여러 주제]]")) {
    const choices = text
      .split("[[여러 주제]]")[1]
      .split("\n")
      .map((l) => l.replace(/^[-·•\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 4);
    room.messages.push({
      role: "hundo",
      text: `여러 가지를 함께 여쭈셨사옵니다. 하나씩 깊이 보아야 제대로 아뢸 수 있사오니, 무엇부터 보시겠사옵니까?\n나머지는 질문 하나씩으로 이어서 여쭈시면 되옵니다.`,
      at: now,
      choices,
    });
  } else {
    const [answer, memo] = text.split("[[메모]]");
    room.messages.push({ role: "hundo", text: answer.trim(), at: now, topic });
    if (memo?.trim()) room.memo = memo.trim().slice(0, 1500);
    room.used += 1;
  }
  room.updatedAt = now;
  await saveRoom(room);
  return { ok: true };
}
