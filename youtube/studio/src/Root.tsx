import { Composition } from "remotion";
import { WordCard, wordCardDefaults } from "./WordCard";
import { WoodcutIrworobong } from "./scenes/WoodcutIrworobong";
import { Ep01, EP01_ES_FRAMES, EP01_FRAMES } from "./ep01/Ep01";
import { MapOpening, MapRef, MAP_OPENING_FRAMES } from "./components/MapOpening";
import { Banner } from "./brand/Banner";
import { Floor4_3D, FLOOR4_FRAMES } from "./samples/Floor4_3D";
import { Complex3D, COMPLEX_FRAMES } from "./samples/Complex3D";

// 쇼츠 규격: 세로 1080×1920, 30fps
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Test"
        component={WordCard}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={wordCardDefaults}
      />
      <Composition id="Ep01" component={Ep01} durationInFrames={EP01_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
      <Composition id="Ep01Es" component={Ep01} durationInFrames={EP01_ES_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
      <Composition id="MapOld" component={MapOpening} durationInFrames={MAP_OPENING_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ variant: "old" as const }} />
      <Composition id="MapModern" component={MapOpening} durationInFrames={MAP_OPENING_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ variant: "modern" as const }} />
      <Composition id="MapRef" component={MapRef} durationInFrames={1} fps={30} width={1024} height={1536} />
      <Composition id="Banner" component={Banner} durationInFrames={1} fps={30} width={2560} height={1440} defaultProps={{ showSafe: false }} />
      <Composition id="BannerSafe" component={Banner} durationInFrames={1} fps={30} width={2560} height={1440} defaultProps={{ showSafe: true }} />
      <Composition id="Floor4" component={Floor4_3D} durationInFrames={FLOOR4_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Complex3D" component={Complex3D} durationInFrames={COMPLEX_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Woodcut" component={WoodcutIrworobong} durationInFrames={150} fps={30} width={1080} height={1920} />
    </>
  );
};
