"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { FaceLandmarker, FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { drawChart } from "@/lib/gwansangChart";
import { deepMeasure, type Grade } from "@/lib/gwansangDeep";
import { gwansangReading } from "@/lib/gwansangReading";
import { chartNotes, leadThird, likeness, thirdDev, BANDS, band, hyeong, IDX, level, measure, medianFace, wordOf, type BandKey, type Face, type Metrics, type Pt } from "@/lib/gwansang";

// The 관상 capture test (/lab/gwansang): the camera shows a guide, and the face is taken only once it is the
// right size, centred, facing straight, expressionless and well lit for HOLD_MS in a row (a slip shorter than
// GRACE_MS is skipped, not restarted), while the measuring lines are drawn over it step by step. The frames of that
// hold are merged point by point (lib/gwansang.ts medianFace). Nothing leaves the device: the last frame stays
// in memory only, for a painting the viewer may order (/api/portrait); past readings (numbers only) stay in this
// browser, to compare retakes.

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const HOLD_MS = 4000;
const MIN_FRAMES = 30;
const GRACE_MS = 350; // a blink or twitch shorter than this skips its frames instead of starting over
const HISTORY_KEY = "gwansang-lab-history";
const LIKENESS_RETRY = 75; // below this the painting is asked for once more
const KEYS = Object.keys(BANDS) as BandKey[];

type Check = { key: string; ok: boolean; tip: string };
type Pose = { yaw: number; pitch: number; roll: number };
type Reading = { at: number; source: "camera" | "photo"; frames: number; m: Metrics };
// The frame a painting may be ordered from, with its own face points: held in memory on this page only.
type Snap = { canvas: HTMLCanvasElement; pts: Pt[] };
type Painting = { img: HTMLImageElement; pts: Pt[] | null; face: Face | null };
type Result = Reading & { face: Face; spread: Partial<Record<BandKey, number>>; snap: Snap | null; painting: Painting | null; paintNote: string };

// One still-image reader for the page: photos, and the painting that comes back (to pin the chart's notes).
let imageReader: Promise<FaceLandmarker> | null = null;
const imageLandmarker = () => (imageReader ??= makeLandmarker("IMAGE"));

// The lines drawn over the face while it is being measured, one group per step of the hold (see SCAN_STEPS).
type Link = { start: number; end: number };
let scanLinks: Link[][] = [];
const chain = (ids: number[]): Link[] => ids.slice(1).map((end, i) => ({ start: ids[i], end }));
const SCAN_STEPS = ["얼굴 윤곽을 잡는 중", "눈썹과 눈을 재는 중", "코와 광대를 재는 중", "입과 턱을 재는 중", "삼정 비율을 맞추는 중"];

async function makeLandmarker(mode: "VIDEO" | "IMAGE"): Promise<FaceLandmarker> {
  const { FaceLandmarker: FL, FilesetResolver } = await import("@mediapipe/tasks-vision");
  scanLinks = [
    FL.FACE_LANDMARKS_FACE_OVAL,
    [...FL.FACE_LANDMARKS_LEFT_EYEBROW, ...FL.FACE_LANDMARKS_RIGHT_EYEBROW, ...FL.FACE_LANDMARKS_LEFT_EYE, ...FL.FACE_LANDMARKS_RIGHT_EYE],
    [...chain([168, 6, 197, 195, 5, 4, 1, 2]), ...chain([129, 64, 98, 97, 2, 326, 327, 294, 358]), ...chain([234, 117, 118, 101]), ...chain([454, 346, 347, 330])],
    [...FL.FACE_LANDMARKS_LIPS, ...chain([172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397])],
    [],
  ];
  const fileset = await FilesetResolver.forVisionTasks(WASM);
  const options = (delegate: "GPU" | "CPU") => ({
    baseOptions: { modelAssetPath: MODEL, delegate },
    runningMode: mode,
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  });
  try {
    return await FL.createFromOptions(fileset, options("GPU"));
  } catch {
    return FL.createFromOptions(fileset, options("CPU"));
  }
}

// Head turn from the face's transformation matrix (column-major 4×4), in degrees.
function poseOf(r: FaceLandmarkerResult): Pose | null {
  const d = r.facialTransformationMatrixes?.[0]?.data;
  if (!d || d.length < 11) return null;
  const n = (x: number, y: number, z: number) => Math.hypot(x, y, z) || 1;
  const c0 = n(d[0], d[1], d[2]);
  const c1 = n(d[4], d[5], d[6]);
  const c2 = n(d[8], d[9], d[10]);
  const deg = 180 / Math.PI;
  return {
    yaw: Math.asin(Math.max(-1, Math.min(1, -d[2] / c0))) * deg,
    pitch: Math.atan2(d[6] / c1, d[10] / c2) * deg,
    roll: Math.atan2(d[1] / c0, d[0] / c0) * deg,
  };
}

function judge(r: FaceLandmarkerResult, light: number, relaxed: boolean): { checks: Check[]; pose: Pose | null } {
  const lm = r.faceLandmarks[0];
  const k = relaxed ? 1.8 : 1;
  const faceH = Math.abs(lm[152].y - lm[10].y);
  const shapes = Object.fromEntries((r.faceBlendshapes?.[0]?.categories ?? []).map((c) => [c.categoryName, c.score]));
  const avg = (a: string, b: string) => ((shapes[a] ?? 0) + (shapes[b] ?? 0)) / 2;
  const pose = poseOf(r);
  const yawOk = pose ? Math.abs(pose.yaw) <= 6 * k : Math.abs((lm[1].x - lm[234].x) / (lm[454].x - lm[234].x) - 0.5) <= 0.06 * k;
  const checks: Check[] = [
    { key: "size", ok: faceH >= (relaxed ? 0.32 : 0.42) && faceH <= (relaxed ? 0.85 : 0.72), tip: faceH < 0.42 ? "조금 더 가까이 와 주세요" : "조금 뒤로 물러나 주세요" },
    { key: "center", ok: Math.abs(lm[1].x - 0.5) <= 0.1 * k && Math.abs(lm[1].y - 0.5) <= 0.12 * k, tip: "얼굴을 테두리 가운데로 맞춰 주세요" },
    { key: "yaw", ok: yawOk, tip: "고개를 돌리지 말고 정면을 봐 주세요" },
    { key: "pitch", ok: !pose || Math.abs(pose.pitch) <= 6 * k, tip: "턱을 들거나 숙이지 말고 정면을 봐 주세요" },
    { key: "roll", ok: !pose || Math.abs(pose.roll) <= 8 * k, tip: "고개를 옆으로 기울이지 말아 주세요" },
    { key: "smile", ok: avg("mouthSmileLeft", "mouthSmileRight") < 0.4 * k, tip: "웃지 말고 무표정으로 해 주세요" },
    { key: "mouth", ok: (shapes.jawOpen ?? 0) < 0.25 * k, tip: "입을 다물어 주세요" },
    { key: "eyes", ok: avg("eyeBlinkLeft", "eyeBlinkRight") < 0.5, tip: "눈을 떠 주세요" },
    { key: "light", ok: light >= (relaxed ? 35 : 55), tip: "조금 더 밝은 곳으로 가 주세요" },
  ];
  return { checks, pose };
}

const std = (v: number[]) => {
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length);
};

// Past readings, in this browser only (a private window or blocked storage just starts empty).
const listeners = new Set<() => void>();
function subscribeHistory(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function rawHistory() {
  try {
    return localStorage.getItem(HISTORY_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}
function parseHistory(raw: string): Reading[] {
  try {
    return JSON.parse(raw) as Reading[];
  } catch {
    return [];
  }
}
function saveHistory(list: Reading[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(-5)));
  } catch {}
  listeners.forEach((fn) => fn());
}

export default function GwansangLab() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoLm = useRef<FaceLandmarker | null>(null);
  const imageLm = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef(0);
  const hold = useRef<{ t0: number; lastOk?: number; lastAt?: number; held?: number; faces: Face[] }>({ t0: 0, faces: [] });
  const [phase, setPhase] = useState<"idle" | "loading" | "camera" | "painting" | "done">("idle");
  const [waited, setWaited] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [message, setMessage] = useState("");
  const [checks, setChecks] = useState<Check[]>([]);
  const [pose, setPose] = useState<Pose | null>(null);
  const [progress, setProgress] = useState(0);
  const [scanPts, setScanPts] = useState<Pt[] | null>(null);
  // A chosen photo is read in the same steps as the camera, shown over the photo before the result.
  const [photoScan, setPhotoScan] = useState<{ src: string; w: number; h: number; pts: Pt[]; step: number } | null>(null);
  const [dims, setDims] = useState({ w: 3, h: 4 });
  const [relaxed, setRelaxed] = useState(false);
  const relaxedRef = useRef(false);
  const [result, setResult] = useState<Result | null>(null);
  const raw = useSyncExternalStore(subscribeHistory, rawHistory, () => "[]");
  const history = useMemo(() => parseHistory(raw), [raw]);

  useEffect(() => () => stopCamera(), []);
  // Seconds spent waiting for the painting, for the loading screen's messages.
  useEffect(() => {
    if (phase !== "painting") return;
    const started = Date.now();
    const t = setInterval(() => setWaited(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => {
      clearInterval(t);
      setWaited(0);
    };
  }, [phase]);
  useEffect(() => {
    relaxedRef.current = relaxed;
  }, [relaxed]);

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function finish(face: Face, frames: Face[], source: "camera" | "photo", snap: Snap | null) {
    const m = measure(face);
    const spread: Partial<Record<BandKey, number>> = {};
    if (frames.length > 1) {
      const each = frames.map(measure);
      for (const key of KEYS) spread[key] = std(each.map((x) => x[key]));
    }
    const reading: Reading = { at: Date.now(), source, frames: Math.max(1, frames.length), m };
    saveHistory([...parseHistory(rawHistory()), reading]);
    if (!snap) {
      setResult({ ...reading, face, spread, snap, painting: null, paintNote: "" });
      setPhase("done");
      return;
    }
    // Everything waits for the painting, then shows at once; a failed painting falls back to the line drawing.
    setResult(null);
    setPhase("painting");
    paint(snap, m).then(({ painting, note }) => {
      setResult({ ...reading, face, spread, snap, painting, paintNote: note });
      setPhase("done");
    });
  }

  // Paint, then measure the painted face against the real one; a painting that drifted is asked for once more
  // (strictly), and the closer of the two is kept.
  async function paint(snap: Snap, m: Metrics): Promise<{ painting: Painting | null; note: string }> {
    const photo = photoDataUrl(snap);
    const once = async (strict: boolean) => {
      const res = await fetch("/api/portrait", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photo, strict }),
        signal: AbortSignal.timeout(110_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.image) throw new Error(data.error ?? "그림을 받지 못했어요.");
      const painting = await loadPainting(data.image);
      const score = painting.face ? likeness(measure(painting.face), m) : null;
      return { painting, score, model: data.model as string, ms: data.ms as number };
    };
    try {
      let best = await once(false);
      if (best.score !== null && best.score < LIKENESS_RETRY) {
        setRetrying(true);
        const again = await once(true).catch(() => null);
        if (again && (again.score ?? 0) > best.score) best = again;
      }
      const score = best.score === null ? "닮음 측정 불가" : `닮음 ${best.score}점`;
      return { painting: best.painting, note: `${score} · ${best.model} · ${(best.ms / 1000).toFixed(0)}초 · 길게 눌러 저장` };
    } catch (e) {
      return { painting: null, note: e instanceof Error && e.name !== "TimeoutError" ? e.message : "그림이 늦어져 선화로 보여 드려요." };
    } finally {
      setRetrying(false);
    }
  }

  async function startCamera() {
    setResult(null);
    setProgress(0);
    setScanPts(null);
    setMessage("");
    setPhase("loading");
    try {
      videoLm.current ??= await makeLandmarker("VIDEO");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } }, audio: false });
      streamRef.current = stream;
      setPhase("camera");
      await new Promise((r) => requestAnimationFrame(r));
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setDims({ w: video.videoWidth || 3, h: video.videoHeight || 4 });
      loop();
    } catch (e) {
      stopCamera();
      setPhase("idle");
      const name = (e as { name?: string })?.name;
      setMessage(
        name === "NotAllowedError"
          ? "카메라 권한이 없어요. 브라우저 설정에서 카메라를 허용하거나, 아래에서 사진으로 시험해 주세요."
          : name === "NotFoundError"
            ? "이 기기에서 카메라를 찾지 못했어요. 사진으로 시험해 주세요."
            : "인식 엔진이나 카메라를 켜지 못했어요. 새로고침하거나 사진으로 시험해 주세요.",
      );
    }
  }

  function loop() {
    const video = videoRef.current;
    const lm = videoLm.current;
    const probe = document.createElement("canvas");
    probe.width = 32;
    probe.height = 24;
    const pctx = probe.getContext("2d", { willReadFrequently: true });
    let light = 128;
    let lastLight = 0;
    let lastTime = -1;
    let lastKey = "";
    const tick = () => {
      if (!video || !lm || !streamRef.current) return;
      const now = performance.now();
      if (video.readyState >= 2 && video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        if (pctx && now - lastLight > 400) {
          lastLight = now;
          pctx.drawImage(video, 0, 0, 32, 24);
          const px = pctx.getImageData(0, 0, 32, 24).data;
          let sum = 0;
          for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          light = sum / (px.length / 4);
        }
        const r = lm.detectForVideo(video, now);
        if (!r.faceLandmarks.length) {
          hold.current = { t0: 0, faces: [] };
          setScanPts(null);
          const key = "none";
          if (key !== lastKey) {
            lastKey = key;
            setChecks([{ key: "face", ok: false, tip: "얼굴이 보이지 않아요. 테두리 안으로 들어와 주세요" }]);
          }
          setProgress(0);
        } else {
          const j = judge(r, light, relaxedRef.current);
          const key = j.checks.map((c) => (c.ok ? 1 : 0)).join("");
          if (key !== lastKey) {
            lastKey = key;
            setChecks(j.checks);
          }
          setPose(j.pose);
          if (j.checks.every((c) => c.ok)) {
            const h = hold.current;
            // Held time counts frame by frame, at most 0.1 s per frame: a stalled frame (the engine's first
            // run, a busy phone) does not skip the hold ahead.
            const at = performance.now();
            h.held = h.t0 ? (h.held ?? 0) + Math.min(at - (h.lastAt ?? at), 100) : 0;
            if (!h.t0) h.t0 = at;
            h.lastOk = h.lastAt = at;
            if (h.faces.length % 2 === 0) setScanPts(r.faceLandmarks[0].map((p): Pt => [p.x, p.y]));
            h.faces.push({ pts: r.faceLandmarks[0].map((p): Pt => [p.x, p.y]), z: r.faceLandmarks[0].map((p) => p.z), aspect: video.videoWidth / video.videoHeight });
            const p = Math.min(1, (h.held ?? 0) / HOLD_MS);
            setProgress(p);
            if (p >= 1 && h.faces.length >= MIN_FRAMES) {
              const frames = h.faces;
              hold.current = { t0: 0, faces: [] };
              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              canvas.getContext("2d")!.drawImage(video, 0, 0);
              stopCamera();
              finish(medianFace(frames), frames, "camera", { canvas, pts: frames[frames.length - 1].pts });
              return;
            }
          } else if (hold.current.t0 && performance.now() - (hold.current.lastOk ?? 0) < GRACE_MS) {
            hold.current.lastAt = performance.now(); // a slip in the grace window adds no held time
          } else {
            hold.current = { t0: 0, faces: [] };
            setProgress(0);
            setScanPts(null);
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  async function fromPhoto(file: File) {
    stopCamera();
    setResult(null);
    setPhase("loading");
    setMessage("");
    try {
      imageLm.current ??= await imageLandmarker();
      const bmp = await createImageBitmap(file);
      const k = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(bmp.width * k);
      cv.height = Math.round(bmp.height * k);
      cv.getContext("2d")!.drawImage(bmp, 0, 0, cv.width, cv.height);
      bmp.close();
      const r = imageLm.current.detect(cv);
      const aspect = cv.width / cv.height;
      const lm = r.faceLandmarks[0];
      if (!lm) {
        setPhase("idle");
        setMessage("사진에서 얼굴을 찾지 못했어요. 정면에서 밝게 찍은 사진으로 다시 골라 주세요.");
        return;
      }
      const pts = lm.map((p): Pt => [p.x, p.y]);
      const src = cv.toDataURL("image/jpeg", 0.85);
      for (let step = 0; step < SCAN_STEPS.length; step++) {
        setPhotoScan({ src, w: cv.width, h: cv.height, pts, step });
        await new Promise((ok) => setTimeout(ok, 700));
      }
      setPhotoScan(null);
      finish({ pts, z: lm.map((p) => p.z), aspect }, [], "photo", { canvas: cv, pts });
    } catch {
      setPhotoScan(null);
      setPhase("idle");
      setMessage("사진을 읽지 못했어요. JPG나 PNG 사진으로 다시 골라 주세요.");
    }
  }

  const failing = checks.find((c) => !c.ok);
  const scanStep = Math.min(SCAN_STEPS.length - 1, Math.floor(progress * SCAN_STEPS.length));
  const ready = checks.length > 0 && !failing;
  // The guide: an oval the face should fill, the eye line and the centre line, in the video's own pixels.
  const ry = dims.h * 0.3;
  const rx = ry / 1.35;
  const ringLen = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));

  return (
    <div className="mt-5 flex flex-col gap-4">
      {photoScan && (
        <section className="flex flex-col gap-3">
          <div className="relative w-full overflow-hidden rounded-2xl bg-ink" style={{ aspectRatio: `${photoScan.w} / ${photoScan.h}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL */}
            <img src={photoScan.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <svg viewBox={`0 0 ${photoScan.w} ${photoScan.h}`} className="absolute inset-0 h-full w-full" aria-hidden>
              <ScanLines pts={photoScan.pts} step={photoScan.step} w={photoScan.w} h={photoScan.h} mirror={false} />
            </svg>
            <p className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-ink/80 px-4 py-1.5 text-[13px] font-bold text-hanji">
              {SCAN_STEPS[photoScan.step]}… ({photoScan.step + 1}/{SCAN_STEPS.length})
            </p>
          </div>
        </section>
      )}
      {phase !== "camera" && phase !== "painting" && !photoScan && (
        <section className="doc-paper flex flex-col gap-3 px-5 py-5">
          <p className="text-[14px] leading-relaxed">
            테두리에 얼굴을 맞추고 <b>정면 · 무표정</b>으로 {HOLD_MS / 1000}초 버티면 자동으로 찍혀요. 같은 사람이 여러 번 찍어서 결과가 같게
            나오는지 아래 표에서 비교해 보세요.
          </p>
          <ul className="list-disc pl-5 text-[12.5px] leading-relaxed text-ink-soft">
            <li>안경은 벗고 앞머리는 넘겨 주세요</li>
            <li>폰을 눈높이에 두고 팔을 쭉 뻗은 거리에서 찍어요</li>
          </ul>
          <button type="button" onClick={startCamera} disabled={phase === "loading"} className="rounded-full bg-seal px-5 py-3 font-bold text-hanji disabled:opacity-60">
            {phase === "loading" ? "인식 엔진 준비 중…" : result ? "다시 찍어 비교하기" : "카메라로 관상 찍기"}
          </button>
          <label className="cursor-pointer text-center text-[13px] font-bold text-seal underline">
            카메라 대신 사진으로 시험하기
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) fromPhoto(f);
                e.target.value = "";
              }}
            />
          </label>
          <label className="flex items-center justify-center gap-2 text-[12.5px] text-ink-soft">
            <input type="checkbox" checked={relaxed} onChange={(e) => setRelaxed(e.target.checked)} /> 판정 느슨하게 (잘 안 찍힐 때)
          </label>
          {message && <p className="text-center text-[13px] font-bold text-seal">{message}</p>}
          <p className="text-center text-[11.5px] text-jade">관상은 이 폰 안에서 재요. 관상 그림을 그리려고 얼굴 부분 사진이 Google AI(Gemini)로 전송되고, 어디에도 저장되지 않아요.</p>
        </section>
      )}

      {phase === "camera" && (
        <section className="flex flex-col gap-3">
          <div className="relative w-full overflow-hidden rounded-2xl bg-ink" style={{ aspectRatio: `${dims.w} / ${dims.h}` }}>
            <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
            <svg viewBox={`0 0 ${dims.w} ${dims.h}`} className="absolute inset-0 h-full w-full" aria-hidden>
              <defs>
                <mask id="guide-hole">
                  <rect width={dims.w} height={dims.h} fill="white" />
                  <ellipse cx={dims.w / 2} cy={dims.h * 0.5} rx={rx} ry={ry} fill="black" />
                </mask>
              </defs>
              <rect width={dims.w} height={dims.h} fill="#000" opacity="0.45" mask="url(#guide-hole)" />
              <ellipse cx={dims.w / 2} cy={dims.h * 0.5} rx={rx} ry={ry} fill="none" stroke={ready ? "#e3b04b" : "#f4ecdb"} strokeWidth={dims.w / 120} opacity="0.9" />
              {/* The hold's progress, clockwise from the top of the guide (a rotated ellipse would swap its axes). */}
              <path
                d={`M ${dims.w / 2} ${dims.h * 0.5 - ry} A ${rx} ${ry} 0 1 1 ${dims.w / 2} ${dims.h * 0.5 + ry} A ${rx} ${ry} 0 1 1 ${dims.w / 2} ${dims.h * 0.5 - ry}`}
                fill="none"
                stroke="#b3261e"
                strokeWidth={dims.w / 60}
                strokeDasharray={`${ringLen * progress} ${ringLen}`}
              />
              <line x1={dims.w / 2 - rx} x2={dims.w / 2 + rx} y1={dims.h * 0.43} y2={dims.h * 0.43} stroke="#f4ecdb" strokeDasharray="10 10" strokeWidth={dims.w / 300} opacity="0.7" />
              <line x1={dims.w / 2} x2={dims.w / 2} y1={dims.h * 0.5 - ry * 0.55} y2={dims.h * 0.5 + ry * 0.35} stroke="#f4ecdb" strokeDasharray="10 10" strokeWidth={dims.w / 300} opacity="0.7" />
              {scanPts && progress > 0 && <ScanLines pts={scanPts} step={scanStep} w={dims.w} h={dims.h} />}
            </svg>
            <p className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-ink/80 px-4 py-1.5 text-[13px] font-bold text-hanji">
              {checks.length === 0 ? "얼굴을 찾는 중…" : failing ? failing.tip : progress > 0 ? `${SCAN_STEPS[scanStep]}… 그대로 계세요` : "좋아요"}
            </p>
          </div>
          <div className="doc-paper px-4 py-3 text-[11.5px] text-ink-soft">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {checks.map((c) => (
                <span key={c.key} className={c.ok ? "text-jade" : "font-bold text-seal"}>
                  {c.ok ? "●" : "○"} {{ size: "크기", center: "가운데", yaw: "좌우", pitch: "위아래", roll: "기울기", smile: "무표정", mouth: "입", eyes: "눈", light: "밝기", face: "얼굴" }[c.key]}
                </span>
              ))}
            </div>
            {pose && (
              <p className="mt-1 tabular-nums">
                좌우 {pose.yaw.toFixed(1)}° · 위아래 {pose.pitch.toFixed(1)}° · 기울기 {pose.roll.toFixed(1)}°
              </p>
            )}
            <button
              type="button"
              className="mt-2 font-bold text-seal underline"
              onClick={() => {
                stopCamera();
                setPhase("idle");
              }}
            >
              그만두기
            </button>
          </div>
        </section>
      )}

      {phase === "painting" && <PaintingWait waited={waited} retrying={retrying} />}
      {result && phase === "done" && <ResultView result={result} />}
      {history.length > 0 && phase !== "camera" && phase !== "painting" && <HistoryTable history={history} onClear={() => saveHistory([])} />}
    </div>
  );
}

// The measuring lines over the camera, step by step: the outline first, then brows and eyes, nose and cheeks,
// mouth and chin, and last the three lines that split the face into 삼정. Mirrored like the video.
function ScanLines({ pts, step, w, h, mirror = true }: { pts: Pt[]; step: number; w: number; h: number; mirror?: boolean }) {
  const X = (i: number) => (mirror ? 1 - pts[i][0] : pts[i][0]) * w;
  const Y = (i: number) => pts[i][1] * h;
  const sw = w / 260;
  const browY = (Y(105) + Y(334)) / 2;
  return (
    <g fill="none" strokeLinecap="round">
      {scanLinks.slice(0, step + 1).map((links, k) => (
        <g key={k} stroke={k === step ? "#e3b04b" : "#f4ecdb"} strokeWidth={sw} opacity={k === step ? 0.95 : 0.55}>
          {links.map((l, i) => (
            <line key={i} x1={X(l.start)} y1={Y(l.start)} x2={X(l.end)} y2={Y(l.end)} />
          ))}
        </g>
      ))}
      {step === SCAN_STEPS.length - 1 &&
        [Y(10), browY, Y(2), Y(152)].map((y, i) => (
          <line key={i} x1={X(234)} x2={X(454)} y1={y} y2={y} stroke="#b3261e" strokeWidth={sw * 1.4} strokeDasharray={`${sw * 4} ${sw * 3}`} />
        ))}
    </g>
  );
}

function smooth(pts: Pt[], closed = false) {
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(p[1][0])},${f(p[1][1])}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [a, b, c, e] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    d += `C${f(b[0] + (c[0] - a[0]) / 6)},${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)},${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])},${f(c[1])}`;
  }
  return closed ? d + "Z" : d;
}

function InkFace({ face }: { face: Face }) {
  const R = level(face);
  const xs = R.map((p) => p[0]);
  const ys = R.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = Math.min(240 / (x1 - x0), 300 / (y1 - y0));
  const T = R.map(([x, y]): Pt => [(x - (x0 + x1) / 2) * s + 150, (y - (y0 + y1) / 2) * s + 180]);
  const at = (ids: readonly number[]) => ids.map((i) => T[i]);
  const ink = "#211b17";
  const iris = (c: number, e: number) =>
    T[c] && <circle cx={T[c][0]} cy={T[c][1]} r={Math.hypot(T[c][0] - T[e][0], T[c][1] - T[e][1]) * 0.9} fill={ink} />;
  return (
    <svg viewBox="0 0 300 360" className="mx-auto w-full max-w-[240px]" role="img" aria-label="먹선으로 그린 얼굴">
      <path d={smooth(at(IDX.oval), true)} fill="none" stroke={ink} strokeWidth="2.4" />
      <path d={smooth(at(IDX.rBrow), true)} fill={ink} />
      <path d={smooth(at(IDX.lBrow), true)} fill={ink} />
      <path d={smooth(at(IDX.rEyeUp))} fill="none" stroke={ink} strokeWidth="2" />
      <path d={smooth(at(IDX.rEyeLo))} fill="none" stroke={ink} strokeWidth="0.9" />
      <path d={smooth(at(IDX.lEyeUp))} fill="none" stroke={ink} strokeWidth="2" />
      <path d={smooth(at(IDX.lEyeLo))} fill="none" stroke={ink} strokeWidth="0.9" />
      {iris(468, 469)}
      {iris(473, 474)}
      <path d={smooth(at(IDX.bridge))} fill="none" stroke={ink} strokeWidth="0.9" />
      <path d={smooth(at(IDX.noseBase))} fill="none" stroke={ink} strokeWidth="1.6" />
      <path d={smooth(at(IDX.lips), true)} fill="none" stroke={ink} strokeWidth="1.3" />
      <path d={smooth(at(IDX.mouth))} fill="none" stroke={ink} strokeWidth="1.8" />
    </svg>
  );
}

// The face cut out of the captured frame, small: what "photo" mode sends once the viewer agrees.
function photoDataUrl(snap: Snap): string {
  const W = snap.canvas.width;
  const H = snap.canvas.height;
  const xs = snap.pts.map((p) => p[0] * W);
  const ys = snap.pts.map((p) => p[1] * H);
  const fh = Math.max(...ys) - Math.min(...ys);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const y0 = Math.min(...ys) - fh * 0.6;
  const h = fh * 2.2;
  const w = h * 0.78;
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 820;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(snap.canvas, cx - w / 2, y0, w, h, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.88);
}

// The painting as an image, and the face points found on it (none when the reader finds no face there).
async function loadPainting(src: string): Promise<Painting> {
  const img = new Image();
  img.src = src;
  await img.decode();
  try {
    const found = (await imageLandmarker()).detect(img).faceLandmarks[0];
    if (found) {
      const pts = found.map((p): Pt => [p.x, p.y]);
      return { img, pts, face: { pts, z: found.map((p) => p.z), aspect: img.naturalWidth / img.naturalHeight } };
    }
  } catch {}
  return { img, pts: null, face: null };
}

// The result's portrait: the face crop goes to /api/portrait, comes back painted in the shared style, and is laid
// out as a 관상 도식 with notes pinned to the face. The viewer can crop to the face, switch notes and the boxes
// off, and rename it; each change redraws at once. The line drawing stands in while it is painted, and stays
// when painting fails.
function ResultPortrait({ result }: { result: Result }) {
  const painting = result.painting;
  const [name, setName] = useState("무명씨");
  const [faceOnly, setFaceOnly] = useState(true);
  const [boxes, setBoxes] = useState(true);
  const [hidden, setHidden] = useState<number[]>([]);
  const notes = useMemo(() => chartNotes(result.m), [result]);

  const shown = useMemo(() => {
    if (!painting) return null;
    const h = hyeong(result.m);
    const order = "木火土金水";
    const els = (h.mixed ? [h.main.el, h.mixed.el] : [h.main.el]).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return drawChart({
      painting: painting.img,
      paintPts: painting.pts,
      facePts: result.face.pts,
      m: result.m,
      title: h.label,
      hanja: `${els.join("")}形`,
      name: name.trim() || "무명씨",
      faceOnly,
      hidden,
      boxes,
    });
  }, [painting, result, name, faceOnly, hidden, boxes]);

  const chip = (on: boolean) => `rounded-full border px-2.5 py-1 text-[11.5px] font-bold ${on ? "border-ink bg-ink text-hanji" : "border-ink/20 text-ink-soft line-through"}`;
  return (
    <div className="flex flex-col items-center gap-2">
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element -- a chart drawn on this device
        <img src={shown} alt="관상 도식" className="w-full rounded shadow-[0_2px_12px_rgba(0,0,0,0.2)]" />
      ) : (
        <InkFace face={result.face} />
      )}
      <p className="text-[11px] text-ink-soft">{result.paintNote}</p>
      {shown && (
        <div className="flex w-full flex-col gap-2 rounded-xl border border-ink/15 bg-white/50 px-3 py-3">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={chip(faceOnly)} onClick={() => setFaceOnly(!faceOnly)}>
              얼굴만 보기
            </button>
            <button type="button" className={chip(boxes)} onClick={() => setBoxes(!boxes)}>
              성격 · 운세
            </button>
          </div>
          <p className="text-[11px] text-ink-soft">특징 켜고 끄기</p>
          <div className="flex flex-wrap gap-1.5">
            {notes.map((n) => {
              const on = !hidden.includes(n.anchor);
              return (
                <button
                  key={n.anchor}
                  type="button"
                  className={chip(on)}
                  onClick={() => setHidden(on ? [...hidden, n.anchor] : hidden.filter((a) => a !== n.anchor))}
                >
                  {n.title}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 text-[12px] text-ink-soft">
            도식에 적을 이름
            <input value={name} maxLength={6} onChange={(e) => setName(e.target.value)} className="w-28 rounded border border-ink/20 bg-white/70 px-2 py-1 text-ink" />
          </label>
        </div>
      )}
    </div>
  );
}

function fmt(key: BandKey, v: number) {
  return key === "tilt" ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}°` : v.toFixed(2);
}

// While the painting is made: one screen, a few lines that change as the wait goes on.
function PaintingWait({ waited, retrying }: { waited: number; retrying: boolean }) {
  const lines = [
    "관상가가 얼굴을 살피고 있어요",
    "삼정과 오관을 재는 중이에요",
    "화원이 붓을 고르는 중이에요",
    "얼굴을 그리고 있어요",
    "눈빛에 생기를 넣는 중이에요",
    "비단에 색을 올리는 중이에요",
    "도식에 주석을 다는 중이에요",
  ];
  return (
    <section className="doc-paper flex flex-col items-center gap-4 px-5 py-10 text-center">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-hanji-deep border-t-seal" />
        <div className="absolute inset-3 grid place-items-center rounded-full bg-seal font-myeongjo text-xl font-extrabold text-hanji">觀</div>
      </div>
      <p className="font-myeongjo text-lg font-extrabold">
        {retrying ? "덜 닮아서 한 번 더 그리는 중이에요" : lines[Math.min(lines.length - 1, Math.floor(waited / 6))]}
      </p>
      <p className="text-[12px] text-ink-soft tabular-nums">보통 30~90초 걸려요 · {waited}초</p>
      <p className="text-[11px] text-jade">그림이 완성되면 관상 도식과 풀이를 한 번에 보여 드려요</p>
    </section>
  );
}

function ResultView({ result }: { result: Result }) {
  const x = useMemo(() => deepMeasure(result.face), [result]);
  const r = useMemo(() => gwansangReading(result.m, x), [result, x]);
  const [born, setBorn] = useState("");
  const age = /^(19|20)\d\d$/.test(born) ? new Date().getFullYear() - Number(born) + 1 : null;
  const { m } = result;
  const dev = thirdDev(m);
  const lead = leadThird(m);
  return (
    <>
      {/* 1. The portrait and the whole reading in a breath. */}
      <section className="doc-paper px-5 py-5">
        <p className="text-center text-xs font-extrabold text-seal">
          {result.source === "camera" ? `카메라 · ${result.frames}장을 겹쳐 잰 관상` : "사진 한 장으로 본 관상"}
        </p>
        {result.snap ? <ResultPortrait result={result} /> : <InkFace face={result.face} />}
        <p className="mt-4 text-center text-[12px] font-bold text-ink-soft">{r.sub}</p>
        <h2 className="mt-1 text-center font-myeongjo text-[22px] font-extrabold leading-snug">{r.headline}</h2>
        <p className="mt-2 flex flex-wrap justify-center gap-1.5">
          {r.keywords.map((k) => (
            <span key={k.text} className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${k.caution ? "border border-ink/30 text-ink" : "bg-seal/10 text-seal"}`}>
              {k.text}
            </span>
          ))}
        </p>
        <p className="mt-3 text-[14px] leading-[1.75]">{r.summary}</p>
        {r.strengths.length > 0 && (
          <div className="mt-4">
            <p className="text-[13px] font-extrabold text-seal">타고난 무기</p>
            <ul className="mt-1.5 flex flex-col gap-1.5 text-[13.5px] leading-relaxed">
              {r.strengths.map((s) => (
                <li key={s.name}>
                  <b>{s.name}</b>
                  <br />
                  {s.line}.
                </li>
              ))}
            </ul>
          </div>
        )}
        {r.watch.length > 0 && (
          <div className="mt-4 rounded-xl border border-ink/15 bg-white/50 px-3 py-3">
            <p className="text-[13px] font-extrabold">미리 챙길 것</p>
            <ul className="mt-1.5 flex flex-col gap-2.5 text-[13.5px] leading-relaxed">
              {r.watch.map((w) => (
                <li key={w.name}>
                  <p className="flex items-center gap-1.5">
                    <Badge g={w.grade} />
                    <b>{w.name}</b>
                  </p>
                  <p className="mt-0.5">{w.line}.</p>
                  <p className="text-[13px] font-bold text-jade">→ {w.prep}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Legend />
      </section>

      {/* 2. 오행형: the face's type and the temperament it carries. */}
      <Sec title="오행으로 본 얼굴" intro="관상은 얼굴 생김을 나무·불·흙·쇠·물 다섯 가지로 나눠, 그 사람의 기질을 먼저 봐요.">
        <div className="flex items-center gap-3 px-1">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded bg-seal font-myeongjo text-2xl text-hanji">{r.hyeong.el}</span>
          <div>
            <p className="font-myeongjo text-xl font-extrabold">{r.hyeong.label}</p>
            <p className="text-[12.5px] text-ink-soft">{r.hyeong.look}</p>
          </div>
        </div>
        <p className="mt-3 px-1 text-[14px] leading-[1.75]">{r.hyeong.nature}</p>
        {r.hyeong.mixed && <p className="mt-1.5 px-1 text-[13px] leading-relaxed text-ink-soft">{r.hyeong.mixed}</p>}
      </Sec>

      {/* 3. Temperament, feature by feature. */}
      <Sec title="성격 · 빛과 그림자" intro="얼굴 생김마다 기질이 하나씩 담겨 있어요. 같은 기질이 잘 쓰이면 빛, 지나치면 그림자가 돼요.">
        <ul className="flex flex-col divide-y divide-ink/10">
          {r.traits.map((t) => (
            <li key={t.key} className="px-1 py-2.5 text-[13.5px]">
              <p className="font-bold">
                {t.part} <span className="font-normal text-ink-soft">· {t.word}</span>
              </p>
              <p className="mt-1 leading-relaxed">
                <span className="mr-1.5 rounded bg-seal/15 px-1.5 text-[11px] font-bold text-seal">빛</span>
                {t.light}
              </p>
              <p className="mt-0.5 leading-relaxed">
                <span className="mr-1.5 rounded bg-ink px-1.5 text-[11px] font-bold text-hanji">그림자</span>
                {t.shadow}
              </p>
            </li>
          ))}
        </ul>
      </Sec>

      {/* 4. 삼정: the three spans of life, with the bars that show them. */}
      <Sec
        title="삼정 · 초년 중년 말년"
        hanja="三停"
        intro="얼굴을 이마, 눈썹에서 코끝, 인중에서 턱까지 세 마디로 나눠요. 각각 초년, 중년, 말년을 맡아서, 긴 마디의 시기에 힘이 실린다고 봐요."
      >
        <div className="mb-3 flex flex-col gap-1.5 px-1">
          {(["upper", "middle", "lower"] as const).map((k) => (
            <div key={k} className="grid grid-cols-[5.2em_1fr_6.6em] items-center gap-2 text-[12.5px]">
              <span>
                {THIRD_LABEL[k]}
              </span>
              <span className="relative h-2.5 overflow-hidden rounded bg-hanji-deep">
                <span className="absolute inset-y-0 left-1/2 w-px bg-ink/40" />
                <span
                  className={`absolute inset-y-0 ${lead === k ? "bg-seal" : "bg-jade"}`}
                  style={dev[k] >= 0 ? { left: "50%", width: `${Math.min(50, dev[k] * 250)}%` } : { right: "50%", width: `${Math.min(50, -dev[k] * 250)}%` }}
                />
              </span>
              <span className={`text-right tabular-nums ${lead === k ? "font-bold text-seal" : "text-ink-soft"}`}>
                보통보다 {Math.abs(Math.round(dev[k] * 100))}% {dev[k] >= 0 ? "길어요" : "짧아요"}
              </span>
            </div>
          ))}
        </div>
        <Items items={r.thirds.map((j) => ({ key: j.key, title: j.name, tag: j.hanja, sub: j.sub, grade: j.grade, line: j.line, prep: j.prep, plain: j.why }))} />
      </Sec>

      {/* 5. 오관. */}
      <Sec
        title="오관 · 다섯 벼슬"
        hanja="五官"
        intro="눈썹, 눈, 코, 입, 귀를 나라의 다섯 관리로 봐요. 저마다 맡은 일이 있어서, 관리가 튼튼하면 그 일이 잘 풀린다고 해요."
      >
        <Items items={r.organs.map((j) => ({ key: j.key, title: j.name, tag: j.hanja, sub: j.sub, grade: j.grade, line: j.line, prep: j.prep, plain: j.why }))} />
      </Sec>

      {/* 6. 오악. */}
      <Sec
        title="오악 · 얼굴의 다섯 산"
        hanja="五嶽"
        intro="이마, 코, 턱, 양 광대를 다섯 산으로 봐요. 산이 고루 솟아 서로 받쳐 주면 운이 한쪽으로 쏠리지 않는다고 해요."
      >
        <div className="mb-3 rounded-xl bg-seal/5 px-3 py-3">
          <p className={`font-myeongjo text-[17px] font-extrabold ${r.peaks.caution ? "text-ink" : "text-seal"}`}>{r.peaks.plain}</p>
          <p className="text-[11.5px] text-ink-soft">{r.peaks.verdict}</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed">{r.peaks.note}</p>
        </div>
        <Items items={r.peaks.list.map((p) => ({ key: p.name, title: p.name, tag: p.part, sub: p.means, grade: p.grade, line: p.line, prep: p.prep, plain: p.plain }))} />
      </Sec>

      {/* 7. Life areas. */}
      <Sec title="영역별 관상" intro="십이궁과 오악을 삶의 여섯 갈래로 묶어 본 풀이예요. 좋은 쪽은 살리는 법을, 조심할 쪽은 대비를 적었어요.">
        <Items
          items={r.cards.map((c) => ({ key: c.key, title: c.title, tag: c.hanja, grade: c.grade, line: c.line, tip: { label: c.tipLabel, text: c.tip }, plain: c.why }))}
        />
      </Sec>

      {/* 8. 십이궁. */}
      <Sec
        title="십이궁 · 얼굴 열두 자리"
        hanja="十二宮"
        intro="얼굴을 열두 자리로 나눠 자리마다 삶의 한 부분을 맡겨요. 그 자리가 넉넉하고 밝으면 그 일이 잘 풀린다고 봐요."
      >
        <Items items={r.palaces.map((p) => ({ key: p.name, title: p.name, tag: p.hanja, sub: `${p.where} · ${p.rules}`, about: p.about, grade: p.grade, line: p.line, prep: p.prep, plain: p.plain }))} />
      </Sec>

      {/* 9. 유년운기. */}
      <Sec title="유년운기 · 나이마다 보는 자리" intro="옛 관상서는 나이마다 얼굴의 다른 자리를 봤어요. 태어난 해를 넣으면 지금 어느 시기인지 짚어 드려요.">
        <label className="flex items-center gap-2 px-1 text-[12.5px] text-ink-soft">
          태어난 해
          <input
            value={born}
            onChange={(e) => setBorn(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="예: 1994"
            className="w-24 rounded border border-ink/20 bg-white/70 px-2 py-1 text-ink"
          />
          {age !== null && <span>· 올해 {age}세(세는나이)</span>}
        </label>
        <ol className="mt-2 flex flex-col gap-1.5">
          {r.flow.map((f) => {
            const now = age !== null && age >= f.from && age <= f.to;
            return (
              <li key={f.from} className={`flex items-start gap-2 rounded-lg px-2 py-2.5 ${now ? "bg-seal/10 ring-1 ring-seal/40" : ""}`}>
                <span className="w-16 shrink-0 text-[12.5px] font-bold tabular-nums">
                  {f.from}~{f.to}세{now && <span className="block text-[11px] text-seal">지금</span>}
                </span>
                <span className="min-w-0 flex-1 text-[13.5px] leading-relaxed">
                  <span className="text-[12px] text-ink-soft">{f.part}</span>
                  <span className="block">{f.line}</span>
                  {f.prep && <span className="block text-[13px] font-bold text-jade">→ {f.prep}</span>}
                </span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold ${MOOD_STYLE[f.mood]}`}>{f.mood}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 px-1 text-[11px] leading-relaxed text-ink-soft">
          『마의상법』의 유년도를 여섯 마디로 줄여 본 흐름이에요. 관상은 마음과 살아온 날을 따라 바뀐다고 했어요(相隨心生).
        </p>
      </Sec>

      <MeasureDetails result={result} r={r} />
    </>
  );
}

const THIRD_LABEL = { upper: "이마 · 초년", middle: "코 · 중년", lower: "턱 · 말년" } as const;
const MOOD_STYLE: Record<string, string> = { 활짝: "bg-seal text-hanji", 순조: "bg-seal/15 text-seal", 주의: "border border-seal/60 text-seal", 고비: "bg-ink text-hanji" };

function Sec({ title, hanja, intro, children }: { title: string; hanja?: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="doc-paper px-4 py-5">
      <h2 className="px-1 font-myeongjo text-[19px] font-extrabold">
        {title}
        {hanja && <span className="ml-1.5 text-[12px] font-normal text-ink-soft">{hanja}</span>}
      </h2>
      {intro && <p className="mt-1 px-1 text-[12.5px] leading-relaxed text-ink-soft">{intro}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Badge({ g }: { g: Grade }) {
  return <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold ${GRADE_STYLE[g]}`}>{g}</span>;
}

function Legend() {
  return (
    <p className="mt-4 flex flex-wrap items-center justify-center gap-1 text-[11px] text-ink-soft">
      {(["대길", "길", "주의", "경계"] as const).map((g) => (
        <Badge key={g} g={g} />
      ))}
      <span>· 앞의 둘은 좋은 쪽, 뒤의 둘은 미리 챙길 쪽</span>
    </p>
  );
}

// One graded reading: what the part is, the verdict in a sentence, what to do about it, and what it was read from.
type Item = {
  key: string;
  title: string;
  tag?: string;
  sub?: string;
  about?: string;
  grade: Grade;
  line: string;
  prep?: string | null;
  tip?: { label: string; text: string };
  plain?: string;
};
function Items({ items }: { items: Item[] }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((j) => (
        <div key={j.key} className="rounded-xl border border-ink/10 bg-white/50 px-3 py-3">
          <p className="flex items-center gap-2">
            {j.tag && <span className="shrink-0 rounded bg-ink px-1.5 py-0.5 font-myeongjo text-[12px] text-hanji">{j.tag}</span>}
            <b className="min-w-0 flex-1 text-[15px]">{j.title}</b>
            <Badge g={j.grade} />
          </p>
          {j.sub && <p className="mt-1 text-[12px] text-ink-soft">{j.sub}</p>}
          {j.about && <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{j.about}</p>}
          <p className="mt-1.5 text-[14px] leading-[1.7]">{j.line.endsWith("요") ? `${j.line}.` : j.line}</p>
          {j.prep && <p className="mt-1 text-[13px] font-bold leading-relaxed text-jade">대비 → {j.prep}</p>}
          {j.tip && (
            <p className={`mt-1 text-[13px] leading-relaxed ${j.tip.label === "대비" ? "font-bold text-jade" : "text-seal"}`}>
              {j.tip.label} → {j.tip.text}
            </p>
          )}
          {j.plain && j.grade !== "측정 안 함" && <p className="mt-1.5 text-[11px] text-ink-soft">이렇게 봤어요 · {j.plain}</p>}
        </div>
      ))}
    </div>
  );
}

// The numbers behind the reading, folded away: each measure, its retake spread and its band, and the
// palaces' and mountains' measures.
function MeasureDetails({ result, r }: { result: Result; r: ReturnType<typeof gwansangReading> }) {
  const { m } = result;
  return (
    <details className="doc-paper px-4 py-4">
      <summary className="cursor-pointer px-1 font-myeongjo font-extrabold">측정값 자세히 보기</summary>
      <table className="mt-3 w-full text-[12.5px] tabular-nums">
        <tbody>
          <tr className="border-t border-seal/10">
            <td className="py-1.5 text-ink-soft">삼정 (이마 · 코 · 턱)</td>
            <td colSpan={2} className="text-right">
              {(m.upper * 100).toFixed(1)}% · {(m.middle * 100).toFixed(1)}% · {(m.lower * 100).toFixed(1)}%
            </td>
          </tr>
          {KEYS.map((key) => {
            const v = m[key];
            const b = band(key, v);
            const sd = result.spread[key];
            return (
              <tr key={key} className="border-t border-seal/10">
                <td className="py-1.5 text-left text-ink-soft">{BANDS[key].label}</td>
                <td className="px-1 text-right">
                  {fmt(key, v)}
                  {sd !== undefined && <span className="block text-[10.5px] text-ink-soft">±{key === "tilt" ? sd.toFixed(1) : sd.toFixed(3)}</span>}
                </td>
                <td className="pl-2 text-right">{b.near ? <b className="text-seal">{wordOf(key, v)}</b> : wordOf(key, v)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ul className="mt-3 flex flex-col gap-1 text-[11.5px] text-ink-soft tabular-nums">
        {r.peaks.list.map((p) => (
          <li key={p.name}>
            <b className="text-ink">{p.name}</b> · {p.why}
          </li>
        ))}
        {r.palaces.map((p) => (
          <li key={p.name}>
            <b className="text-ink">{p.name}</b> · {p.why}
          </li>
        ))}
      </ul>
      <p className="mt-2 px-1 text-[10.5px] leading-relaxed text-ink-soft">
        ±는 촬영 중 찍힌 사진들 사이의 흔들림이에요. 붉은 글씨는 기준선 가까이라 두 풀이를 함께 적은 항목이에요. 기준선은 정면 얼굴 37명을 재어
        다섯 명 중 한 명이 양 끝에 들도록 잡았고, 실제 촬영이 모이면 다시 맞춰요.
      </p>
    </details>
  );
}

const GRADE_STYLE: Record<Grade, string> = {
  대길: "bg-seal text-hanji",
  길: "bg-seal/15 text-seal",
  주의: "border border-seal/60 text-seal",
  경계: "bg-ink text-hanji",
  "측정 안 함": "text-ink-soft/70",
};

function HistoryTable({ history, onClear }: { history: Reading[]; onClear: () => void }) {
  const rows = [...history].reverse();
  const when = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(11, 16);
  const words = (r: Reading, key: BandKey) => wordOf(key, r.m[key]);
  return (
    <section className="doc-paper px-3 py-4">
      <h2 className="flex items-baseline justify-between px-1 font-myeongjo font-extrabold">
        다시 찍어도 같게 나오나
        <button type="button" onClick={onClear} className="text-[11px] font-bold text-ink-soft underline">
          기록 지우기
        </button>
      </h2>
      <p className="mt-1 px-1 text-[11px] text-ink-soft">최근 {rows.length}번 · 위쪽이 최신 · 앞 결과와 다른 풀이는 붉게 표시</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="text-ink-soft">
              <th className="py-1 text-left font-normal">항목</th>
              {rows.map((r) => (
                <th key={r.at} className="px-1 font-normal">
                  {when(r.at)}
                  <span className="block text-[10px]">{r.source === "camera" ? "카메라" : "사진"}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-seal/10">
              <td className="py-1 text-left">오행형</td>
              {rows.map((r, i) => {
                const v = hyeong(r.m).label;
                const diff = i > 0 && v !== hyeong(rows[i - 1].m).label;
                return (
                  <td key={r.at} className={`px-1 text-center ${diff ? "font-bold text-seal" : ""}`}>
                    {v}
                  </td>
                );
              })}
            </tr>
            {KEYS.map((key) => (
              <tr key={key} className="border-t border-seal/10">
                <td className="py-1 text-left text-ink-soft">{BANDS[key].label}</td>
                {rows.map((r, i) => {
                  const v = words(r, key);
                  const diff = i > 0 && v !== words(rows[i - 1], key);
                  return (
                    <td key={r.at} className={`px-1 text-center ${diff ? "font-bold text-seal" : ""}`}>
                      {v}
                      <span className="block text-[9.5px] font-normal text-ink-soft tabular-nums">{fmt(key, r.m[key])}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
