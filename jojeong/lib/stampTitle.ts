// The 진영 title and seal the site writes on a painting itself (image models write hanja badly).

// A 진영 title down the right edge and a red seal under it, sized for a picture `width` pixels wide.
export function stampTitle(g: CanvasRenderingContext2D, width: number, name: string) {
  const k = width / 600;
  const serif = getComputedStyle(document.body).getPropertyValue("--font-myeongjo").trim() || "serif";
  const label = [...name.slice(0, 6), " ", "진", "영"];
  const x = width - 48 * k;
  g.save();
  g.fillStyle = "#2a1d14";
  g.textAlign = "center";
  g.font = `700 ${34 * k}px ${serif}`;
  label.forEach((ch, j) => g.fillText(ch, x, (70 + j * 40) * k));
  const sy = (60 + label.length * 40) * k;
  g.fillStyle = "#b23a2c";
  g.fillRect(x - 20 * k, sy, 40 * k, 40 * k);
  g.fillStyle = "#f6ead8";
  g.font = `700 ${15 * k}px ${serif}`;
  g.fillText(name.replace(/\s/g, "").slice(0, 2), x, sy + 26 * k);
  g.restore();
}
