// 모델 실제 크기 재기 (렌더 로그로 출력)
import { useLoader } from "@react-three/fiber";
import { staticFile } from "remotion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ThreeCanvas } from "@remotion/three";

const LIST = ["characters/character-male-a", "characters/character-female-a", "furniture/table", "furniture/chair", "furniture/bedSingle", "furniture/loungeSofa", "food/glass", "food/soda-bottle", "food/plate", "food/bowl"];
const M: React.FC<{ f: string }> = ({ f }) => {
  const g = useLoader(GLTFLoader, staticFile(`models/kenney/${f}.glb`));
  const b = new THREE.Box3().setFromObject(g.scene);
  const s = b.getSize(new THREE.Vector3());
  console.warn("SIZE " + f + " " + s.x.toFixed(3) + " " + s.y.toFixed(3) + " " + s.z.toFixed(3) + " minY " + b.min.y.toFixed(3));
  return null;
};
export const KenneyMeasure: React.FC = () => (
  <ThreeCanvas width={64} height={64}>
    {LIST.map((f) => <M key={f} f={f} />)}
  </ThreeCanvas>
);
