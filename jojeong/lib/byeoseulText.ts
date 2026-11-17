import type { Exam, Post, Tier, Trial } from "./byeoseul";

// The words of 벼슬길 (lib/byeoseul.ts). Offices and exams are the real ones of Joseon; each gate's reason names
// the part of the chart it was read from, so the chart's door is never a guess.

export const EXAM_TEXT: Record<Exam, { name: string; hanja: string; line: string; why: string }> = {
  mun: { name: "문과", hanja: "文科", line: "경서와 글로 겨루는 과거. 붓으로 나라를 다스리는 길", why: "배움의 기운(인성)과 질서의 기운(정관)이 받쳐 주는 사주" },
  mu: { name: "무과", hanja: "武科", line: "활과 말과 병법으로 겨루는 과거. 칼로 나라를 지키는 길", why: "내 힘(비겁)과 압박을 견디는 기운(편관)이 센 사주" },
  jap: { name: "잡과", hanja: "雜科", line: "통역, 의술, 천문, 법률의 전문가를 뽑는 과거. 재주로 서는 길", why: "재주의 기운(식상)과 세상을 다루는 기운(재성)이 도드라진 사주" },
};

export const POST_TEXT: Record<Post, { name: string; line: string; why: string }> = {
  hongmun: { name: "홍문관", line: "임금의 학문을 돕고 글을 짓는 곳", why: "글과 배움의 기운(정인)이 깊어서" },
  saheon: { name: "사헌부", line: "관리의 잘못을 따지고 바른말을 하는 곳", why: "할 말은 하는 기운(상관)이 관(官)과 함께 있어서" },
  seungjeong: { name: "승정원", line: "임금 곁에서 명을 받들어 전하는 곳", why: "질서(정관)와 꼼꼼한 살림(정재)이 고루 있어서" },
  suryeong: { name: "지방 수령", line: "한 고을을 맡아 다스리는 사또", why: "살림과 사람을 다루는 기운(재성)이 넉넉해서" },
  seonjeon: { name: "선전관", line: "임금을 곁에서 호위하는 무관", why: "규율의 기운(정관)이 무관의 자리와 맞아서" },
  hullyeon: { name: "훈련도감", line: "군사를 길러 내는 군영", why: "함께 서는 힘(비겁)이 두터워서" },
  byeonbang: { name: "변방 진", line: "국경을 지키는 진영", why: "거센 기운을 견디는 힘(편관)과 떠도는 별(역마)이 있어서" },
  podo: { name: "포도청", line: "도적을 잡는 관청", why: "날카로운 기운(상관)과 다스리는 힘(편관)이 만나서" },
  yeokgwan: { name: "사역원", line: "외국 말을 맡아 사신을 따르는 역관", why: "바깥을 다루는 기운(편재)과 움직이는 별(역마)이 있어서" },
  naeui: { name: "내의원", line: "임금의 몸을 돌보는 의원", why: "기르고 살리는 기운(식신)이 배움(인성)과 함께 있어서" },
  gwansang: { name: "관상감", line: "하늘을 살피고 좋은 날을 고르는 곳. 정 훈도도 이곳 사람이옵니다", why: "남다른 직관(편인)과 홀로 깊어지는 별(화개)이 있어서" },
  yulgwan: { name: "형조 율관", line: "법을 따져 옳고 그름을 가리는 관리", why: "원칙의 기운(관성)에 날카로운 판단(상관)이 더해져서" },
};

export const TRIAL_TEXT: Record<Trial, { name: string; line: string; why: string }> = {
  exile: { name: "유배", line: "한때 먼 섬으로 귀양을 떠났사옵니다. 그 섬에서 보낸 몇 해가 사람을 바꾸었지요", why: "사주의 글자가 정면으로 부딪히는 자리(충)가 깊어서" },
  war: { name: "전쟁", line: "나라에 난리가 나 칼을 들고 나섰사옵니다. 위기에서 이름이 났지요", why: "센 기운의 일주(괴강, 백호)라 큰 일에 불려 나가서" },
  faction: { name: "당쟁", line: "조정이 둘로 갈라져 자리를 잃을 뻔했사옵니다. 버틴 끝에 다시 섰지요", why: "같은 편끼리 다투는 기운(비겁)이 관(官)보다 앞서서" },
  patron: { name: "귀인의 발탁", line: "높은 분의 눈에 들어 단숨에 발탁되었사옵니다", why: "태어난 달과 날 가까이 귀인의 별(천을귀인)이 있어서" },
  calm: { name: "조용한 십 년", line: "큰 풍파 없이 맡은 일을 다하며 십 년을 보냈사옵니다", why: "부딪히는 자리도 큰 별도 없어 물길이 고요해서" },
};

// The last office, by the post the career began in and how high it rose.
export const END_TEXT: Record<Post, Record<Tier, string>> = {
  hongmun: { high: "홍문관 대제학", mid: "홍문관 응교", low: "낙향해 서원을 연 선비" },
  saheon: { high: "사헌부 대사헌", mid: "사헌부 장령", low: "바른말 끝에 물러난 언관" },
  seungjeong: { high: "이조판서", mid: "승정원 승지", low: "고향으로 돌아간 훈장" },
  suryeong: { high: "관찰사", mid: "고을 사또", low: "백성이 비석을 세워 준 현감" },
  seonjeon: { high: "금위대장", mid: "선전관", low: "궁궐 문을 지킨 늙은 무관" },
  hullyeon: { high: "훈련대장", mid: "훈련도감 초관", low: "활을 가르친 교관" },
  byeonbang: { high: "병마절도사", mid: "변방 첨절제사", low: "국경 마을의 늙은 장수" },
  podo: { high: "포도대장", mid: "포도청 종사관", low: "저잣거리에 이름난 포교" },
  yeokgwan: { high: "당상 역관", mid: "사역원 역관", low: "무역으로 거부가 된 역관" },
  naeui: { high: "어의", mid: "내의원 의관", low: "마을 약방의 명의" },
  gwansang: { high: "관상감 정", mid: "관상감 훈도", low: "별을 보며 산 은자" },
  yulgwan: { high: "형조 율학교수", mid: "형조 율관", low: "억울한 백성을 돕는 송사꾼" },
};

// 같은 문, 같은 높이라도 사람마다 이름이 다르게 (대표님 11/17): the 일간's element (木火土金水) colors the last
// office. A high or middle office takes an epithet; a low end, which is a life rather than an office, is told
// whole in five ways.
const EPITHET = ["새 길을 연", "이름을 떨친", "모두가 따른", "곧기로 이름난", "지혜로 이름난"];
const LOW: Record<Post, [string, string, string, string, string]> = {
  hongmun: ["낙향해 서원을 연 선비", "낙향해 시로 이름난 선비", "고향에 서당을 세운 선비", "벼슬을 버리고 절개를 지킨 선비", "강가에 숨어 책을 쓴 선비"],
  saheon: ["바른말 끝에 물러나 후학을 기른 언관", "바른말 끝에 귀양 가 이름을 남긴 언관", "바른말 끝에 물러나 고향을 지킨 언관", "바른말 끝에 스스로 물러난 언관", "바른말 끝에 물러나 상소문집을 남긴 언관"],
  seungjeong: ["고향으로 돌아가 아이들을 가르친 훈장", "고향에서 이름난 글방 훈장", "고향 마을의 큰어른", "고향으로 돌아가 족보를 바로잡은 선비", "고향으로 돌아가 일기를 남긴 선비"],
  suryeong: ["백성이 비석을 세워 준 현감", "백성이 노래를 지어 준 현감", "흉년에 곳간을 연 현감", "뇌물을 돌려보낸 청백리 현감", "물길을 내어 들판을 살린 현감"],
  seonjeon: ["궁궐 문을 지킨 늙은 무관", "활 솜씨로 이름난 늙은 무관", "임금이 끝까지 곁에 둔 늙은 무관", "칼 한 자루로 평생을 지킨 무관", "궁궐 일을 다 아는 늙은 무관"],
  hullyeon: ["활을 가르친 교관", "군가를 지은 교관", "병사들이 아버지라 부른 교관", "엄하기로 이름난 교관", "병법서를 남긴 교관"],
  byeonbang: ["국경 마을을 일군 늙은 장수", "오랑캐도 이름을 아는 장수", "국경 마을이 믿고 기댄 장수", "성 하나를 끝까지 지킨 장수", "국경의 지도를 그린 장수"],
  podo: ["골목마다 아는 이가 있는 포교", "저잣거리에 이름난 포교", "억울한 이를 풀어 준 포교", "도적들이 가장 무서워한 포교", "한 번 본 얼굴은 잊지 않은 포교"],
  yeokgwan: ["새 뱃길을 연 역관", "무역으로 거부가 된 역관", "사신들이 믿고 찾은 역관", "셈이 정확하기로 이름난 역관", "세 나라 말을 한 역관"],
  naeui: ["마을 약방의 명의", "전염병을 막아 낸 의원", "가난한 이에게 값을 받지 않은 의원", "침술로 이름난 의원", "의서를 남긴 의원"],
  gwansang: ["별을 보며 산 은자", "혜성을 먼저 알아본 은자", "농사 날을 일러 준 마을 어른", "달력을 바로잡은 은자", "하늘의 기록을 남긴 은자"],
  yulgwan: ["억울한 백성을 돕는 송사꾼", "말솜씨로 이름난 송사꾼", "마을 다툼을 풀어 준 어른", "한 번도 지지 않은 송사꾼", "법전을 풀어 쓴 선비"],
};

export function endTitle(post: Post, tier: Tier, dayStem: number): string {
  const el = Math.floor(dayStem / 2);
  return tier === "low" ? LOW[post][el] : `${EPITHET[el]} ${END_TEXT[post][tier]}`;
}

const KO_NUM = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉"];
const KO_TENS = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든"];
// 스물셋, 서른, 마흔하나: an age read aloud, as the 사극체 says it.
export function ageWord(n: number): string {
  const t = Math.floor(n / 10);
  const o = n % 10;
  const tens = t === 2 && o > 0 ? "스물" : KO_TENS[t];
  return tens + (o === 0 ? "" : o === 1 ? "하나" : o === 2 ? "둘" : o === 3 ? "셋" : o === 4 ? "넷" : KO_NUM[o]);
}
