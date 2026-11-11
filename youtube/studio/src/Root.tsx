import { Composition } from "remotion";
import { WordCard, wordCardDefaults } from "./WordCard";
import { WoodcutIrworobong } from "./scenes/WoodcutIrworobong";
import { Ep01, EP01_ES_FRAMES, EP01_FRAMES } from "./ep01/Ep01";
import { MapOpening, MapRef, MAP_OPENING_FRAMES } from "./components/MapOpening";
import { Banner } from "./brand/Banner";
import { Floor4_3D, FLOOR4_FRAMES } from "./samples/Floor4_3D";
import { Complex3D, COMPLEX_FRAMES } from "./samples/Complex3D";
import { PanelTest, PANEL_TEST_FRAMES } from "./three/Panel3D";
import { ScenesTest, SCENES_TEST_FRAMES } from "./three/Scenes3D";
import { WorldTest, WORLD_TEST_FRAMES } from "./three/World";
import { Ep02, EP02, Ep02Check } from "./ep02/Ep02";
import { Ep03, EP03, Ep03Check } from "./ep03/Ep03";
import { Ep04, EP04, Ep04Check } from "./ep04/Ep04";
import { Ep05, EP05, Ep05Check } from "./ep05/Ep05";
import { Ep06, EP06, Ep06Check } from "./ep06/Ep06";
import { Ep07, EP07, Ep07Check } from "./ep07/Ep07";
import { KenneyTest } from "./three/KenneyTest";
import { KenneyMeasure } from "./three/KenneyMeasure";

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
      <Composition id="Ep02" component={Ep02} durationInFrames={EP02.en.total} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
      <Composition id="Ep02Es" component={Ep02} durationInFrames={EP02.es.total} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
      <Composition id="Ep02Check" component={Ep02Check} durationInFrames={22} fps={30} width={1080} height={1920} />
      <Composition id="Ep03" component={Ep03} durationInFrames={EP03.en.total} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
      <Composition id="Ep03Es" component={Ep03} durationInFrames={EP03.es.total} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
      <Composition id="Ep03Check" component={Ep03Check} durationInFrames={20} fps={30} width={1080} height={1920} />
      <Composition id="Ep04" component={Ep04} durationInFrames={EP04.en.total} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
      <Composition id="Ep04Es" component={Ep04} durationInFrames={EP04.es.total} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
      <Composition id="Ep04Check" component={Ep04Check} durationInFrames={26} fps={30} width={1080} height={1920} />
      <Composition id="Ep05" component={Ep05} durationInFrames={EP05.en.total} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
      <Composition id="Ep05Es" component={Ep05} durationInFrames={EP05.es.total} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
      <Composition id="Ep05Check" component={Ep05Check} durationInFrames={14} fps={30} width={1080} height={1920} />
      <Composition id="Ep06" component={Ep06} durationInFrames={EP06.en.total} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
      <Composition id="Ep06Es" component={Ep06} durationInFrames={EP06.es.total} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
      <Composition id="Ep06Check" component={Ep06Check} durationInFrames={14} fps={30} width={1080} height={1920} />
      <Composition id="Ep07" component={Ep07} durationInFrames={EP07.en.total} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" as const }} />
      <Composition id="Ep07Es" component={Ep07} durationInFrames={EP07.es.total} fps={30} width={1080} height={1920} defaultProps={{ lang: "es" as const }} />
      <Composition id="Ep07Check" component={Ep07Check} durationInFrames={14} fps={30} width={1080} height={1920} />
      <Composition id="KenneyTest" component={KenneyTest} durationInFrames={2} fps={30} width={1080} height={1920} />
      <Composition id="KenneyMeasure" component={KenneyMeasure} durationInFrames={1} fps={30} width={64} height={64} />
      <Composition id="MapOld" component={MapOpening} durationInFrames={MAP_OPENING_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ variant: "old" as const }} />
      <Composition id="MapModern" component={MapOpening} durationInFrames={MAP_OPENING_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ variant: "modern" as const }} />
      <Composition id="MapRef" component={MapRef} durationInFrames={1} fps={30} width={1024} height={1536} />
      <Composition id="Banner" component={Banner} durationInFrames={1} fps={30} width={2560} height={1440} defaultProps={{ showSafe: false }} />
      <Composition id="BannerEs" component={Banner} durationInFrames={1} fps={30} width={2560} height={1440} defaultProps={{ showSafe: false, lang: "es" as const }} />
      <Composition id="BannerEsSafe" component={Banner} durationInFrames={1} fps={30} width={2560} height={1440} defaultProps={{ showSafe: true, lang: "es" as const }} />
      <Composition id="BannerSafe" component={Banner} durationInFrames={1} fps={30} width={2560} height={1440} defaultProps={{ showSafe: true }} />
      <Composition id="Floor4" component={Floor4_3D} durationInFrames={FLOOR4_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Complex3D" component={Complex3D} durationInFrames={COMPLEX_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="PanelTest" component={PanelTest} durationInFrames={PANEL_TEST_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="ScenesTest" component={ScenesTest} durationInFrames={SCENES_TEST_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="WorldTest" component={WorldTest} durationInFrames={WORLD_TEST_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Woodcut" component={WoodcutIrworobong} durationInFrames={150} fps={30} width={1080} height={1920} />
    </>
  );
};
