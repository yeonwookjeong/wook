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
  genderLabel,
  modern = false,
  binaryGender = false,
  defaultName,
  foldExtras = false,
}: {
  prefix?: string;
  modern?: boolean;
  // The game (/king) asks only name and birthday up front; time, place and gender fold away as optional.
  foldExtras?: boolean;
  defaultName?: string;
  nameLabel: string;
  unknownHour: string;
  genderLabel?: string;
  // Only 남/여 (no "밝히지 않음"): where the reading cannot go deep without it.
  binaryGender?: boolean;
}) {
  // The site's forms (modern) have no gender picked in advance: left alone, most people kept "밝히지 않음" and
  // lost the 10-year flow and the spouse star. The choice is required, "밝히지 않음" stays one of them.
  const pick = modern;
  const label = genderLabel ?? (modern ? "성별 · 10년 흐름과 배우자 자리를 볼 때 쓰여요" : "성별 (선택 · 10년 대운 풀이에 쓰이옵니다)");
  const genders = binaryGender ? GENDERS.filter((g) => g.value) : GENDERS;
  const extras = (
    <>
      <BirthTimeFields unknownLabel={unknownHour} prefix={prefix} modern={modern} />

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold text-ink-soft">{label}</legend>
        <div className={`grid gap-2 ${genders.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {genders.map((g) => (
            <label key={g.value} className="cursor-pointer">
              <input
                type="radio"
                name={`${prefix}gender`}
                value={g.value}
                defaultChecked={!pick && g.value === ""}
                required={pick}
                className="peer sr-only"
              />
              <span className={choice}>{g.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink-soft">{nameLabel}</span>
        <input
          name={`${prefix}name`}
          required
          maxLength={10}
          autoComplete="nickname"
          defaultValue={defaultName}
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

      {foldExtras ? (
        <details className="group rounded-xl border border-ink/15 bg-white/40">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-ink-soft [&::-webkit-details-marker]:hidden">
            태어난 시각 · 성별 (선택, 더 정확하게)
            <span className="ml-1 inline-block transition group-open:rotate-180">▾</span>
          </summary>
          <div className="flex flex-col gap-4 border-t border-ink/10 px-4 pt-4 pb-4">{extras}</div>
        </details>
      ) : (
        extras
      )}
    </>
  );
}
