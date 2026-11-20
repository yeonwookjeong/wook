"use client";

import { useState } from "react";
import { sendLink } from "./SinsalShare";

// The 호패함's one button: the friend link with a line that asks for their tag.
export default function HopaeBoxSend({ path, text }: { path: string; text: string }) {
  const [copied, setCopied] = useState(false);
  async function send() {
    if (await sendLink(path, text, "sinbun_box")) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }
  return (
    <button
      type="button"
      onClick={send}
      data-path={path}
      className="mt-4 w-full rounded-2xl bg-seal py-3.5 font-myeongjo text-[17px] font-extrabold text-hanji shadow-[0_5px_0_#7d1a14] transition active:translate-y-1 active:shadow-[0_2px_0_#7d1a14]"
    >
      {copied ? "링크를 복사했어요" : "친구 호패 받아 오기"}
    </button>
  );
}
