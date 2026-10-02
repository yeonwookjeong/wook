// Cards made into real PNGs in the browser (html-to-image): the fonts a card uses are inlined first, only the
// faces whose characters appear on it, so the image reads the same as the page. Shared by the owner's SNS desk
// and the readers' "카드 저장".
const dataUrls = new Map<string, Promise<string>>();
function dataUrl(url: string) {
  if (!dataUrls.has(url))
    dataUrls.set(
      url,
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`${r.status} ${url}`);
          return r.blob();
        })
        .then((b) => new Promise<string>((ok, no) => {
          const fr = new FileReader();
          fr.onload = () => ok(String(fr.result));
          fr.onerror = () => no(fr.error);
          fr.readAsDataURL(b);
        })),
    );
  return dataUrls.get(url)!;
}

// "U+AC00-D7A3, U+0041" → does any of the code points fall inside?
function inRange(range: string, points: Set<number>) {
  if (!range) return true;
  return range.split(",").some((part) => {
    const [a, b] = part.trim().replace(/^U\+/i, "").split("-");
    if (a.includes("?")) {
      const lo = parseInt(a.replace(/\?/g, "0"), 16);
      const hi = parseInt(a.replace(/\?/g, "F"), 16);
      return [...points].some((p) => p >= lo && p <= hi);
    }
    const lo = parseInt(a, 16);
    const hi = b ? parseInt(b, 16) : lo;
    return [...points].some((p) => p >= lo && p <= hi);
  });
}

async function fontRules(): Promise<{ rule: CSSFontFaceRule; base: string }[]> {
  const out: { rule: CSSFontFaceRule; base: string }[] = [];
  for (const sheet of [...document.styleSheets]) {
    const base = sheet.href ?? location.href;
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      // A stylesheet from another site (the Pretendard CDN): read it again by fetch, which its CORS allows.
      if (!sheet.href) continue;
      try {
        const css = await fetch(sheet.href).then((r) => r.text());
        const copy = new CSSStyleSheet();
        copy.replaceSync(css.replace(/@import[^;]+;/g, ""));
        rules = copy.cssRules;
      } catch {
        continue;
      }
    }
    for (const r of [...rules]) if (r instanceof CSSFontFaceRule) out.push({ rule: r, base });
  }
  return out;
}

export async function fontCss(nodes: HTMLElement[]) {
  const families = new Set<string>();
  const points = new Set<number>();
  for (const n of nodes) {
    for (const ch of n.textContent ?? "") points.add(ch.codePointAt(0)!);
    for (const el of [n, ...n.querySelectorAll<HTMLElement>("*")])
      for (const f of getComputedStyle(el).fontFamily.split(",")) families.add(f.trim().replace(/^["']|["']$/g, ""));
  }
  const used = (await fontRules()).filter(
    ({ rule }) => families.has(rule.style.getPropertyValue("font-family").trim().replace(/^["']|["']$/g, "")) && inRange(rule.style.getPropertyValue("unicode-range"), points),
  );
  const css = await Promise.all(
    used.map(async ({ rule, base }) => {
      let text = rule.cssText;
      for (const m of [...text.matchAll(/url\((['"]?)([^'")]+)\1\)/g)]) {
        if (m[2].startsWith("data:")) continue;
        text = text.replace(m[0], `url(${await dataUrl(new URL(m[2], base).href)})`);
      }
      return text;
    }),
  );
  return css.join("\n");
}

