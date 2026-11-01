import { useState } from "react";
import { BirthInputError } from "@/lib/saju";
import type { Person } from "@/lib/pairToken";
import { personFromForm } from "./me";

// One form for the reader's own chart: name, birth date, calendar, time (optional) and gender. Read with the site's
// own rules (lib/personForm.ts), so the chart here is the same chart the site and the reports use.
export function BirthForm({ onDone }: { onDone: (p: Person) => void }) {
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      onDone(personFromForm(new FormData(e.currentTarget)));
    } catch (err) {
      setError(err instanceof BirthInputError ? err.message : "입력한 내용을 다시 확인해 주세요.");
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <div className="intro">
        <img src="/hundo-face.png" alt="" width={64} height={64} />
        <div>
          <p className="kicker">관상감 막내 · 정 훈도</p>
          <h1>생일 하나로 보는 내 사주</h1>
          <p className="quiet">생년월일은 이 휴대폰에만 저장돼요.</p>
        </div>
      </div>
      <label>
        이름 또는 별명
        <input name="name" maxLength={10} autoComplete="nickname" placeholder="예: 지은" required />
      </label>
      <label>
        생년월일 8자리
        <input name="birth" inputMode="numeric" maxLength={10} placeholder="예: 19950312" required />
      </label>
      <fieldset className="row">
        <legend>달력</legend>
        <label className="chip">
          <input type="radio" name="calendar" value="solar" defaultChecked /> 양력
        </label>
        <label className="chip">
          <input type="radio" name="calendar" value="lunar" /> 음력
        </label>
        <label className="chip">
          <input type="radio" name="calendar" value="lunar-leap" /> 음력 윤달
        </label>
      </fieldset>
      <label>
        태어난 시각 (모르면 비워 두세요)
        <input name="time" inputMode="numeric" placeholder="예: 0930 또는 오후 9시 30분" />
      </label>
      <fieldset className="row">
        <legend>성별</legend>
        <label className="chip">
          <input type="radio" name="gender" value="f" /> 여성
        </label>
        <label className="chip">
          <input type="radio" name="gender" value="m" /> 남성
        </label>
      </fieldset>
      {error && <p className="error">{error}</p>}
      <button className="primary" type="submit">
        내 사주 보기
      </button>
    </form>
  );
}
