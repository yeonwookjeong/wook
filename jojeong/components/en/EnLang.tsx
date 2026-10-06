"use client";

import { useEffect } from "react";

// The root layout is Korean; the English pages mark the document as English for screen readers and translators.
export default function EnLang() {
  useEffect(() => {
    const el = document.documentElement;
    const before = el.lang;
    el.lang = "en";
    return () => {
      el.lang = before;
    };
  }, []);
  return null;
}
