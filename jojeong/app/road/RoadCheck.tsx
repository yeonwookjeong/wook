"use client";

import { useSyncExternalStore } from "react";
import { classify, directKind, SOURCE_LABEL, DIRECT_KIND_LABEL } from "@/lib/source";

type Info = { ua: string; ref: string; road: string; kind: string };
let cached: Info | null = null;
function read(): Info {
  if (cached) return cached;
  const ua = navigator.userAgent;
  const road = classify({ path: "/", referrer: document.referrer, ua, query: location.search });
  cached = { ua, ref: document.referrer || "(없음)", road: SOURCE_LABEL[road], kind: road === "direct" ? DIRECT_KIND_LABEL[directKind(ua)] : "-" };
  return cached;
}
const noop = () => () => {};

export default function RoadCheck() {
  // Read in the browser only; the server has nothing to show.
  const info = useSyncExternalStore(noop, read, () => null);
  if (!info) return null;
  return (
    <div className="card mt-4 rounded-2xl px-5 py-5 text-[14px] leading-relaxed">
      <h1 className="font-myeongjo text-[19px] font-extrabold">들어온 길 확인</h1>
      <dl className="mt-3 flex flex-col gap-2">
        <dt className="font-bold">사이트가 판단한 길</dt>
        <dd>{info.road}</dd>
        <dt className="font-bold">직접일 때 브라우저 종류</dt>
        <dd>{info.kind}</dd>
        <dt className="font-bold">이전 페이지 주소</dt>
        <dd className="break-all">{info.ref}</dd>
        <dt className="font-bold">브라우저 정보</dt>
        <dd className="break-all text-[12px] text-ink-soft">{info.ua}</dd>
      </dl>
    </div>
  );
}
