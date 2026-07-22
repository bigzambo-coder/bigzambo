export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Diet Tracker — Phase 0 OK
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          체중 · 투약 · 식단 · 운동 기록 앱을 여기서부터 만들어 갑니다.
        </p>
      </main>
    </div>
  );
}
