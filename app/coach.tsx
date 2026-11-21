"use client";

import { useEffect, useState, type FormEvent } from "react";
import { demoCoach, type CheckIn, type CoachResult } from "@/lib/coach";

const key = "onul-coach-checkins-v1";
const format = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" });

export default function Coach() {
  const [tab, setTab] = useState("coach");
  const [entries, setEntries] = useState<CheckIn[]>([]);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<CoachResult>();
  const [status, setStatus] = useState("");

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

  async function checkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const weight = String(fields.get("weight") ?? "");
    const input = { note: note.trim(), weight: weight ? Number(weight) : null,
      medication: String(fields.get("medication") ?? "") };
    if (!input.note && input.weight === null && !input.medication) {
      setStatus("메모, 체중, 투약 기록 중 하나를 입력해 주세요.");
      return;
    }
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (!persist([{ ...input, id, date: new Date().toISOString() }, ...entries],
      "이 기기에 체크인을 저장했어요.")) return;
    form.reset();
    setNote("");
    setResult(await demoCoach.analyze(input));
  }

  const weights = entries.filter((entry) => entry.weight !== null);
  return (
    <main className="coach-shell">
      <header className="coach-header">
        <div className="coach-brand"><span aria-hidden="true">✦</span> 오늘코치</div>
        <span className="coach-badge">체험 모드</span>
      </header>
      <nav className="coach-nav" aria-label="앱 메뉴">
        {[["coach", "오늘 코치"], ["history", "내 기록"], ["guide", "사용 안내"]].map(([id, label]) =>
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}
      </nav>
      {tab === "coach" && <>
        <section className="coach-hero">
          <span className="coach-eyebrow">MY DAILY CHECK-IN</span>
          <h1>오늘 몸은<br />어땠나요?</h1>
          <p>식사, 움직임, 컨디션을 짧게 남겨보세요. 위고비·마운자로를 사용 중이라면 투약 여부도 함께 기록할 수 있어요.</p>
          <span className="coach-spark" aria-hidden="true">✦</span>
        </section>
        <form className="coach-card coach-form" onSubmit={checkIn}>
          <h2>오늘의 체크인</h2>
          <label>식사 · 운동 · 컨디션 메모
            <textarea rows={3} maxLength={1200} placeholder="예: 점심에 김밥을 먹었고, 저녁에 20분 걸었어요." value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="coach-fields">
            <label>체중 (kg)<input name="weight" type="number" inputMode="decimal" min="1" max="700" step="0.1" placeholder="선택 입력" /></label>
            <label>오늘 투약 기록<select name="medication" defaultValue=""><option value="">선택 안 함</option><option>위고비</option><option>마운자로</option><option>기타 처방약</option></select></label>
          </div>
          <button className="coach-primary" type="submit">저장하고 체험 결과 보기</button>
          <small>기록은 이 브라우저에만 저장되고 외부로 전송되지 않아요.</small>
        </form>
        {result && <section className="coach-card coach-result" aria-live="polite">
          <span className="coach-badge">체험 결과 · 실제 AI 분석 아님</span>
          <h2>오늘의 코치 카드</h2>
          <p>{result.summary}</p><p>{result.nextStep}</p>
        </section>}
      </>}
      {tab === "history" && <section className="coach-card">
        <h1>내 기록</h1>
        {weights.length > 0 && <p>최근 기록 체중: <strong>{weights[0].weight} kg</strong></p>}
        {entries.length === 0 ? <p>아직 저장한 체크인이 없어요. 오늘 코치에서 첫 기록을 남겨보세요.</p> :
          <ul className="coach-list">{entries.map((entry) => <li key={entry.id}>
            <div className="coach-entry-head"><strong>{format.format(new Date(entry.date))}</strong>
              <button type="button" className="coach-delete" aria-label={`${format.format(new Date(entry.date))} 기록 삭제`}
                onClick={() => { if (window.confirm("이 기기에서 이 기록을 삭제할까요?") &&
                  persist(entries.filter((item) => item.id !== entry.id), "기록을 삭제했어요.")) setResult(undefined); }}>삭제</button></div>
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
