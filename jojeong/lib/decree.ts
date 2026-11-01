import { josa } from "./josa";
import type { RoleKey } from "./saju";
import { ROLES } from "./roles";

export function decreeLine(name: string, role: RoleKey) {
  const obj = josa(name, "을/를");
  if (role === "gansin") return `${obj} 간신으로 지목하노라`;
  if (role === "yubae") return `${obj} 먼 섬으로 유배하노라`;
  return `${obj} ${ROLES[role].title}에 제수하노라`;
}

export function summonLine(name: string, role: RoleKey) {
  if (role === "gansin") return `${name}, 너 내 조정에서 간신이래ㅋㅋ 사주가 그렇대. 확인해봐`;
  if (role === "yubae") return `${name}, 너 내 조정에서 유배당했어ㅋㅋ 이유 확인해봐`;
  return `${name}, 너 내 조정에서 ${josa(ROLES[role].title, "이래/래")}! 사주로 봤대. 확인해봐`;
}

export function bragLine(kingName: string, role: RoleKey) {
  if (role === "gansin") return `${kingName} 전하 조정에서 간신으로 찍혔다ㅋㅋㅋ 내가 왕이면 넌 어떤 신하일지 봐봐`;
  if (role === "yubae") return `${kingName} 전하한테 유배당함ㅋㅋ 내가 왕이면 넌 어떤 신하일지 봐봐`;
  return `나 ${kingName} 전하 조정의 ${ROLES[role].title}됨ㅋㅋ 내가 왕이면 넌 어떤 신하일지 봐봐`;
}

// The invitation a king sends: the game's name is the call itself.
export function summonAll(kingName: string, kingTitle: string) {
  return `어명이오! ${kingTitle} ${kingName} 전하께서 그대를 조정으로 부르셨소. 그대는 어떤 신하일꼬?`;
}
