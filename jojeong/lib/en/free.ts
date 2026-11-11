import { freeReadingOf, type Mood } from "@/lib/freeReading";
import { WORK_TYPES } from "@/lib/domains";
import { readChart, type GodGroup, type TenGod } from "@/lib/myeongri";
import { distinctOf } from "@/lib/rarity";
import { profileOf, type Person } from "@/lib/pairToken";
import { isFull } from "@/lib/saju";

// The English free reading: the Korean one (lib/freeReading.ts, lib/rarity.ts distinctOf) computed exactly as it is,
// then told in English. Every number, rank and verdict is the Korean screen's; only the words change, and each
// block gains one plain line on what it is, for a reader who has never seen a saju chart.

export const ELEMENT_EN = ["Wood", "Fire", "Earth", "Metal", "Water"];

export const POWER_EN: Record<GodGroup, { name: string; what: string; high: string; low: string }> = {
  비겁: {
    name: "Self-reliance",
    what: "characters like you: pride, friends, rivals",
    high: "You go your own way whatever anyone says. Asking for help is the hard part.",
    low: "You find it easy to fit in with others. Claiming your own share takes practice.",
  },
  식상: {
    name: "Expression",
    what: "what flows out of you: words, talent, making things",
    high: "Thoughts turn straight into words and work. Many talents, but holding back is hard.",
    low: "You keep a lot inside. Getting good ideas out into the world is your homework.",
  },
  재성: {
    name: "Money sense",
    what: "what you take hold of: money, practical sense",
    high: "You weigh gains and losses fast and have a sharp practical sense. If results don't show, you lose interest quickly.",
    low: "You chase meaning more than money. Set money rules in advance and let them run.",
  },
  관성: {
    name: "Duty and rules",
    what: "what holds you in line: work, structure, reputation",
    high: "You finish what you are given, whatever it takes. You push yourself too hard easily.",
    low: "You can't stand being boxed in. Free roles are where you shine.",
  },
  인성: {
    name: "Learning and support",
    what: "what feeds you: study, care, the people behind you",
    high: "You think deeply and prepare thoroughly. The start, though, comes late.",
    low: "You learn by doing rather than by reading. Quick to decide, sometimes short on preparation.",
  },
};

const SAL_EN: Record<string, { name: string; plain: string; line: string }> = {
  천을귀인: { name: "Heavenly Helper", plain: "Someone appears when you're stuck", line: "At a dead end, someone always seems to reach out a hand." },
  도화: { name: "Peach Blossom", plain: "A pull on people", line: "You draw eyes without trying; charm, style and expression become your tools." },
  역마: { name: "Traveling Horse", plain: "Luck that opens when you move", line: "Moving house, travel, going abroad, changing jobs: things open up when you move." },
  화개: { name: "Canopy", plain: "A deep world of your own", line: "You are drawn to work you can dig deep into: study, art, research." },
  문창귀인: { name: "Scholar Star", plain: "A gift for words and study", line: "You shine in work done with the mind: writing, exams, planning." },
  양인: { name: "Blade", plain: "Razor-sharp resolve", line: "Once you decide, you push through. Watch the flashes of temper and it is a great weapon." },
  괴강: { name: "Leader Star", plain: "A born leader's streak", line: "You play on a big board and find it hard to stay under someone for long. When it goes well, it goes very well." },
  백호: { name: "White Tiger", plain: "Strong drive", line: "Great drive, so take care with rushed decisions and with your body." },
};

export const MOOD_EN: Record<Mood, { mark: string; means: string }> = {
  활짝: { mark: "◎◎ In bloom", means: "What you need pours in; a decade of real momentum" },
  기회: { mark: "◎ Opening", means: "What you need comes in; a decade that gives you lift" },
  무난: { mark: "○ Steady", means: "Good and hard mixed; an even decade" },
  다지기: { mark: "△ Groundwork", means: "Heavy energies pile up; build foundations rather than expand" },
  버티기: { mark: "▽ Hold steady", means: "Strong friction; don't overreach, tidy up and hold on" },
};

// The decade lines (lib/decadeLine.ts PLAIN), Korean to English.
const DECADE_EN: Record<string, string> = {
  "판이 새로 짜이며 크게 움직이는 10년": "A decade of big moves as the board is reset",
  "판이 새로 짜이며 크게 움직인 10년": "A decade of big moves as the board was reset",
  "변화가 잦아 자리를 옮기기 쉬운 10년": "A decade of frequent change, when moving on comes easily",
  "변화가 잦았던 10년": "A decade of frequent change",
  "흔들림이 커서 지키는 힘이 필요한 10년": "A shaky decade that calls for holding your ground",
  "흔들림이 커서 버티는 힘이 필요했던 10년": "A shaky decade that called for holding on",
  "환경이 크게 바뀌며 자란 시기": "Growing up through big changes around you",
  "좋은 사람, 일과 손잡고 자리를 넓히는 10년": "A decade of joining hands with good people and work, and growing your place",
  "좋은 사람, 일과 손잡고 자리를 넓힌 10년": "A decade of joining hands with good people and work",
  "사람과 일이 엮이며 자리가 잡히는 10년": "A decade when people and work tie together and you settle in",
  "사람과 일이 엮이며 자리가 잡힌 10년": "A decade when people and work tied together and you settled in",
  "얽힌 관계에 발이 묶이기 쉬운 10년": "A decade when tangled ties can hold you back",
  "얽힌 관계에 발이 묶이기 쉬웠던 10년": "A decade when tangled ties held you back",
  "가까운 사람들과 정을 쌓으며 자란 시기": "Growing up close to the people around you",
  "흩어진 힘이 한곳으로 모여 밀고 나가는 10년": "A decade when scattered strengths gather and push forward",
  "흩어진 힘이 한곳으로 모여 밀고 나간 10년": "A decade when scattered strengths gathered and pushed forward",
  "힘이 한데 모여 방향이 잡히는 10년": "A decade when your strengths gather and find a direction",
  "힘이 한데 모여 방향이 잡힌 10년": "A decade when your strengths gathered and found a direction",
  "한쪽으로 힘이 쏠려 균형을 챙겨야 할 10년": "A decade leaning hard one way, when balance needs care",
  "한쪽으로 힘이 쏠려 균형이 아쉬웠던 10년": "A decade that leaned hard one way",
  "한 가지에 힘이 모이며 자란 시기": "Growing up with your energy gathered on one thing",
  "부딪히며 더 단단해지는 10년": "A decade of friction that makes you tougher",
  "부딪히며 더 단단해진 10년": "A decade of friction that made you tougher",
  "작은 마찰 속에 무뎌지지 않고 다듬어지는 10년": "A decade of small frictions that polish you",
  "작은 마찰 속에 다듬어진 10년": "A decade of small frictions that polished you",
  "깎이고 다듬어지며 실력을 쌓는 10년": "A decade of being ground down and refined, building real skill",
  "깎이고 다듬어지며 실력을 쌓은 10년": "A decade of being ground down and refined",
  "부대끼며 단단해진 시기": "Growing up tougher through rubbing shoulders",
  "속마음이 복잡해지기 쉬운 10년": "A decade when your inner feelings get tangled easily",
  "속마음이 복잡했던 10년": "A decade of tangled inner feelings",
  "마음속 생각이 많던 시기": "Growing up with a lot on your mind",
  "계획이 한 번씩 틀어지기 쉬운 10년": "A decade when plans go off course now and then",
  "계획이 한 번씩 틀어지곤 했던 10년": "A decade when plans went off course now and then",
  "계획대로만 되지 않던 시기": "Growing up when things rarely went to plan",
  "가까운 데서 발목 잡히기 쉬운 10년": "A decade when those close by can trip you up",
  "가까운 데서 발목 잡히기 쉬웠던 10년": "A decade when those close by tripped you up",
  "가까운 사이에서 부대끼며 자란 시기": "Growing up rubbing along with those closest to you",
  "마음 맞는 사람과 일이 곁에 생기는 10년": "A decade when like-minded people and work come your way",
  "마음 맞는 사람과 일이 곁에 생긴 10년": "A decade when like-minded people and work came your way",
  "정에 끌려 판단이 흐려지기 쉬운 10년": "A decade when affection can cloud your judgment",
  "정에 끌려 판단이 흐려지기 쉬웠던 10년": "A decade when affection clouded your judgment",
  "따뜻한 손길 속에 자란 시기": "Growing up in warm hands",
  "낡은 틀을 깨고 새 길로 나가는 10년": "A decade of breaking old molds and taking a new road",
  "낡은 틀을 깨고 새 길로 나간 10년": "A decade of breaking old molds and taking a new road",
  "생각과 방향이 자주 바뀌는 10년": "A decade when your mind and direction often change",
  "생각과 방향이 자주 바뀐 10년": "A decade when your mind and direction often changed",
  "마음이 크게 흔들려 중심을 잡아야 할 10년": "A decade of inner upheaval that calls for keeping your center",
  "마음이 크게 흔들렸던 10년": "A decade of inner upheaval",
  "없던 힘이 새로 생기는 10년": "A decade when a strength you never had appears",
  "없던 힘이 새로 생긴 10년": "A decade when a strength you never had appeared",
  "낯선 기운이 들어와 새 경험이 많은 10년": "A decade of unfamiliar energy and new experiences",
  "낯선 기운이 들어와 새 경험이 많았던 10년": "A decade of unfamiliar energy and new experiences",
  "낯선 기운이 처음 들어와 적응이 필요한 10년": "A decade when unfamiliar energy arrives and you must adapt",
  "낯선 기운이 처음 들어와 적응이 필요했던 10년": "A decade when unfamiliar energy arrived and you had to adapt",
  "새로운 것을 많이 접하며 자란 시기": "Growing up meeting lots of new things",
  "필요한 기운이 들어와 힘이 붙는 10년": "A decade when what you need comes in and you gain strength",
  "필요한 기운이 들어와 힘이 붙은 10년": "A decade when what you needed came in",
  "큰 굴곡 없이 고르게 흐르는 10년": "An even decade without big ups and downs",
  "큰 굴곡 없이 고르게 흐른 10년": "An even decade without big ups and downs",
  "무리하지 말고 기반을 다질 10년": "A decade to build foundations, not to overreach",
  "기반을 다지며 버틴 10년": "A decade of holding on and building foundations",
  "무난하게 자란 시기": "Growing up without much upheaval",
};
const decadeEn = (ko: string) => DECADE_EN[ko] ?? (ko.includes("다시 ") ? `${DECADE_EN[ko.replace("다시 ", "")] ?? ""}, once again` : "") ?? "";

// The money and love verdicts (lib/domains.ts domainCard): a fixed set of types and lines.
const CARD_EN: Record<string, string> = {
  "재주로 버는 사람": "Earns through talent",
  "잘하는 것이 그대로 돈이 되는 흐름이 살아 있어요. 내 이름을 걸고 파는 일에서 돈이 붙어요.": "What you're good at turns straight into money. Money follows work you put your own name on.",
  "기회를 잡아 버는 사람": "Earns by seizing chances",
  "돈의 흐름을 읽는 눈은 있는데, 스스로 만들어 내는 재주가 약해요. 좋은 판과 사람을 고르는 게 돈이에요.": "You read where money flows, but making it from scratch is harder. Choosing the right deals and people is where your money is.",
  "재주가 먼저인 사람": "Talent first",
  "재주는 넉넉한데 돈으로 잇는 고리가 약해요. 값을 매기고 파는 연습이 돈을 불러요.": "Plenty of talent, but the link to money is weak. Practice pricing and selling what you do.",
  "차곡차곡 쌓는 사람": "Builds up steadily",
  "돈 기운이 크게 드러나지 않아 한 방보다 꾸준함이 맞아요. 월급과 저축이 가장 큰 무기예요.": "Money energy doesn't show strongly, so steady beats the big hit. A salary and savings are your best weapons.",
  "늦게 피는 인연": "Love that blooms late",
  "배우자 자리가 합으로 묶여 정은 깊은데, 부딪히는 글자도 함께 있어요. 서두른 인연보다, 한 번 겪고 난 뒤 만나는 사람이 오래가요.":
    "Your partner seat is bound tight, so feelings run deep, but clashing characters sit there too. The one you meet after going through something lasts longer than a rushed match.",
  "배우자 자리가 흔들리는 구조예요. 일찍 만난 인연보다, 한 번 겪고 난 뒤 만나는 사람이 오래가요.": "Your partner seat is a shaky spot. The one you meet after going through something lasts longer than an early match.",
  "인연이 많은 사람": "Many people come your way",
  "배우자 기운이 넉넉해 사람이 자주 들어와요. 그런데 배우자 자리가 합으로 묶여 한번 정을 주면 오래 가니, 고르는 눈이 연애의 전부예요.":
    "There's plenty of partner energy, so people come often. But your partner seat is bound tight and once you give your heart it stays, so choosing well is everything.",
  "배우자 기운이 넉넉해 사람이 자주 들어와요. 고르는 눈이 연애의 전부예요.": "There's plenty of partner energy, so people come often. Choosing well is everything.",
  "스스로 찾아가야 하는 사람": "Love you have to go and find",
  "배우자 기운이 적어 기다리면 늦어져요. 내가 먼저 움직일 때 인연이 와요.": "Partner energy is low, so waiting makes it late. Love comes when you move first.",
  "한 사람과 깊어지는 사람": "Goes deep with one person",
  "배우자 자리가 합으로 묶여 있어요. 한번 정을 준 사람과 오래, 깊게 가는 연애가 맞아요.": "Your partner seat is bound tight. Long, deep love with one person suits you.",
  "배우자 자리가 안정돼 있어요. 넓게보다 한 사람과 깊게 가는 연애가 맞아요.": "Your partner seat is steady. Deep with one person suits you better than wide.",
};

const WORK_EN: Record<string, { name: string; where: string }> = {
  조직형: { name: "Organization builder", where: "climbing inside an organization, taking on roles and responsibility" },
  "전문, 자격형": { name: "Specialist", where: "expert fields where study and qualifications earn respect" },
  "창작, 기술형": { name: "Maker", where: "work you create with your own hands and mind" },
  사업형: { name: "Dealmaker", where: "setting up ventures and moving people and money" },
  독립형: { name: "Independent", where: "standing on your own name: freelance or your own business" },
};

const TOPIC_EN = { jaemul: "Money", yeonae: "Love", jikup: "Work" } as const;

const SEASON_EN = { 봄: "spring", 여름: "summer", 가을: "autumn", 겨울: "winter" } as const;
export const TEN_GOD_EN: Record<TenGod, string> = {
  비견: "Companion",
  겁재: "Rival",
  식신: "Creator",
  상관: "Rebel",
  편재: "Windfall Wealth",
  정재: "Steady Wealth",
  편관: "Challenger",
  정관: "Officer",
  편인: "Mystic",
  정인: "Nurturer",
};
const GROUP_OF_GOD: Record<TenGod, GodGroup> = { 비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상", 편재: "재성", 정재: "재성", 편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성" };

const EL_KO = "목화토금수";
const elFrom = (s: string) => [...s].flatMap((ch) => (EL_KO.includes(ch) ? [EL_KO.indexOf(ch)] : []));
const LACK_EN = ["the drive to start and reach out", "the passion to show yourself", "the strength to stay centered", "the resolve to cut and decide", "the calm to pause and think deeply"];
const GUK_EN = ["teaching, planning, growing things", "performing, broadcasting, being in front of people", "brokering, property, building trust", "technical work, law, jobs that need hard decisions", "research, trade, connecting people and information"];
const TRAIT_EN = ["an endless urge to grow, and stubbornness", "passion, impatience and hot feelings", "staying power, worry and a reluctance to move", "cool judgment and a sharp tongue", "deep thought and a guarded inner self"];
const PARTNER_EN: Record<GodGroup, string> = { 비겁: "friends and siblings", 식상: "talent and children", 재성: "money and romance", 관성: "work, status and partners", 인성: "study and your mother" };

type Pat = { plain: string; meaning: string };
// The rare findings (lib/patterns.ts), by id. The few that carry a value are read back from the Korean text.
function patternEn(id: string, plainKo: string, meaningKo: string, gender: "m" | "f" | null): Pat | null {
  const f = gender === "f";
  const m = gender === "m";
  switch (id) {
    case "jonggyeok": return { plain: "A rare structure that follows one energy", meaning: "Your chart is so full of one energy that it works by riding that current rather than balancing it. The usual advice to 'find balance' can be wrong for you." };
    case "junghwa": return { plain: "What holds you up and what draws you out are even", meaning: "Staying power and spending power are almost equal, so you adapt anywhere. But your 'this is it' moment comes late, and you may spend a long time unsure what you want." };
    case "johu-hot": return { plain: "A midsummer chart with the water dried up", meaning: "There's a lot of heat inside, so you're quick and fiery. Fast decisions, but watch for burnout, sleeplessness and emotional blowups. A calm, watery person nearby steadies you." };
    case "johu-cold": return { plain: "A midwinter chart with the fire gone out", meaning: "You think deeply and carefully, but starting is slow. You can sink into lethargy or low moods, so sunlight, exercise and human warmth open your luck." };
    case "gwansal-honjap": return f
      ? { plain: "Two very different kinds of men in one chart", meaning: "You tend to swing between the steady type and the one who pulls you in hard. Love can get complicated, and settling with one person takes time." }
      : { plain: "Two bosses pulling in different directions", meaning: "You often end up where orders conflict or responsibilities overlap. Not knowing whose word to follow has probably worn you out more than once." };
    case "gwan-heavy": return { plain: "Duty and pressure weigh on the chart", meaning: "You've always lived inside someone's expectations and rules. Your sense of duty is stronger than anyone's, but you push yourself to exhaustion." };
    case "no-gwan": return { plain: "Almost no energy of rules or organization", meaning: `Orders drain you; what you choose yourself absorbs you. You'd rather build your own game than fit into one.${f ? " Romance tends to come late, or with someone who feels like a friend." : ""}` };
    case "jaeda-sinyak": return { plain: "Money in sight, but not the strength to hold it", meaning: "Talk of money and chances comes often, yet little stays in your hands. You grow by sharing the load with people you trust, not by grabbing it all." };
    case "no-jae": return { plain: "Wealth energy doesn't show", meaning: `Chasing money itself rarely works; build skill and a name and money follows. You can be careless with sums and lose out.${m ? " Love and marriage also tend to ripen late." : ""}` };
    case "siksang-saengjae": return { plain: "Talent flows into money", meaning: "Doing what you love tends to turn into income: side projects, content, selling what comes from your own hands and voice." };
    case "siksang-heavy": return { plain: "Expression and talent overflow", meaning: "Words and ideas pour out, so you start many things but finishing is weak. Holding your tongue is hard, which invites gossip." };
    case "sanggwan-gyeongwan": return { plain: "A rule-breaking streak meets the rules", meaning: `You can't stand unfairness from bosses or organizations and you push back. You've likely said the right thing and paid for it.${f ? " With partners too, criticism can turn into arguments." : ""}` };
    case "gwanin-sangsaeng": return { plain: "Recognition turns into real skill", meaning: "Good luck with exams, qualifications and promotions. Seniors pull you up, and climbing step by step inside an organization suits you." };
    case "salin-sangsaeng": return { plain: "Turning pressure into learning", meaning: "The harder the setting, the more you learn your way through and step up. In every crisis, study and qualifications are your weapons." };
    case "siksin-jesal": return { plain: "Skill that tames rough situations", meaning: "Facing a crisis or a strong opponent, you turn the table with ability. You shine at settling conflicts and solving hard problems." };
    case "inseong-heavy": return { plain: "Thinking and nurturing overflow", meaning: "Many thoughts and perfect preparation, but slow to act. Your parents, especially your mother, likely had a big influence or a heavy hand." };
    case "no-inseong": return { plain: "No energy to lean on", meaning: "You've handled things on your own since childhood. Accepting help feels awkward, and you learn by doing more than from books." };
    case "pyeonin-dosik": return { plain: "Intuition and talent trip each other up", meaning: "Whenever you go for what you want, worry or other people's objections hold you back. You're unusually sensitive about food and making a living." };
    case "jae-geuk-in": return { plain: "Money and study collide", meaning: "You tend to choose reality, money, before long study. Values clash easily with your mother." };
    case "bigup-heavy": return { plain: "Many energies like your own", meaning: `Strong pride, stubbornness and competitiveness.${meaningKo.includes("동업") ? " When money mixes with siblings or friends you tend to lose out, so avoid partnerships and co-signing." : " Plenty of people around, but few you open up to completely."}` };
    case "no-bigup": return { plain: "No energy on your side", meaning: "Deciding and carrying things alone is familiar. Make a point of keeping people to lean on, so you can hold up when it's hard." };
    case "spouse-clash": return { plain: "The partner seat is shaken", meaning: "Close relationships tend to hit a big clash once or twice. The more you rush marriage the shakier it is; the later, the steadier." };
    case "spouse-hap": return { plain: "The partner seat is bound tight", meaning: "Once you give your heart, it stays. Relationships are strong, but letting go of ones you should end is hard." };
    case "spouse-mixed": return { plain: "Two very different kinds of women in one chart", meaning: "Your heart moves between the steady type and the free spirit. The kind of person you date can change a lot from one period to the next." };
    case "month-clash": return { plain: "The parents-and-work seat is shaken", meaning: "Lots of change around parents, home or workplace, or a current that makes it hard to stay in one place for long." };
    case "early-move": return { plain: "The childhood seat is shaken", meaning: "Moves, school changes or shifts at home in childhood are likely. Many grow up early." };
    case "late-clash": return { plain: "Your seat and your children's and later-life seat collide", meaning: "Big gaps in thinking with children, or plans that change a lot after midlife." };
    case "dohwa": return { plain: "A pull on people", meaning: "You draw eyes without trying. Popularity and romance come often; looks, style and expression become tools in your work." };
    case "yeokma": return { plain: "Luck that opens when you move", meaning: "Staying put feels stifling. Moves, trips, going abroad and job changes are frequent, and moving opens your luck." };
    case "hwagae": return { plain: "A deep world of your own", meaning: "Even among people you can suddenly feel alone. You're drawn to deep work: art, faith, philosophy, research." };
    case "cheoneul": return { plain: "Help appears in a crisis", meaning: "At a dead end, someone always reaches out. Ties you built quietly help at the decisive moment." };
    case "yangin": return { plain: "Razor-sharp resolve", meaning: "Once decided, your push is formidable. Watch your temper, quarrels and injuries." };
    case "goegang": return { plain: "A born leader's streak", meaning: "Big swings, but a big board. Staying under others for long is hard; when you run your own game it goes very well." };
    case "baekho": return { plain: "Strong drive", meaning: "With strong drive comes a likely brush with something sudden: an accident, surgery, a clash. Take care driving and with physical work." };
    case "el-extreme": {
      const e = elFrom(plainKo)[0];
      const pct = /(\d+)%/.exec(plainKo)?.[1];
      return e === undefined ? null : { plain: `${ELEMENT_EN[e]} makes up ${pct}% of your chart`, meaning: `${TRAIT_EN[e][0].toUpperCase()}${TRAIT_EN[e].slice(1)} drive your whole life. Your strengths and weak spots both come from this one energy.` };
    }
    case "missing-two": {
      const els = elFrom(plainKo.split("기운")[0]);
      const names = els.map((e) => ELEMENT_EN[e]).join(" and ");
      return { plain: `${names} are missing`, meaning: `None of your eight characters is ${names}. So ${els.map((e) => LACK_EN[e]).join(" and ")} can come a beat late when you need ${els.length > 1 ? "them" : "it"}. Staying close to people strong in ${names}, or the years that bring ${els.length > 1 ? "them" : "it"}, fills the gap.` };
    }
    case "rootless": return { plain: "No root to hold you up", meaning: "You're less settled inside than you look, and others sway you easily. You're strongest with people firmly on your side and a space of your own." };
    case "self-seat": return { plain: "A day pillar standing firm in its own seat", meaning: "Clear views and strong independence. You may tussle with partners over who leads, so relationships that respect each other's ground suit you." };
    case "guk": {
      const e = ["목국", "화국", "토국", "금국", "수국"].findIndex((k) => plainKo.includes(k));
      return e < 0 ? null : { plain: `Three characters band together into ${ELEMENT_EN[e]}`, meaning: `Three characters unite into one strong ${ELEMENT_EN[e]} current. You're used well in ${GUK_EN[e]}, and once you pick a direction you go all the way.` };
    }
    case "day-hap": {
      const god = (Object.keys(TEN_GOD_EN) as TenGod[]).find((g) => plainKo.includes(g));
      return god ? { plain: `You are bound by affection to the ${TEN_GOD_EN[god]}`, meaning: `You give a lot of heart to ${PARTNER_EN[GROUP_OF_GOD[god]]}, and once you hold on you don't let go easily.` } : null;
    }
    default:
      return null;
  }
}

const rankEn = (ko: string | null) => (ko ? ko.replace("상위", "top").replace("하위", "bottom") : null);
export const perHundredEn = (rate: number) => (rate < 0.01 ? "fewer than 1 in 100" : `${Math.round(rate * 100)} in 100`);

const GROUP_LABEL_EN: Record<GodGroup, string> = { 비겁: "Self-reliance", 식상: "Expression", 재성: "Money sense", 관성: "Duty and rules", 인성: "Learning and support" };

export type EnFree = NonNullable<ReturnType<typeof enFreeOf>>;

export function enFreeOf(person: Person, now = 2026) {
  const p = person.pillars;
  if (!isFull(p)) return null;
  const profile = profileOf(person);
  const gender = person.gender === "m" || person.gender === "f" ? person.gender : null;
  const r = freeReadingOf(p, profile, now);
  const d = distinctOf(p, gender);
  const chart = readChart(p);
  if (!r || !d || !chart) return null;

  const total = Object.values(chart.godWeights).reduce((a, b) => a + b, 0) || 1;
  const share = (g: GodGroup) => Math.round((chart.godWeights[g] / total) * 100);
  const work = WORK_TYPES.map((w) => ({ ...w, score: w.score(share) })).sort((a, b) => b.score - a.score);

  const domains = r.domains.map(({ domain, card }) =>
    domain === "jikup"
      ? { topic: TOPIC_EN[domain], domain, type: `${WORK_EN[work[0].name].name} type`, line: `You shine most in ${WORK_EN[work[0].name].where}. Second comes ${WORK_EN[work[1].name].name}, and a role that mixes the two lasts longest.` }
      : { topic: TOPIC_EN[domain], domain, type: CARD_EN[card.type] ?? card.type, line: CARD_EN[card.line] ?? "" },
  );

  const sorted = [...r.powers].sort((a, b) => b.pct - a.pct);
  const top = d.patterns.filter((x) => x.rate < 0.3).slice(0, 4);
  const patterns = top.flatMap((x) => {
    const en = patternEn(x.id, x.plain, x.meaning, gender);
    return en ? [{ id: x.id, term: x.term, area: x.area, rate: x.rate, ...en }] : [];
  });
  const lead = patterns.find((x) => x.area === "성격") ?? patterns[0];
  const second = lead && patterns.find((x) => x.id !== lead.id && x.area !== lead.area);

  const heavy = (Object.keys(chart.godWeights) as GodGroup[]).reduce((a, b) => (chart.godWeights[b] > chart.godWeights[a] ? b : a));

  return {
    powers: r.powers.map((x) => ({ group: x.group, name: POWER_EN[x.group].name, what: POWER_EN[x.group].what, pct: x.pct, rank: rankEn(x.rank) })),
    strong: { name: POWER_EN[sorted[0].group].name, line: POWER_EN[sorted[0].group].high },
    weak: { name: POWER_EN[sorted.at(-1)!.group].name, line: POWER_EN[sorted.at(-1)!.group].low },
    sals: r.sals.map((s) => ({ ...(SAL_EN[s.name] ?? { name: s.name, plain: s.plain, line: s.line }), rate: s.rate })),
    domains,
    flow: r.flow?.map((f) => ({
      from: f.from,
      to: f.to,
      age: f.age ? f.age.replace("세", "").replace("~", "–") : "",
      mood: f.mood,
      level: f.level,
      line: decadeEn(f.line),
      young: f.young,
      now: f.now,
      past: f.past,
    })) ?? null,
    patterns,
    sowhat: [lead, second].filter((x): x is (typeof patterns)[number] => Boolean(x)),
    extremes: d.extremes.slice(0, 3).map((x) => {
      const g = (Object.keys(GROUP_LABEL_EN) as GodGroup[]).find((k) => x.label.includes(`${k}:`));
      const e = g ? -1 : elFrom(x.label.split("(")[0])[0];
      return { label: g ? GROUP_LABEL_EN[g] : ELEMENT_EN[e ?? 0], pct: Math.round(x.value * 100), side: x.side, rank: Math.max(1, Math.round(x.rate * 100)) };
    }),
    ilju: d.ilju
      ? {
          build: `born in ${SEASON_EN[chart.season]}, in the ${TEN_GOD_EN[chart.gyeok]} frame, with ${GROUP_LABEL_EN[heavy]} weighing most`,
          rate: Math.max(1, Math.round(d.ilju.rate * 100)),
        }
      : null,
  };
}
