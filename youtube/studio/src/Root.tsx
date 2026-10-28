import { Composition } from "remotion";
import { WordCard, wordCardDefaults } from "./WordCard";

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
    </>
  );
};
