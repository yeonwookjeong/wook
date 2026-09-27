import BirthTimeFields from "./BirthTimeFields";

const CALENDARS = [
  { value: "solar", label: "양력" },
  { value: "lunar", label: "음력" },
  { value: "lunar-leap", label: "음력 윤달" },
] as const;

const GENDERS = [
  { value: "m", label: "남" },
  { value: "f", label: "여" },
  { value: "", label: "밝히지 않음" },
] as const;

const choice =
  "block rounded-xl border border-ink/15 bg-white/50 py-2.5 text-center text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-hanji peer-focus-visible:ring-2 peer-focus-visible:ring-seal";

// One person's name, birth date, time, place and gender. `prefix` names the fields when a form holds two.
export default function PersonFields({
  prefix = "",
  nameLabel,
  unknownHour,
  genderLabel = "성별 (선택 · 10년 대운 풀이에 쓰이옵니다)",
}: {
  prefix?: string;
  nameLabel: string;
  unknownHour: string;
  genderLabel?: string;
}) {
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink-soft">{nameLabel}</span>
        <input
          name={`${prefix}name`}
          required
          maxLength={10}
          autoComplete="nickname"
          placeholder="이름 또는 별명 (10자 이내)"
          className="rounded-xl border border-ink/15 bg-white/70 px-4 py-3 text-base outline-none focus:border-seal"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink-soft">생년월일</span>
        <input
          name={`${prefix}birth`}
          required
          inputMode="numeric"
          pattern="[0-9]{8}"
          maxLength={8}
          placeholder="19950312"
          className="rounded-xl border border-ink/15 bg-white/70 px-4 py-3 text-base tracking-widest outline-none focus:border-seal"
        />
      </label>

      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="sr-only">달력</legend>
        {CALENDARS.map((c, i) => (
          <label key={c.value} className="cursor-pointer">
            <input type="radio" name={`${prefix}calendar`} value={c.value} defaultChecked={i === 0} className="peer sr-only" />
            <span className={choice}>{c.label}</span>
          </label>
        ))}
      </fieldset>

      <BirthTimeFields unknownLabel={unknownHour} prefix={prefix} />

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold text-ink-soft">{genderLabel}</legend>
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map((g) => (
            <label key={g.value} className="cursor-pointer">
              <input type="radio" name={`${prefix}gender`} value={g.value} defaultChecked={g.value === ""} className="peer sr-only" />
              <span className={choice}>{g.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
