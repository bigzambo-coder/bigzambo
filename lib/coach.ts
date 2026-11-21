export type CheckIn = {
  id: string;
  date: string;
  note: string;
  weight: number | null;
  medication: string;
  injectionDate?: string;
  doseMg?: number;
  discomfort?: string;
};

export type CoachResult = {
  mode: "demo" | "claude";
  summary: string;
  nextStep: string;
};

export interface CoachProvider {
  analyze(input: Pick<CheckIn, "weight" | "medication" | "note"> & { hasDiscomfort?: boolean }): Promise<CoachResult>;
}

export function localDateKey(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, "0")).join("-");
}

export function summarizeVisit(entries: CheckIn[]) {
  const recent = [...entries].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return {
    injections: recent.filter((entry) => entry.medication)
      .map((entry) => ({ ...entry, displayDate: entry.injectionDate || localDateKey(new Date(entry.date)) }))
      .sort((a, b) => b.displayDate.localeCompare(a.displayDate)),
    discomfort: recent.filter((entry) => entry.discomfort?.trim()),
    legacyNotes: recent.filter((entry) => entry.discomfort === undefined && entry.note.trim()),
  };
}

// Compare local calendar days, not elapsed hours, so DST doesn't shift the week.
const dayMs = 86_400_000;
function calendarDay(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / dayMs;
}

export function summarizeWeek(entries: CheckIn[], now = new Date()) {
  const today = calendarDay(now);
  const start = today - ((now.getDay() + 6) % 7);
  const weekly = entries.map((entry) => ({ entry, date: new Date(entry.date) }))
    .filter(({ date }) => calendarDay(date) >= start && calendarDay(date) <= today && date <= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const weights = weekly.flatMap(({ entry }) => entry.weight !== null && Number.isFinite(entry.weight) ? [entry.weight] : []);
  const weightChange = weights.length > 1 ? Number((weights[weights.length - 1] - weights[0]).toFixed(1)) : null;
  return {
    checkIns: weekly.length,
    days: new Set(weekly.map(({ date }) => calendarDay(date))).size,
    notes: weekly.filter(({ entry }) => entry.note.trim()).length,
    medicationLogs: weekly.filter(({ entry }) => entry.medication).length,
    weightChange,
  };
}

export const demoCoach: CoachProvider = {
  async analyze({ weight, medication, note, hasDiscomfort }) {
    const fields = [weight !== null && `체중 ${weight} kg`,
      medication && `투약 기록: ${medication}`, note && "생활·컨디션 메모",
      hasDiscomfort && "불편했던 점"].filter(Boolean);
    return {
      mode: "demo",
      summary: `이번 체크인에 ${fields.join(" · ")} 항목이 포함됐어요. 이 결과는 입력 항목을 정리한 예시예요.`,
      nextStep: medication
        ? "처방받은 일정이나 용량은 앱이 판단하지 않아요. 궁금한 점은 메모에 남겨 처방 의료진과 상의하세요."
        : "다음 체크인에서는 식사, 움직임, 컨디션 가운데 기억하고 싶은 것 한 가지만 적어보세요.",
    };
  },
};
