"use client";

import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

export function PrimaryButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-full rounded-2xl bg-blue-600 px-4 py-4 text-base font-semibold text-white shadow-sm shadow-blue-600/20 transition active:scale-[0.98] active:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none disabled:active:scale-100 ${className}`}
      {...props}
    />
  );
}

export function SecondaryButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-base font-medium text-zinc-800 transition active:scale-[0.98] active:bg-zinc-50 disabled:text-zinc-400 disabled:active:scale-100 ${className}`}
      {...props}
    />
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </p>
  );
}

// 사장님께 보낼 문장 + 복사 버튼 (F8, F10)
export function CopyMessage({ message, compact = false }: { message: string; compact?: boolean }) {
  const [copied, setCopied] = useState<boolean | null>(null);

  async function copy() {
    try {
      // https가 아니면 clipboard가 없다
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const Button = compact ? SecondaryButton : PrimaryButton;
  return (
    <div>
      <blockquote className={`rounded-xl bg-zinc-100 leading-relaxed ${compact ? "p-3 text-sm" : "p-4"}`}>
        {message}
      </blockquote>
      <Button onClick={copy} className={compact ? "mt-2 py-2 text-sm" : "mt-3"}>
        {copied ? "복사했어요" : "문장 복사하기"}
      </Button>
      {copied === false && (
        <p className="mt-2 text-center text-sm text-zinc-500">복사가 안 됐어요. 문장을 길게 눌러 복사해 주세요.</p>
      )}
    </div>
  );
}

// AI가 일하는 동안 보여주는 전체 화면. 경과 시간에 따라 문구가 넘어가고, 진행 막대는 90%까지 천천히 찬다.
// 실제 진행률이 아니라 기다림을 덜 지루하게 하는 장치라서 100%는 응답이 왔을 때만 된다(화면이 바뀜).
export function WorkingScreen({
  title,
  steps,
  expectedSeconds,
}: {
  title: string;
  steps: { at: number; text: string }[]; // at: 이 문구가 나오는 시각(초)
  expectedSeconds: number;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setElapsed((Date.now() - started) / 1000), 200);
    return () => clearInterval(timer);
  }, []);

  const current = [...steps].reverse().find((s) => elapsed >= s.at) ?? steps[0];
  const progress = 90 * (1 - Math.exp((-2.2 * elapsed) / expectedSeconds));

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex animate-screen-in flex-col items-center justify-center bg-white px-8"
    >
      <div className="relative animate-float">
        {/* eslint-disable-next-line @next/next/no-img-element -- 정적 아이콘 */}
        <img src="/icons/icon.svg" alt="" width={96} height={96} className="rounded-[22px] shadow-xl shadow-blue-600/25" />
        <div className="absolute inset-x-3 h-1 animate-scan rounded-full bg-white/80 shadow-[0_0_12px_4px_rgba(255,255,255,0.7)]" />
      </div>
      <p className="mt-10 text-xl font-bold text-zinc-900">{title}</p>
      <p key={current.text} className="mt-2 h-6 animate-screen-in text-zinc-500">
        {current.text}
      </p>
      <div className="mt-8 h-1.5 w-full max-w-60 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full rounded-full bg-blue-600 transition-[width] duration-200" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// F9: 모든 결과 화면 하단에 항상 노출
export function Disclaimer() {
  return (
    <p className="mt-8 border-t border-zinc-200 pt-4 text-xs leading-relaxed text-zinc-500">
      참고용 점검이며 법률 판단이 아니에요. 정확한 확인은 고용노동부 고객상담센터(국번 없이 1350)에
      문의해 주세요.{" "}
      <a href="/privacy" target="_blank" className="underline underline-offset-2">
        개인정보 처리 안내
      </a>
    </p>
  );
}

export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <header className="mb-6 flex items-center gap-2">
      {onBack && (
        <button onClick={onBack} aria-label="뒤로" className="-ml-2 px-2 py-1 text-xl text-zinc-600">
          ‹
        </button>
      )}
      <h1 className="text-xl font-bold">{title}</h1>
    </header>
  );
}
