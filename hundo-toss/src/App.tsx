import { useEffect, useState } from "react";
import type { Person } from "@/lib/pairToken";
import { BirthForm } from "./BirthForm";
import { forgetMe, loadMe, saveMe } from "./me";
import { MineView } from "./MineView";
import { restorePending } from "./purchase";
import { ReportView } from "./ReportView";
import { ShopView } from "./ShopView";
import { TodayView } from "./TodayView";
import { YearView } from "./YearView";

type Tab = "today" | "year" | "shop" | "mine";
const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "오늘" },
  { id: "year", label: "신년운세" },
  { id: "shop", label: "보고서" },
  { id: "mine", label: "내 보고서" },
];

export default function App() {
  const [me, setMe] = useState<Person | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("today");
  const [reading, setReading] = useState<{ order: string; opens: string[] } | null>(null);
  const [restored, setRestored] = useState(0);

  useEffect(() => {
    loadMe().then(setMe);
  }, []);

  // A payment whose report was never opened (the app closed midway) is granted as soon as the chart is known.
  useEffect(() => {
    if (me) restorePending(me).then(setRestored);
  }, [me]);

  if (me === undefined) return <main className="app" />;
  if (me === null)
    return (
      <main className="app">
        <BirthForm
          onDone={(p) => {
            void saveMe(p);
            setMe(p);
          }}
        />
      </main>
    );

  return (
    <main className="app">
      {reading ? (
        <ReportView order={reading.order} products={reading.opens} onBack={() => setReading(null)} />
      ) : (
        <>
          <nav className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={t.id === tab ? "on" : undefined} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          {restored > 0 && (
            <p className="notice" onClick={() => setTab("mine")}>
              결제한 보고서 {restored}개를 열어 두었어요. “내 보고서”에서 볼 수 있어요.
            </p>
          )}
          {tab === "today" && <TodayView me={me} />}
          {tab === "year" && <YearView me={me} onBuy={() => setTab("shop")} />}
          {tab === "shop" && <ShopView me={me} onOpen={(order, opens) => setReading({ order, opens })} />}
          {tab === "mine" && <MineView onOpen={(order, opens) => setReading({ order, opens })} />}
          <button
            className="link"
            onClick={() => {
              void forgetMe();
              setMe(null);
            }}
          >
            내 정보 다시 입력
          </button>
          <p className="quiet small center">사주 풀이는 재미와 참고를 위한 것이에요.</p>
        </>
      )}
    </main>
  );
}
