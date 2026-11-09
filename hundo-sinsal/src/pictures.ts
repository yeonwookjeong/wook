import { imageOf, type Card } from "@/lib/sinsal";

// The site's 40 신살 characters (jojeong/public/sinsal, M01–M20 and F01–F20), bundled with the mini app so they
// show without the network.
const FILES = import.meta.glob("../../jojeong/public/sinsal/*.webp", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const BY_NAME = Object.fromEntries(Object.entries(FILES).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1), url]));

export const pictureOf = (c: Card, gender: "m" | "f" | null) => BY_NAME[imageOf(c, gender).slice("/sinsal/".length)] ?? null;
