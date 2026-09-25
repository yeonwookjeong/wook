import { josa } from "./josa";
import type { RoleKey } from "./saju";
import { ROLES } from "./roles";

export function decreeLine(name: string, role: RoleKey) {
  const obj = josa(name, "을/를");
  if (role === "gansin") return `${obj} 간신으로 지목하노라`;
  if (role === "yubae") return `${obj} 먼 섬으로 유배하노라`;
  return `${obj} ${ROLES[role].title}에 제수하노라`;
}

export function bragLine(kingName: string, role: RoleKey) {
  if (role === "gansin") return `${kingName} 전하 조정에서 간신으로 찍혔다ㅋㅋㅋ 너도 사주로 관직 받아봐`;
  if (role === "yubae") return `${kingName} 전하한테 유배당함… 너도 사주로 관직 받아봐`;
  return `나 ${kingName} 전하 조정의 ${ROLES[role].title}됨ㅋㅋ 너도 사주로 관직 받아봐`;
}
