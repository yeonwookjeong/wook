// Kenney 모델 시험 화면: 크기 맞추기 (사람 1.35, 가구 1.3, 음식 0.3)
import { useCurrentFrame } from "remotion";
import { Character, Prop } from "./kenney";
import { K, MiniFrame, MiniLights, Rig, SKY, Slab } from "./mini";

const P = { a: [K(0, 1.4, 3.4, 0, 0.5, 0), K(0, 1.4, 3.4, 0, 0.5, 0)] };
export const KenneyTest: React.FC = () => {
  const f = useCurrentFrame();
  const turn = f >= 1 ? 1 : 0;
  const S = 1.35, F = 1.3, FOOD = 0.3;
  return (
    <MiniFrame sky={SKY.night}>
      <Rig paths={P} mode="a" t={0} />
      <MiniLights dim={0.3} />
      <Slab c={[0, 0]} size={[5, 4]} top="#6f6a63" />
      <Prop kit="furniture" name="table" p={[-0.55, 0, -0.3]} s={F} />
      <Prop kit="furniture" name="chair" p={[-0.62, 0, 0.05]} r={[0, Math.PI / 2, 0]} s={F} />
      <Prop kit="furniture" name="chair" p={[0.62, 0, 0.05]} r={[0, -Math.PI / 2, 0]} s={F} />
      <Character kind="male-c" p={[-0.62, 0, 0.05]} ry={Math.PI / 2} clip="sit" animT={0.2} s={S} />
      <Character kind="female-a" p={[0.62, 0, 0.05]} ry={-Math.PI / 2} clip={turn ? "holding-right" : "sit"} animT={0.2} headYaw={turn ? 1.2 : 0} s={S} hold={<Prop kit="food" name="glass" s={FOOD / S} />} />
      <Prop kit="food" name="soda-bottle" p={[0, 0.43, -0.05]} s={FOOD} />
      <Prop kit="food" name="glass" p={[-0.2, 0.43, 0.05]} s={FOOD} />
      <Prop kit="food" name="plate" p={[0.05, 0.43, 0.12]} s={FOOD} />
      <Character kind="male-a" p={[-1.5, 0, 0.6]} clip="idle" animT={0.3} s={S} />
      <Character kind="female-c" p={[1.5, 0, 0.6]} clip="walk" animT={0.3} s={S} />
    </MiniFrame>
  );
};
