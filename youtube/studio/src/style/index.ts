// 화풍 시험용 별도 진입점 (본편 Root와 분리: 본편 렌더 중에도 안전하게 작업)
import { registerRoot } from "remotion";
import { StyleRoot } from "./StyleRoot";
registerRoot(StyleRoot);
