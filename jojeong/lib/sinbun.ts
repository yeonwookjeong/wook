import { ELEMENT_HANJA, ELEMENT_KO, readChart, stemEl, type GodGroup, type Strength } from "./myeongri";
import type { Pillars } from "./saju";

// 조선 신분 감정 (free): what someone would have been in Joseon, read from the chart's heaviest ten-god
// group (hidden stems included) and the day master's yin or yang. Ends with a bridge to the present-day paid reports.

export type Sinbun = {
  rank: "양반" | "중인" | "상민" | "천민";
  job: string;
  line: string;
  origin: string; // 태어난 집
  day: [string, string, string]; // 새벽 / 낮 / 밤
  crisis: string; // 인생의 고비
  rise: number; // 출세 가능성 1–5
  riseText: string;
  ending: string; // 말년
  now: string;
};

const JOBS: Record<string, Sinbun> = {
  "인성-강": {
    rank: "양반",
    job: "홍문관 교리",
    line: "임금 곁에서 경연을 준비하던 학자 관리",
    origin: "대대로 문과 급제자를 낸 한양 북촌의 양반가에서 태어났다. 다섯 살에 천자문을 떼자 집안 어른들이 벌써부터 ‘우리 집 대제학’이라 불렀다.",
    day: [
      "경서 한 권을 소리 내어 읽고 나서야 입궐 가마에 올랐다.",
      "임금께 올릴 강의 자료를 고르다 동료와 주석 한 줄로 반나절을 다퉜다.",
      "집에 돌아와서도 붓을 놓지 못해 부인에게 핀잔을 들었다.",
    ],
    crisis: "경연에서 임금의 풀이가 틀렸다고 그 자리에서 아뢴 날, 조정이 얼어붙었다. 대신들은 파직을 청했으나 임금은 사흘 밤을 고민한 끝에 ‘그 말이 옳다’며 술을 내렸다. 그 뒤로 입바른 소리를 하기 전 한 번 더 숨을 고르는 버릇이 생겼다.",
    rise: 4,
    riseText: "정승 반열까지 오를 그릇이었다. 다만 입바른 소리 한 번에 유배를 갈 뻔한 적이 있다.",
    ending: "말년에는 벼슬을 내려놓고 고향에 서원을 열었다. 제자들이 엮은 문집은 백 년 뒤까지 읽혔다.",
    now: "지금으로 치면 연구·기획·전문 강의 쪽 기질이다.",
  },
  "인성-약": {
    rank: "양반",
    job: "시골 서당 훈장",
    line: "벼슬은 못 했지만 동네에서 글을 제일 잘 쓰던 몰락 양반",
    origin: "할아버지 대에 벼슬이 끊긴 시골 양반가에서 태어났다. 집에 남은 것은 책 몇 수레와 족보뿐이었으나, 글 읽는 소리만큼은 끊긴 적이 없었다.",
    day: [
      "코흘리개 아이들에게 천자문을 외우게 하며 하루를 열었다.",
      "이웃의 편지와 소장을 대신 써 주고 곡식 한 됫박을 받았다.",
      "호롱불 아래 과거 공부를 했으나, 올해도 낙방이었다.",
    ],
    crisis: "흉년이 든 해, 서당에 오는 아이가 절반으로 줄었다. 곡식 대신 글을 팔 생각으로 장터에 대서소를 차렸는데, 이것이 소문이 나서 고을 사또의 편지까지 대신 쓰게 되었다. 덕분에 그해 겨울을 넘겼다.",
    rise: 2,
    riseText: "과거에는 여러 번 떨어졌지만, 가르친 제자 하나가 판서가 되어 은혜를 갚았다.",
    ending: "여든까지 서당을 지켰다. 제자들이 세운 비석에는 ‘글보다 사람을 가르친 이’라고 새겨졌다.",
    now: "지금으로 치면 교육·상담·글쓰기 쪽 기질이다.",
  },
  "관성-강": {
    rank: "양반",
    job: "사헌부 감찰",
    line: "관리들의 비리를 캐던 조선의 감사관",
    origin: "청렴하기로 소문난 가난한 선비 집안에서 태어났다. 어릴 적 이웃집 아이가 참외 하나를 훔친 일을 끝까지 따져 묻다가 동네에서 ‘꼬마 사또’라는 별명을 얻었다.",
    day: [
      "탐관오리의 장부를 한 장씩 넘기며 숫자가 어긋난 곳을 찾았다.",
      "대낮에 관아를 불시에 들이닥쳐 창고 문을 열게 했다.",
      "원한을 산 자들을 피해 늘 다른 골목으로 퇴청했다.",
    ],
    crisis: "뒤를 캐던 탐관오리가 알고 보니 정승의 처남이었다. 장부를 덮으라는 압력과 뇌물이 번갈아 들어왔지만, 끝내 임금 앞에 장부를 펼쳤다. 그 일로 한동안 먼 고을로 좌천되었다.",
    rise: 4,
    riseText: "강직하다는 평으로 대사헌까지 올랐다. 적도 그만큼 많았다.",
    ending: "물러난 뒤에도 매일 아침 조보를 읽으며 혀를 찼다. 장례 날, 그를 미워하던 이들도 조용히 문상을 왔다.",
    now: "지금으로 치면 법·감사·품질 관리 쪽 기질이다.",
  },
  "관성-약": {
    rank: "중인",
    job: "관상감 명과학 훈도",
    line: "왕실의 사주와 택일을 맡던 관원, 정 훈도의 동료",
    origin: "대대로 관상감에 나가는 중인 집안에서 태어났다. 걸음마보다 산가지 셈을 먼저 배웠고, 여덟 살에 이미 스물네 절기를 줄줄 외웠다.",
    day: [
      "새벽 절기 시각을 셈하느라 산가지를 잔뜩 늘어놓았다.",
      "왕자와 공주의 혼사 궁합을 심사하며 서류 더미에 묻혔다.",
      "밤이면 관상감 옥상에서 별을 지켜보는 당직을 섰다.",
    ],
    crisis: "왕자의 혼사 궁합을 보다 ‘맞지 않는다’고 적어 올렸다가 윗선의 눈 밖에 났다. 모두가 고쳐 쓰라 했으나 끝까지 붓을 대지 않았다. 몇 해 뒤 그 혼사가 깨지자, 그제야 사람들이 그의 이름을 기억했다.",
    rise: 2,
    riseText: "중인이라 품계는 정해져 있었지만, 왕실의 비밀을 가장 많이 아는 사람이었다.",
    ending: "평생 관상감을 떠나지 않았다. 그가 남긴 택일 기록은 두고두고 후배들의 교본이 되었다.",
    now: "지금으로 치면 데이터 분석·컨설팅·꼼꼼한 전문직 기질이다.",
  },
  "재성-강": {
    rank: "중인",
    job: "사역원 역관",
    line: "청나라를 오가며 통역하고 슬쩍 무역도 하던 조선의 부자",
    origin: "사역원 역관을 여럿 낸 중인 집안에서 태어났다. 아버지가 청나라에서 사 온 그림책으로 말을 배워, 조선말 존댓말보다 청나라 말 흥정을 먼저 익혔다.",
    day: [
      "사신단을 따라 압록강을 건너며 청나라 말을 중얼중얼 연습했다.",
      "통역을 마치고 나면 몰래 챙겨 간 인삼을 비단과 바꿨다.",
      "한양으로 돌아와 세 번째 기와집을 알아보러 다녔다.",
    ],
    crisis: "사행길에 몰래 챙긴 인삼이 국경 검문에 걸렸다. 전 재산을 날릴 판에, 청나라 관리와 사흘 밤을 지새우며 말솜씨 하나로 풀려났다. 대신 그해 이문은 한 푼도 남지 않았다.",
    rise: 3,
    riseText: "벼슬은 양반만 못했지만, 곳간은 웬만한 판서보다 넉넉했다.",
    ending: "한양에 기와집 세 채를 남기고 눈을 감았다. 유언은 ‘장부는 태우고, 말은 가르쳐라’였다.",
    now: "지금으로 치면 무역·영업·재테크 쪽 기질이다.",
  },
  "재성-약": {
    rank: "상민",
    job: "보부상",
    line: "등짐 하나로 팔도 장터를 누비던 장돌뱅이",
    origin: "장터를 떠돌던 보부상 부부 사이에서, 그것도 장날 주막 뒷방에서 태어났다. 걸음을 떼자마자 아버지 등짐 위에 얹혀 팔도를 구경했다.",
    day: [
      "닭 울기 전에 짐을 지고 다음 장터로 길을 나섰다.",
      "종일 목이 쉬도록 흥정해 소금 한 섬을 남겼다.",
      "주막에서 팔도 소문을 모아 다음 장사거리를 점쳤다.",
    ],
    crisis: "대관령을 넘다 산적을 만나 등짐을 통째로 빼앗겼다. 빈손으로 주막에 앉아 있는데, 전에 외상을 받아 준 객주가 선뜻 밑천을 빌려주었다. 그때 배운 것이 ‘사람이 곧 밑천’이라는 말이었다.",
    rise: 2,
    riseText: "등짐 하나로 시작했지만, 발품을 판 끝에 객주를 차릴 수 있었다.",
    ending: "쉰 무렵 마포나루에 객주를 차려 보부상들의 쉼터가 되었다. 팔도의 장돌뱅이들이 그의 이름만 대면 외상을 받아 주었다.",
    now: "지금으로 치면 영업·유통·프리랜서 기질이다.",
  },
  "식상-강": {
    rank: "중인",
    job: "도화서 화원",
    line: "임금의 초상(어진)을 그리던 궁중 화가",
    origin: "도화서 화원의 집안에서 태어났다. 붓을 쥐여 주기도 전에 부엌 숯으로 벽에 닭을 그려, 어머니가 혼을 내려다 말고 한참을 들여다보았다.",
    day: [
      "안료를 곱게 갈아 붓끝을 다듬는 것으로 하루를 시작했다.",
      "궁중 잔치를 그림으로 남기느라 하루 종일 붓을 놀렸다.",
      "밤이면 몰래 저잣거리 풍경을 그려 친구들에게 돌렸다.",
    ],
    crisis: "어진을 그리다 임금 얼굴의 점 하나를 빼먹어 경을 칠 뻔했다. 밤새 다시 그려 올렸더니 임금이 ‘이번 것이 더 닮았다’며 웃었다. 그 뒤로는 붓을 들기 전 꼭 세 번 들여다보는 버릇이 생겼다.",
    rise: 3,
    riseText: "어진 화사로 뽑히면 벼슬까지 받을 수 있었다. 풍속화는 이름 없이 남았다.",
    ending: "눈이 침침해진 뒤에도 하루 한 장씩 저잣거리를 그렸다. 이름 없이 남은 그 그림들이 훗날 조선 풍속화의 보물이 되었다.",
    now: "지금으로 치면 디자인·영상·크리에이터 기질이다.",
  },
  "식상-약": {
    rank: "천민",
    job: "남사당패 광대",
    line: "줄 위에서 양반을 풍자하던 재주꾼",
    origin: "남사당패를 따라다니던 떠돌이 집안에서 태어났다. 말보다 재주넘기를 먼저 배웠고, 일곱 살에 처음 줄 위에 올라 구경꾼의 엽전을 받았다.",
    day: [
      "새벽 공터에서 줄타기 연습을 하다 몇 번이고 떨어졌다.",
      "장터 한복판에서 양반 흉내를 내 구경꾼을 뒤집어지게 했다.",
      "공연이 끝나면 짐을 싸서 다음 고을로 밤길을 걸었다.",
    ],
    crisis: "양반 흉내가 너무 똑같아서 그 고을 양반이 관아에 고발했다. 곤장을 맞을 뻔했으나, 구경하던 사또가 배꼽을 잡고 웃는 바람에 엽전 한 꾸러미를 받고 풀려났다. 그날 이후 그 놀이판이 팔도에 퍼졌다.",
    rise: 1,
    riseText: "신분은 가장 낮았지만, 이름만큼은 팔도에 퍼졌다.",
    ending: "늙어서는 줄에서 내려와 어린 광대들을 가르쳤다. 그가 지은 재담은 주인이 바뀌어도 오래도록 장터에서 불렸다.",
    now: "지금으로 치면 방송·공연·유튜버 기질이다.",
  },
  "비겁-강": {
    rank: "양반",
    job: "훈련도감 무관",
    line: "군사를 호령하던 무인",
    origin: "무과 급제자를 여럿 낸 무반 집안에서 태어났다. 열 살에 아버지의 활을 몰래 당기다 어깨를 다쳤는데, 울기는커녕 한 번 더 당겨 보겠다고 떼를 썼다.",
    day: [
      "새벽 활터에서 화살 오십 발을 쏘고 나서야 아침을 먹었다.",
      "군사들을 조련하며 목청이 터지도록 호령했다.",
      "밤에는 부하들과 술잔을 기울이며 의리를 다졌다.",
    ],
    crisis: "변방에 오랑캐가 쳐들어왔을 때 상관의 명을 어기고 먼저 군사를 몰아 나갔다. 싸움은 이겼지만 명을 어긴 죄로 옥에 갇혔다. 임금이 전공을 듣고 풀어 주며 ‘다음에는 명을 받고 이기라’고 했다.",
    rise: 4,
    riseText: "전공을 세워 훈련대장까지 오를 수 있었다. 다만 문관들과는 늘 사이가 나빴다.",
    ending: "훈련대장으로 물러난 뒤에도 새벽 활터를 떠나지 않았다. 그가 적어 둔 병법 쪽지는 군영에서 몰래 돌려 읽혔다.",
    now: "지금으로 치면 스포츠·현장 리더·창업 기질이다.",
  },
  "비겁-약": {
    rank: "상민",
    job: "포도청 포졸",
    line: "한양 골목을 지키던 순라꾼",
    origin: "한양 성 밖 가난한 상민 집안에서 태어났다. 동네 싸움판에서 늘 약한 쪽 편을 들다 코피가 마를 날이 없었다.",
    day: [
      "밤새 순라를 돌고 새벽에야 포도청으로 돌아왔다.",
      "도둑을 쫓아 골목을 세 바퀴 돌다 놓쳤다.",
      "국밥 한 그릇으로 허기를 달래며 다음 순번을 기다렸다.",
    ],
    crisis: "쫓던 도둑이 알고 보니 굶주린 아이였다. 포도청에 넘기는 대신 국밥 한 그릇을 사 먹이고 돌려보냈다가 상관에게 크게 혼났다. 몇 해 뒤 그 아이가 큰 도적 떼의 소굴을 몰래 알려 주었다.",
    rise: 2,
    riseText: "큰 도적 하나만 잡으면 포교로 오를 수 있었다. 그 한 번이 늘 아슬아슬했다.",
    ending: "끝내 포교에 올라 한양 골목의 대장이 되었다. 그가 순라를 돌던 동네는 밤에도 문을 걸지 않았다고 한다.",
    now: "지금으로 치면 현장직·보안·몸 쓰는 일 기질이다.",
  },
  "고른-양": {
    rank: "상민",
    job: "운종가 주막 주인",
    line: "사람과 소문이 모이던 한양 한복판의 주막을 꾸리던 사람",
    origin: "운종가 뒷골목, 국밥집 부엌에서 태어났다. 걸음마를 떼기 전부터 손님들의 흥정과 소문을 자장가 삼아 들었다.",
    day: [
      "새벽부터 국밥 솥에 불을 지피고 막걸리를 걸렀다.",
      "손님들 싸움을 말리며 팔도 소문을 귀에 담았다.",
      "문을 닫고 나면 그날 들은 소문을 비싸게 팔 곳을 셈했다.",
    ],
    crisis: "큰불이 운종가를 휩쓸어 주막이 반쯤 탔다. 망연자실하던 차에, 외상 장부에 적힌 단골들이 하나둘 쌀과 목재를 지고 찾아왔다. 한 달 만에 주막은 전보다 크게 다시 문을 열었다.",
    rise: 3,
    riseText: "정보가 곧 돈이었다. 주막 하나가 세\u00a0채가 되었다.",
    ending: "주막 세 채를 자식들에게 나누어 주고, 자신은 가장 작은 첫 주막에 남았다. 마지막 날까지 국밥 간은 직접 보았다.",
    now: "지금으로 치면 자영업·서비스·커뮤니티 운영 기질이다.",
  },
  "고른-음": {
    rank: "중인",
    job: "내의원 의관",
    line: "임금의 맥을 짚던 궁중 의사",
    origin: "대대로 의원을 낸 중인 집안에서 태어났다. 어릴 적 소꿉놀이도 약초 달이기였고, 동네 강아지 다리를 싸매 주다 칭찬 대신 물린 적도 있다.",
    day: [
      "새벽 문안 때 임금의 맥을 짚으며 숨을 죽였다.",
      "약재 창고에서 감초와 인삼의 무게를 달았다.",
      "밤이면 의서를 베껴 쓰며 처방을 궁리했다.",
    ],
    crisis: "임금이 갑자기 쓰러진 밤, 다른 의관들이 서로 눈치만 볼 때 먼저 침을 들었다. 한 시진 뒤 임금이 눈을 떴고, 그 공으로 품계가 올랐다. 하지만 그 밤 이후 한동안 손이 떨려 붓을 잡지 못했다.",
    rise: 3,
    riseText: "임금의 병을 고치면 품계가 올랐다. 못 고치면 책임도 그만큼 무거웠다.",
    ending: "내의원에서 물러난 뒤 성 밖에 약방을 열어 가난한 이들을 공짜로 보았다. 그가 남긴 처방 공책은 제자들이 베껴 나누어 가졌다.",
    now: "지금으로 치면 의료·돌봄·전문 상담 기질이다.",
  },
};

// Four-character charts (made before the full chart was stored) fall back to the day stem.
const LEGACY: string[] = ["비겁-강", "재성-약", "식상-강", "인성-약", "관성-강", "고른-음", "비겁-강", "관성-약", "재성-강", "인성-강"];

function keyOf(p: Pillars): { key: string; group: GodGroup | "고른" } {
  const chart = readChart(p);
  if (!chart) {
    const key = LEGACY[p.dayStem];
    return { key, group: key.split("-")[0] as GodGroup | "고른" };
  }
  // The group that weighs most once every hidden stem is counted (지장간) sets the calling.
  const entries = Object.entries(chart.godWeights) as [GodGroup, number][];
  const total = entries.reduce((a, [, w]) => a + w, 0);
  const [group, weight] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const yang = p.dayStem % 2 === 0;
  // No group stands out (the heaviest at 35% or less, about one chart in five): an evenly spread chart, split
  // evenly between the two even-handed callings by the day branch.
  if (weight / total <= 0.35) return { key: (p.dayBranch >> 1) % 2 === 0 ? "고른-양" : "고른-음", group: "고른" };
  // A yang day master takes the outward, louder calling of its group; a yin one the quieter one.
  return { key: `${group}-${yang ? "강" : "약"}`, group };
}

export function sinbunOf(p: Pillars): Sinbun {
  return JOBS[keyOf(p).key];
}

// ── The full free report: seven chapters, like the 가상 실록 ──

// What the neighbours said, from how strong the day master is…
const STRENGTH_TALK: Record<Strength, string> = {
  극신강: "고집이 황소 같아서 한번 정한 일은 누가 말려도 해냈다. 사람들은 무서워하면서도 일이 터지면 제일 먼저 그대를 찾았다.",
  신강: "제 몫은 제가 챙기는 사람이었다. 남에게 기대는 법이 없어 믿음직했지만, 도와 달라는 말을 못 해 혼자 끙끙 앓는 날도 있었다.",
  신약: "남의 말에 귀가 얇은 편이었지만, 그만큼 사람을 품을 줄 알았다. 그대 곁에는 늘 누군가 있었다.",
  극신약: "혼자서는 약했으나 좋은 사람을 만나면 몇 배로 빛나는 사람이었다. 그래서 누구와 어울리느냐가 인생을 갈랐다.",
};
// …and from the ten-god group that crowds the chart.
const GROUP_TALK: Record<GodGroup | "고른", string> = {
  비겁: "동네에서는 ‘저 사람은 벗이 곧 재산’이라 했다. 의리 하나는 조선 제일이라는 평이었다.",
  식상: "동네에서는 ‘저 사람이 입만 열면 판이 벌어진다’고 했다. 말과 재주로 사람을 모으는 이였다.",
  재성: "동네에서는 ‘저 사람 손에 들어가면 엽전이 새끼를 친다’고 했다. 셈이 밝다는 평이었다.",
  관성: "동네에서는 ‘저 사람 앞에서는 절로 줄을 서게 된다’고 했다. 규칙과 체면을 목숨처럼 여긴다는 평이었다.",
  인성: "동네에서는 ‘모르는 게 있으면 저 집에 가 보라’고 했다. 배움이 깊다는 평이었다.",
  고른: "동네에서는 ‘저 사람은 어디에 둬도 제 몫을 한다’고 했다. 두루두루 모난 데가 없다는 평이었다.",
};
// A missing element leaves one small, very human habit.
const MISSING_HABIT = [
  "다만 새로 시작하는 일에는 늘 굼떴다. 이사 한 번 하는 데 삼 년이 걸렸다.",
  "다만 잔치 자리에서는 늘 구석에 있었다. 흥이 오르기까지 막걸리 세 사발이 필요했다.",
  "다만 한곳에 오래 머물지를 못했다. 짐을 풀었다 쌌다 하는 게 일이었다.",
  "다만 딱 잘라 거절하는 법을 몰라, 빌려준 엽전을 끝내 못 받은 적이 여러 번이었다.",
  "다만 앞뒤 재지 않고 뛰어들었다가 뒷수습에 진땀을 뺀 일이 많았다.",
];
// 귀인 from the 용신 element, 악연 from the 기신 element.
const HELPER = [
  "새 일을 벌이자고 먼저 손을 내민 벗이었다. 함께 시작한 일은 번번이 잘 풀렸다.",
  "그대를 사람들 앞에 세워 준 이였다. 잔칫상에서 그대의 이름을 먼저 불러 주었다.",
  "말수는 적어도 늘 그 자리에 있던 이웃이었다. 어려울 때 곳간 문을 먼저 열어 주었다.",
  "쓴소리를 아끼지 않던 윗사람이었다. 그 잔소리 덕에 큰 실수를 여러 번 피했다.",
  "소식과 정보를 물어다 주던 이였다. 남보다 한발 먼저 움직일 수 있었던 건 그 덕이었다.",
];
const TROUBLE = [
  "일만 벌여 놓고 뒷감당은 그대에게 떠넘기던 사람",
  "그대의 공을 제 것처럼 떠벌리던 사람",
  "‘원래 이렇게 해 왔다’며 발목을 잡던 사람",
  "칼같이 따지며 그대의 기를 꺾던 사람",
  "앞에서는 웃고 뒤에서 말을 옮기던 사람",
];

export type SinbunStory = Sinbun & {
  // `labels` turns a chapter into a labelled list (the 새벽 / 낮 / 밤 of a day).
  chapters: { title: string; paras: string[]; labels?: string[] }[];
  yong: number;
  gi: number;
  strength: Strength | null;
};

export function sinbunStory(p: Pillars): SinbunStory {
  const { key, group } = keyOf(p);
  const s = JOBS[key];
  const chart = readChart(p);
  // Four-character charts have no strength reading; fall back to the element that feeds the day master.
  const dayEl = stemEl(p.dayStem);
  const yong = chart?.yong ?? (dayEl + 4) % 5;
  const gi = chart?.gi ?? (yong + 3) % 5;
  const talk = [chart ? STRENGTH_TALK[chart.strength] : null, GROUP_TALK[group], chart?.missing.length ? MISSING_HABIT[chart.missing[0]] : null];

  return {
    ...s,
    yong,
    gi,
    strength: chart?.strength ?? null,
    chapters: [
      { title: "태어난 집", paras: [s.origin] },
      { title: `${s.job}의 하루`, paras: [...s.day], labels: ["새벽", "낮", "밤"] },
      { title: "사람들이 본 그대", paras: talk.filter((t): t is string => Boolean(t)) },
      { title: "인생의 고비", paras: [s.crisis] },
      {
        title: "귀인과 악연",
        paras: [
          `그대의 귀인은 ${ELEMENT_KO[yong]}(${ELEMENT_HANJA[yong]})의 기운을 가진 사람, ${HELPER[yong]}`,
          `멀리했어야 할 사람은 ${ELEMENT_KO[gi]}(${ELEMENT_HANJA[gi]})의 기운, ${TROUBLE[gi]}이었다. 그와 얽힌 해에는 꼭 일이 꼬였다.`,
        ],
      },
      { title: "출세", paras: [s.riseText] },
      { title: "말년", paras: [s.ending] },
    ],
  };
}
