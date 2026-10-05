"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { FaceLandmarker, FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { drawChart } from "@/lib/gwansangChart";
import { BANDS, band, bounty, hyeong, IDX, level, measure, medianFace, wordOf, yongmo, type BandKey, type Face, type Metrics, type Pt } from "@/lib/gwansang";

// The 관상 capture test (/lab/gwansang): the camera shows a guide, and the face is taken only once it is the
// right size, centred, facing straight, expressionless and well lit for HOLD_MS in a row. The frames of that
// hold are merged point by point (lib/gwansang.ts medianFace). Nothing leaves the device: the last frame stays
// in memory only, for a painting the viewer may order (/api/portrait); past readings (numbers only) stay in this
// browser, to compare retakes.

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const HOLD_MS = 1500;
const MIN_FRAMES = 10;
const HISTORY_KEY = "gwansang-lab-history";
const KEYS = Object.keys(BANDS) as BandKey[];

type Check = { key: string; ok: boolean; tip: string };
type Pose = { yaw: number; pitch: number; roll: number };
type Reading = { at: number; source: "camera" | "photo"; frames: number; m: Metrics };
// The frame a painting may be ordered from, with its own face points: held in memory on this page only.
type Snap = { canvas: HTMLCanvasElement; pts: Pt[] };
type Result = Reading & { face: Face; spread: Partial<Record<BandKey, number>>; snap: Snap | null };

// One still-image reader for the page: photos, and the painting that comes back (to pin the chart's notes).
let imageReader: Promise<FaceLandmarker> | null = null;
const imageLandmarker = () => (imageReader ??= makeLandmarker("IMAGE"));

async function makeLandmarker(mode: "VIDEO" | "IMAGE"): Promise<FaceLandmarker> {
  const { FaceLandmarker: FL, FilesetResolver } = await import("@mediapipe/tasks-vision");
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
  const hold = useRef<{ t0: number; faces: Face[] }>({ t0: 0, faces: [] });
  const [phase, setPhase] = useState<"idle" | "loading" | "camera" | "done">("idle");
  const [message, setMessage] = useState("");
  const [checks, setChecks] = useState<Check[]>([]);
  const [pose, setPose] = useState<Pose | null>(null);
  const [progress, setProgress] = useState(0);
  const [dims, setDims] = useState({ w: 3, h: 4 });
  const [relaxed, setRelaxed] = useState(false);
  const relaxedRef = useRef(false);
  const [result, setResult] = useState<Result | null>(null);
  const raw = useSyncExternalStore(subscribeHistory, rawHistory, () => "[]");
  const history = useMemo(() => parseHistory(raw), [raw]);

  useEffect(() => () => stopCamera(), []);
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
    setResult({ ...reading, face, spread, snap });
    setPhase("done");
  }

  async function startCamera() {
    setResult(null);
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
            if (!h.t0) h.t0 = now;
            h.faces.push({ pts: r.faceLandmarks[0].map((p): Pt => [p.x, p.y]), z: r.faceLandmarks[0].map((p) => p.z), aspect: video.videoWidth / video.videoHeight });
            const p = Math.min(1, (now - h.t0) / HOLD_MS);
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
          } else {
            hold.current = { t0: 0, faces: [] };
            setProgress(0);
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
      finish({ pts, z: lm.map((p) => p.z), aspect }, [], "photo", { canvas: cv, pts });
    } catch {
      setPhase("idle");
      setMessage("사진을 읽지 못했어요. JPG나 PNG 사진으로 다시 골라 주세요.");
    }
  }

  const failing = checks.find((c) => !c.ok);
  const ready = checks.length > 0 && !failing;
  // The guide: an oval the face should fill, the eye line and the centre line, in the video's own pixels.
  const ry = dims.h * 0.3;
  const rx = ry / 1.35;
  const ringLen = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));

  return (
    <div className="mt-5 flex flex-col gap-4">
      {phase !== "camera" && (
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
              <ellipse
                cx={dims.w / 2}
                cy={dims.h * 0.5}
                rx={rx}
                ry={ry}
                fill="none"
                stroke="#b3261e"
                strokeWidth={dims.w / 60}
                strokeDasharray={`${ringLen * progress} ${ringLen}`}
                transform={`rotate(-90 ${dims.w / 2} ${dims.h * 0.5})`}
              />
              <line x1={dims.w / 2 - rx} x2={dims.w / 2 + rx} y1={dims.h * 0.43} y2={dims.h * 0.43} stroke="#f4ecdb" strokeDasharray="10 10" strokeWidth={dims.w / 300} opacity="0.7" />
              <line x1={dims.w / 2} x2={dims.w / 2} y1={dims.h * 0.5 - ry * 0.55} y2={dims.h * 0.5 + ry * 0.35} stroke="#f4ecdb" strokeDasharray="10 10" strokeWidth={dims.w / 300} opacity="0.7" />
            </svg>
            <p className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-ink/80 px-4 py-1.5 text-[13px] font-bold text-hanji">
              {checks.length === 0 ? "얼굴을 찾는 중…" : failing ? failing.tip : progress > 0 ? "그대로 계세요…" : "좋아요"}
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

      {result && phase === "done" && <ResultView result={result} />}
      {history.length > 0 && phase !== "camera" && <HistoryTable history={history} onClear={() => saveHistory([])} />}
    </div>
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

async function chart(src: string, result: Result, name: string): Promise<string> {
  const painting = new Image();
  painting.src = src;
  await painting.decode();
  let paintPts: Pt[] | null = null;
  try {
    const found = (await imageLandmarker()).detect(painting).faceLandmarks[0];
    if (found) paintPts = found.map((p): Pt => [p.x, p.y]);
  } catch {}
  const h = hyeong(result.m);
  const order = "木火土金水";
  const els = (h.mixed ? [h.main.el, h.mixed.el] : [h.main.el]).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return drawChart({ painting, paintPts, facePts: result.face.pts, m: result.m, title: h.label, hanja: `${els.join("")}形`, name });
}

// The result's portrait: the face crop goes to /api/portrait, comes back painted in the shared style, and is laid
// out as a 관상 도식 with notes pinned to the face. The line drawing stands in while it is painted, and stays
// when painting fails.
function ResultPortrait({ result }: { result: Result }) {
  const [raw, setRaw] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(null);
  const [status, setStatus] = useState("관상가가 도식을 그리는 중이에요 · 20~60초");
  const [name, setName] = useState("무명씨");
  const asked = useRef(0);

  useEffect(() => {
    if (!result.snap || asked.current === result.at) return;
    asked.current = result.at;
    const photo = photoDataUrl(result.snap);
    fetch("/api/portrait", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ photo }) })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(async ({ ok, data }) => {
        if (!ok || !data.image) {
          setStatus(data.error ?? "그림을 받지 못했어요.");
          return;
        }
        setRaw(data.image);
        setShown(await chart(data.image, result, "무명씨"));
        setStatus(`${data.model} · ${(data.ms / 1000).toFixed(0)}초 · 길게 눌러 저장`);
      })
      .catch(() => setStatus("화원에게 닿지 못했어요."));
  }, [result]);

  async function rename(v: string) {
    setName(v);
    if (raw) setShown(await chart(raw, result, v.trim() || "무명씨"));
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element -- a painting returned as a data URL
        <img src={shown} alt="관상 도식" className="w-full rounded shadow-[0_2px_12px_rgba(0,0,0,0.2)]" />
      ) : (
        <div className={raw === null ? "animate-pulse" : ""}>
          <InkFace face={result.face} />
        </div>
      )}
      {shown && (
        <label className="flex items-center gap-2 text-[12.5px] text-ink-soft">
          도식에 적을 이름
          <input value={name} maxLength={6} onChange={(e) => rename(e.target.value)} className="w-28 rounded border border-ink/20 bg-white/70 px-2 py-1 text-ink" />
        </label>
      )}
      <p className="text-[11px] text-ink-soft">{status}</p>
    </div>
  );
}

function fmt(key: BandKey, v: number) {
  return key === "tilt" ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}°` : v.toFixed(2);
}

function ResultView({ result }: { result: Result }) {
  const { m } = result;
  const h = hyeong(m);
  const parts: [string, number, string][] = [
    ["상정", m.upper, "초년"],
    ["중정", m.middle, "중년"],
    ["하정", m.lower, "말년"],
  ];
  const top = Math.max(m.upper, m.middle, m.lower);
  return (
    <>
      <section className="doc-paper px-5 py-5">
        <p className="text-center text-xs font-extrabold text-seal">
          {result.source === "camera" ? `카메라 · ${result.frames}장의 중간값` : "사진 한 장"}
        </p>
        {result.snap ? <ResultPortrait result={result} /> : <InkFace face={result.face} />}
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded bg-seal font-myeongjo text-2xl text-hanji">{h.main.el}</span>
          <span className="font-myeongjo text-2xl font-extrabold">{h.label}</span>
          <span className="text-[13px] text-ink-soft">{h.main.look}</span>
        </div>
        {h.mixed && <p className="mt-1 text-center text-[12.5px] text-ink-soft">{h.main.name}과 {h.mixed.name}의 경계에 있는 겸형이에요</p>}
        <div className="mt-4 flex flex-col gap-1.5">
          {parts.map(([n, v, age]) => (
            <div key={n} className="grid grid-cols-[4.5em_1fr_3.2em] items-center gap-2 text-[12.5px]">
              <span>
                {n} <span className="text-ink-soft">{age}</span>
              </span>
              <span className="h-2.5 overflow-hidden rounded bg-hanji-deep">
                <span className={`block h-full ${v === top ? "bg-seal" : "bg-jade"}`} style={{ width: `${v * 200}%` }} />
              </span>
              <span className="text-right tabular-nums">{(v * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="doc-paper px-4 py-4">
        <h2 className="px-1 font-myeongjo font-extrabold">오관 치수</h2>
        <table className="mt-2 w-full text-[12.5px] tabular-nums">
          <tbody>
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
        <p className="mt-2 px-1 text-[10.5px] leading-relaxed text-ink-soft">
          ±는 1.5초 동안 찍힌 사진들 사이의 흔들림이에요. 붉은 풀이는 기준선 가까이에 있어 두 풀이를 함께 적은 항목이에요.
        </p>
      </section>

      <section className="rounded-2xl border-2 border-ink/70 bg-hanji-deep px-5 py-5">
        <p className="text-center font-myeongjo text-2xl font-extrabold tracking-[0.3em]">容貌疤記</p>
        <p className="mt-1 text-center text-[12px] text-ink-soft">용모파기 · 이런 얼굴을 보거든 관아에 고하라</p>
        <p className="mt-3 font-myeongjo text-[15px] leading-loose">{yongmo(m).join(" ")}</p>
        <p className="mt-3 text-right font-myeongjo text-lg font-extrabold text-seal">현상금 엽전 {bounty(m)}냥</p>
      </section>
    </>
  );
}

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
