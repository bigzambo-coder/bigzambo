"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { localDateKey, summarizePersonalRecords, summarizeWeek, type CheckIn } from "@/lib/coach";

const key = "onul-coach-checkins-v1";
const format = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" });
const fullDate = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" });
const injectionDateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeZone: "UTC" });

export default function Coach() {
  const [tab, setTab] = useState("coach");
  const [entries, setEntries] = useState<CheckIn[]>([]);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [medication, setMedication] = useState("");
  const exampleHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (showExample && tab === "coach") exampleHeading.current?.focus();
  }, [showExample, tab]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "[]");
      if (Array.isArray(saved)) setEntries(saved);
    } catch {
      setStatus("이 브라우저에서 기존 기록을 불러오지 못했어요.");
    }
  }, []);

  function persist(next: CheckIn[], message: string) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setEntries(next);
      setStatus(message);
      return true;
    } catch {
      setStatus("브라우저에 저장하지 못했어요. 저장소 설정을 확인해 주세요.");
      return false;
    }
  }

  function checkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const weight = String(fields.get("weight") ?? "");
    const discomfort = String(fields.get("discomfort") ?? "").trim();
    const dose = String(fields.get("doseMg") ?? "");
    const doseMg = dose ? Number(dose) : undefined;
    const injectionDate = String(fields.get("injectionDate") ?? "");
    const now = new Date();
    const input = { note: note.trim(), weight: weight ? Number(weight) : null,
      medication };
    if (!input.note && input.weight === null && !input.medication && !discomfort) {
      setStatus("메모, 체중, 주사 기록, 불편했던 점 중 하나를 입력해 주세요.");
      return;
    }
    if (medication && (!injectionDate || injectionDate > localDateKey(now) ||
      (doseMg !== undefined && (!Number.isFinite(doseMg) || doseMg <= 0)))) {
      setStatus("주사 맞은 날짜를 입력해 주세요. 맞은 양을 적을 때는 0보다 큰 숫자로 써주세요.");
      return;
    }
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const injection = medication ? { injectionDate, doseMg } : {};
    if (!persist([{ ...input, ...injection, discomfort, id, date: now.toISOString() }, ...entries],
      "저장했어요. ‘내 기록’에서 다시 볼 수 있어요.")) return;
    form.reset();
    setNote("");
    setMedication("");
  }

  const weights = entries.filter((entry) => entry.weight !== null);
  const week = tab === "history" ? summarizeWeek(entries) : null;
  const personal = tab === "history" ? summarizePersonalRecords(entries) : null;
  return (
    <main className="coach-shell">
      <header className="coach-header">
        <div className="coach-brand"><span aria-hidden="true">✦</span> 오늘코치</div>
        <span className="coach-badge">나만의 기록</span>
      </header>
      <nav className="coach-nav" aria-label="앱 메뉴">
        {[["coach", "오늘 기록"], ["history", "내 기록"], ["guide", "사용 안내"]].map(([id, label]) =>
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}
      </nav>
      {tab === "coach" && <>
        <section className="coach-hero">
          <span className="coach-eyebrow">MY DAILY CHECK-IN</span>
          <h1>오늘 몸은<br />어땠나요?</h1>
          <p>먹은 것, 움직인 것, 몸 상태를 짧게 남겨보세요. 위고비·마운자로를 맞았다면 날짜와 맞은 양도 적을 수 있어요.</p>
          <button className="coach-example-button" type="button" aria-expanded={showExample}
            aria-controls="coach-example" onClick={() => setShowExample((visible) => !visible)}>
            {showExample ? "예시 닫기" : "예시로 체험하기"}
          </button>
          <span className="coach-spark" aria-hidden="true">✦</span>
        </section>
        <section id="coach-example" className="coach-card coach-example" hidden={!showExample}
          aria-labelledby="coach-example-heading">
          <span className="coach-badge">가상 데이터 · 실제 AI 분석 아님</span>
          <h2 id="coach-example-heading" ref={exampleHeading} tabIndex={-1}>예시 체크인</h2>
          <p>“점심에 김밥을 먹고 저녁에 20분 걸었어요. 월요일에 위고비를 투약했고, 화요일 아침에 속이 메스꺼웠어요.”</p>
          <div className="coach-example-panel">
            <h3>오늘의 코치 카드</h3>
            <p>식사·걷기·투약·컨디션을 남겼어요.</p>
            <p><strong>다음 체크인:</strong> 불편함이 있었던 시간과 얼마나 지속됐는지 메모해 보세요.</p>
          </div>
          <div className="coach-example-panel">
            <h3>내 기록 화면 예시</h3>
            <dl>
              <dt>주사 맞은 날</dt><dd>월요일 · 위고비 · 맞은 양을 적지 않았어요</dd>
              <dt>불편했던 점</dt><dd>화요일 아침에 메스꺼움</dd>
            </dl>
          </div>
          <small>예시는 내 기록에 저장되지 않아요. 진단이나 투약 지시를 제공하지 않아요.</small>
        </section>
        <form className="coach-card coach-form" onSubmit={checkIn}>
          <h2>오늘 기록 남기기</h2>
          <label>식사 · 운동 · 컨디션 메모
            <textarea rows={3} maxLength={1200} placeholder="예: 점심에 김밥을 먹었고, 저녁에 20분 걸었어요." value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="coach-fields">
            <label>체중 (kg)<input name="weight" type="number" inputMode="decimal" min="1" max="700" step="0.1" placeholder="선택 입력" /></label>
            <label>주사 기록<select name="medication" value={medication} onChange={(event) => setMedication(event.target.value)}><option value="">선택 안 함</option><option>위고비</option><option>마운자로</option><option>기타 처방약</option></select></label>
          </div>
          {medication && <div className="coach-fields">
            <label>주사 맞은 날짜<input name="injectionDate" type="date" required defaultValue={localDateKey(new Date())} max={localDateKey(new Date())} /></label>
            <label>맞은 양 (mg)<input name="doseMg" type="number" inputMode="decimal" min="0" step="any" placeholder="선택 입력" /></label>
          </div>}
          <label>불편했던 점 (선택)
            <textarea name="discomfort" rows={2} maxLength={1200} placeholder="불편했던 점과 언제 있었는지 적어주세요." />
          </label>
          <button className="coach-primary" type="submit">내 기록에 저장</button>
          <small>모든 칸을 채울 필요는 없어요. 기록은 이 브라우저에만 저장돼요.</small>
        </form>
      </>}
      {tab === "history" && <section className="coach-card">
        <h1>내 기록</h1>
        {personal && <section className="coach-week coach-personal" aria-labelledby="coach-personal-heading">
          <h2 id="coach-personal-heading">주사와 몸 상태</h2>
          <p>내가 직접 적은 내용만 모았어요. AI가 해석하거나 판단하지 않아요.</p>
          <h3>언제, 어떤 주사를 맞았나요?</h3>
          {personal.injections.length ? <ul>{personal.injections.map((entry) => <li key={entry.id}>
            <strong>{injectionDateFormat.format(new Date(`${entry.displayDate}T00:00:00Z`))}</strong>
            {!entry.injectionDate && <small>맞은 날짜를 따로 적지 않아 저장한 날짜를 표시해요.</small>}
            <span>{entry.medication} · {entry.doseMg !== undefined ? `${entry.doseMg} mg` : "맞은 양을 적지 않았어요"}</span>
          </li>)}</ul> : <p>저장한 주사 기록이 없어요.</p>}
          <h3>불편했던 점</h3>
          {personal.discomfort.length ? <ul>{personal.discomfort.map((entry) => <li key={entry.id}>
            <strong>{fullDate.format(new Date(entry.date))}에 적은 메모</strong>
            <span className="coach-note">{entry.discomfort}</span>
          </li>)}</ul> : <p>‘불편했던 점’에 적은 메모가 아직 없어요.</p>}
          {personal.legacyNotes.length > 0 && <details>
            <summary>예전에 적은 메모 보기 ({personal.legacyNotes.length}건)</summary>
            <ul>{personal.legacyNotes.map((entry) => <li key={entry.id}>
              <strong>{fullDate.format(new Date(entry.date))}</strong>
              <span className="coach-note">{entry.note}</span>
            </li>)}</ul>
          </details>}
        </section>}
        {week && <section className="coach-week" aria-labelledby="coach-week-heading">
          <h2 id="coach-week-heading">이번 주 요약</h2>
          <p>이 기기에 저장된 월요일부터 오늘까지의 기록이에요.</p>
          {week.checkIns === 0 ? <p><strong>이번 주에 저장한 기록이 아직 없어요.</strong></p> :
            <dl className="coach-week-grid">
              <div><dt>기록한 날</dt><dd>{week.days}일</dd></div>
              <div><dt>남긴 기록</dt><dd>{week.checkIns}건</dd></div>
              <div><dt>생활 메모</dt><dd>{week.notes}건</dd></div>
              <div><dt>주사 기록</dt><dd>{week.medicationLogs}건</dd></div>
              <div className="coach-week-weight"><dt>체중 변화 (첫 기록 → 최근 기록)</dt>
                <dd>{week.weightChange === null ? "체중 기록 2건부터 표시" :
                  `${week.weightChange > 0 ? "+" : ""}${week.weightChange.toFixed(1)} kg`}</dd></div>
            </dl>}
        </section>}
        {weights.length > 0 && <p>최근 기록 체중: <strong>{weights[0].weight} kg</strong></p>}
        {entries.length === 0 ? <p>아직 저장한 내용이 없어요. ‘오늘 기록’에서 첫 기록을 남겨보세요.</p> :
          <ul className="coach-list">{entries.map((entry) => <li key={entry.id}>
            <div className="coach-entry-head"><strong>{format.format(new Date(entry.date))}</strong>
              <button type="button" className="coach-delete" aria-label={`${format.format(new Date(entry.date))} 기록 삭제`}
                onClick={() => { if (window.confirm("이 기기에서 이 기록을 삭제할까요?"))
                  persist(entries.filter((item) => item.id !== entry.id), "기록을 삭제했어요."); }}>삭제</button></div>
            {(entry.weight !== null || entry.medication) && <p>{[entry.weight !== null && `${entry.weight} kg`, entry.medication].filter(Boolean).join(" · ")}</p>}
            {entry.note && <p className="coach-note">{entry.note}</p>}
          </li>)}</ul>}
      </section>}
      {tab === "guide" && <section className="coach-card coach-guide">
        <h1>사용 안내</h1>
        <h2>홈 화면에 추가</h2>
        <p>iPhone은 Safari에서 공유 버튼을 눌러 ‘홈 화면에 추가’를 선택하세요. Android는 Chrome 메뉴에서 ‘홈 화면에 추가’ 또는 ‘앱 설치’를 선택하세요.</p>
        <h2>기록과 개인정보</h2>
        <p>회원가입이 필요 없고, 기록은 다른 기기와 동기화되지 않아요. 브라우저 데이터를 지우면 기록도 사라져요. 공용 기기에는 민감한 내용을 기록하지 마세요.</p>
        <h2>체험 결과</h2>
        <p>현재 Claude에 연결되어 있지 않아요. 코치 카드는 진단, 처방, 투약 일정이나 용량 조정을 제공하지 않아요.</p>
      </section>}
      <p className="coach-status" role="status">{status}</p>
      <footer>오늘코치 <span>·</span> 건강 기록 보조 도구</footer>
    </main>
  );
}
