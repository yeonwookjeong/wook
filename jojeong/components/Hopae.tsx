"use client";

import { useId, useState } from "react";
import { MATERIAL, type HopaeInput } from "@/lib/hopae";
import HopaeFace from "./HopaeFace";

// The 신분 감정 result as a 호패 hanging on its cord (lib/hopae.ts draws it). A tap turns it over to the back:
// the year of issue and the burnt brand.
export default function Hopae({ tag, className = "", night = false }: { tag: HopaeInput; className?: string; night?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [back, setBack] = useState(false);
  const m = MATERIAL[tag.rank];
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        type="button"
        onClick={() => setBack((b) => !b)}
        aria-label={back ? "호패 앞면 보기" : "호패 뒷면 보기"}
        className="w-[min(60vw,240px)] [perspective:900px]"
      >
        <div className={`relative transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:transition-none ${back ? "[transform:rotateY(180deg)]" : ""}`}>
          <div className="[backface-visibility:hidden]">
            <HopaeFace tag={tag} id={id} />
          </div>
          <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <HopaeFace tag={tag} id={id} back />
          </div>
        </div>
      </button>
      <p className={`mt-1 text-[11.5px] ${night ? "text-hanji/55" : "text-ink-soft"}`}>
        {m.name}({m.hanja}) · {back ? "뒷면 · 발급한 해와 낙인" : "눌러서 뒷면 보기"}
      </p>
    </div>
  );
}
