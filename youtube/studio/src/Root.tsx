import { Composition } from "remotion";
import { WordCard, wordCardDefaults } from "./WordCard";
import { WoodcutIrworobong } from "./scenes/WoodcutIrworobong";
import { Ep01, EP01_FRAMES } from "./ep01/Ep01";

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
      <Composition id="Ep01" component={Ep01} durationInFrames={EP01_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Woodcut" component={WoodcutIrworobong} durationInFrames={150} fps={30} width={1080} height={1920} />
    </>
  );
};
