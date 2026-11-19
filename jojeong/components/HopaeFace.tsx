import { carvingSvg, HOPAE_H, HOPAE_W, MATERIAL, type HopaeInput } from "@/lib/hopae";

// One face of the 호패: the material's picture with the letters carved over it. The back is the same picture
// mirrored (the cord falls the other way, as it would). Plain markup, so a saved card (lib/cardExport.ts) draws it too.
export default function HopaeFace({ tag, id, back = false }: { tag: HopaeInput; id: string; back?: boolean }) {
  return (
    // The small wooden tag (소목방패) is drawn smaller than the big one, from the top where the cord hangs.
    <div className="relative w-full" style={{ aspectRatio: `${HOPAE_W} / ${HOPAE_H}`, transform: `scale(${MATERIAL[tag.kind].scale})`, transformOrigin: "50% 0" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MATERIAL[tag.kind].file} alt="" className={`absolute inset-0 size-full drop-shadow-[0_8px_10px_rgb(33_27_23/0.35)] ${back ? "-scale-x-100" : ""}`} />
      <div dangerouslySetInnerHTML={{ __html: carvingSvg(tag, id, back) }} />
    </div>
  );
}
