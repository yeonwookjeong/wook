// Kenney 3D 모델 (CC0, public/models/kenney/LICENSE-kenney-CC0.txt)
//  - Character: Mini Characters. 동작(clip)을 정해진 시각(animT)으로 맞추고, 머리 방향(headYaw)을 따로 돌릴 수 있다.
//    손에 든 물건은 hold 로 넘기면 오른팔(arm-right)에 붙는다.
//  - Prop: 음식·가구 모델 하나
import { createPortal, useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { staticFile } from "remotion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";

export type CharKind =
  | "male-a" | "male-b" | "male-c" | "male-d" | "male-e" | "male-f" | "male-g"
  | "female-a" | "female-b" | "female-c" | "female-d" | "female-e" | "female-f"
  | "worker" | "soldier";
export type Clip =
  | "static" | "idle" | "walk" | "sprint" | "jump" | "fall" | "crouch" | "sit" | "pick-up" | "drive"
  | "emote-yes" | "emote-no" | "holding-right" | "holding-left" | "holding-both" | "interact-right" | "interact-left";

/** 캐릭터 키를 우리 모형 세상 사람(약 1.0)에 맞추는 배율 */
export const CHAR_SCALE = 1.0;

export const Character: React.FC<{
  kind: CharKind;
  p?: [number, number, number];
  ry?: number;
  s?: number;
  clip?: Clip;
  /** 동작 안에서의 시각(초) */
  animT?: number;
  /** 머리만 좌우로 돌리기(라디안, +가 왼쪽) */
  headYaw?: number;
  /** 머리 끄덕/젖히기 */
  headPitch?: number;
  /** 오른팔에 붙일 물건 */
  hold?: React.ReactNode;
  /** 왼팔에 붙일 물건 */
  holdLeft?: React.ReactNode;
}> = ({ kind, p = [0, 0, 0], ry = 0, s = 1, clip = "idle", animT = 0, headYaw = 0, headPitch = 0, hold, holdLeft }) => {
  const gltf = useLoader(GLTFLoader, staticFile(`models/kenney/characters/character-${kind}.glb`));
  const { obj, mixer, nodes } = useMemo(() => {
    const o = skeletonClone(gltf.scene) as THREE.Object3D;
    o.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const mx = new THREE.AnimationMixer(o);
    const byName: Record<string, THREE.Object3D> = {};
    o.traverse((m) => (byName[m.name] = m));
    return { obj: o, mixer: mx, nodes: byName };
  }, [gltf]);
  const action = useMemo(() => {
    const c = gltf.animations.find((a) => a.name === clip) ?? gltf.animations[0];
    mixer.stopAllAction();
    const a = mixer.clipAction(c);
    a.play();
    return a;
  }, [mixer, gltf, clip]);
  // 정해진 시각으로 자세를 맞춘다 (렌더마다 같은 결과)
  action.time = 0;
  mixer.setTime(Math.max(0, animT) % Math.max(0.0001, action.getClip().duration));
  if (nodes.head) {
    nodes.head.rotation.y += headYaw;
    nodes.head.rotation.x += headPitch;
  }
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s * CHAR_SCALE}>
      <primitive object={obj} />
      {hold && nodes["arm-right"] && createPortal(<>{hold}</>, nodes["arm-right"])}
      {holdLeft && nodes["arm-left"] && createPortal(<>{holdLeft}</>, nodes["arm-left"])}
    </group>
  );
};

export const Prop: React.FC<{ kit: "food" | "furniture"; name: string; p?: [number, number, number]; r?: [number, number, number]; s?: number }> = ({ kit, name, p = [0, 0, 0], r = [0, 0, 0], s = 1 }) => {
  const gltf = useLoader(GLTFLoader, staticFile(`models/kenney/${kit}/${name}.glb`));
  const obj = useMemo(() => {
    const o = gltf.scene.clone(true);
    o.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return o;
  }, [gltf]);
  return <primitive object={obj} position={p} rotation={r} scale={s} />;
};
