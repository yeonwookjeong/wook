import "server-only";
import { cookies } from "next/headers";
import { ME_COOKIE } from "./cookies";
import { decodePerson, encodePerson, type Person } from "./pairToken";

// The reader's own chart, remembered in this browser so every report opens without entering it again. Only
// what lib/pairToken.ts carries is kept (name, eight characters, gender, birth year, 대운), never the date.
export async function readMe(): Promise<{ person: Person; token: string } | null> {
  const token = (await cookies()).get(ME_COOKIE)?.value;
  const person = decodePerson(token);
  return person && token ? { person, token } : null;
}

export async function rememberMe(person: Person) {
  (await cookies()).set(ME_COOKIE, encodePerson(person), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function forgetMe() {
  (await cookies()).delete(ME_COOKIE);
}
