import { useEffect, useState } from "react";
import type { Person } from "@/lib/pairToken";
import { BirthForm } from "@common/BirthForm";
import { forgetMe, loadMe, saveMe } from "@common/me";
import { Result } from "./Result";

// 내 사주 속 신살 찾기: one birth form, one card. The chart is kept on the phone (the same key as the 훈도사주 mini
// app's, but each mini app has its own storage).
export default function App() {
  const [me, setMe] = useState<Person | null | undefined>(undefined);

  useEffect(() => {
    loadMe().then(setMe);
  }, []);

  return (
    <main className="app">
      {me === undefined ? null : me === null ? (
        <BirthForm
          title="내 사주에 숨은 신살 찾기"
          cta="내 신살 보기"
          onDone={(p) => {
            void saveMe(p);
            setMe(p);
          }}
        />
      ) : (
        <Result
          me={me}
          onAgain={() => {
            void forgetMe();
            setMe(null);
          }}
        />
      )}
    </main>
  );
}
