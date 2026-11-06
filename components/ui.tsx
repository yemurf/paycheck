"use client";

import { ArrowRight, Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "md" | "sm"; // md: 화면 하단 큰 버튼(56px), sm: 카드 안 버튼(44px)
};

const BUTTON_SIZE = {
  md: "min-h-14 squircle-2xl px-4 py-3 text-headline",
  sm: "min-h-11 squircle-xl px-4 py-2 text-body-sm font-semibold",
};

// arrow: 다음 단계로 넘어가는 버튼. 마우스를 올리면 살짝 떠오르고 화살표가 앞으로 나간다(터치 기기에서는 hover가 없다)
export function PrimaryButton({
  className = "",
  size = "md",
  arrow = false,
  children,
  ...props
}: ButtonProps & { arrow?: boolean }) {
  return (
    <button
      data-press
      className={`group flex w-full items-center justify-center gap-1 bg-blue-600 text-center text-white shadow-sm shadow-blue-600/20 transition duration-200 ease-out active:scale-[0.98] active:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none disabled:active:scale-100 ${BUTTON_SIZE[size]} ${
        arrow ? "enabled:hover:-translate-y-0.5 enabled:hover:bg-blue-700 enabled:hover:shadow-lg enabled:hover:shadow-blue-600/30" : ""
      } ${className}`}
      {...props}
    >
      {children}
      {arrow && (
        <ArrowRight
          aria-hidden
          className="size-5 shrink-0 transition-transform duration-200 ease-out group-enabled:group-hover:translate-x-1"
        />
      )}
    </button>
  );
}

export function SecondaryButton({ className = "", size = "md", ...props }: ButtonProps) {
  return (
    <button
      data-press
      className={`flex w-full items-center justify-center border border-zinc-200 bg-white [--press-color:rgb(36_87_197/0.16)] text-center text-zinc-800 transition active:scale-[0.98] active:bg-zinc-50 disabled:text-zinc-400 disabled:active:scale-100 ${BUTTON_SIZE[size]} ${className}`}
      {...props}
    />
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="squircle-xl bg-red-50 px-4 py-3 text-body-sm text-red-700">
      {children}
    </p>
  );
}

// 사장님께 보낼 문장 + 복사 버튼 (F8, F10)
// compact: 결과 카드 안. 카드마다 파란 큰 버튼이 생기면 서로 경쟁해서, 연한 파란색 버튼으로 쓴다.
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

  // 복사하면 체크 표시가 톡 튀어나온다
  const label = copied ? (
    <>
      <Check aria-hidden className="size-4 animate-pop" strokeWidth={2.5} />
      복사했어요
    </>
  ) : (
    "문장 복사하기"
  );
  return (
    <div>
      <blockquote className={`squircle-xl bg-zinc-100 text-body text-zinc-800 ${compact ? "p-3" : "p-4"}`}>
        {message}
      </blockquote>
      {compact ? (
        <button
          data-press
          onClick={copy}
          className="mt-2 flex min-h-11 w-full items-center justify-center gap-1 squircle-xl bg-blue-50 [--press-color:rgb(36_87_197/0.16)] px-4 py-2 text-body-sm font-semibold text-blue-700 transition active:scale-[0.98] active:bg-blue-100"
        >
          {label}
        </button>
      ) : (
        <PrimaryButton onClick={copy} className="mt-3">
          {label}
        </PrimaryButton>
      )}
      {copied === false && (
        <p className="mt-2 text-center text-body-sm text-zinc-500">복사가 안 됐어요. 문장을 길게 눌러 복사해 주세요.</p>
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
      <div className="relative animate-float drop-shadow-[0_12px_20px_rgba(36,87,197,0.25)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- 정적 아이콘 */}
        <img src="/icons/icon.svg" alt="" width={96} height={96} className="squircle-mask" />
        <div className="absolute inset-x-3 h-1 animate-scan rounded-full bg-white/80 shadow-[0_0_12px_4px_rgba(255,255,255,0.7)]" />
      </div>
      <p className="mt-12 text-title2 text-zinc-900">{title}</p>
      {/* 문구가 바뀌어도 높이가 흔들리지 않게 한 줄 높이를 잡아 둔다. 고정 높이가 아니라 행간을 늘리면 같이 커진다 */}
      <p key={current.text} className="mt-2 min-h-[1lh] animate-screen-in text-center text-body text-zinc-500">
        {current.text}
      </p>
      <div className="mt-8 h-1.5 w-full max-w-60 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full rounded-full bg-blue-600 transition-[width] duration-200" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// F9: 모든 결과 화면 하단에 항상 노출. note: 점검 기준이 언제 것인지 같은 한 줄 (결과 화면만)
export function Disclaimer({ note }: { note?: ReactNode }) {
  return (
    <div className="mt-8 border-t border-zinc-200 pt-4 text-caption text-zinc-500">
      {note && <p className="mb-1">{note}</p>}
      <p>
        참고용 점검이며 법률 판단이 아니에요. 정확한 확인은 고용노동부 고객상담센터(국번 없이 1350)에
        문의해 주세요.{" "}
        <a href="/privacy" target="_blank" className="underline underline-offset-2">
          개인정보 처리 안내
        </a>
      </p>
    </div>
  );
}

// 뒤로 버튼은 아이콘(24px)은 그대로 두고 누르는 영역만 44px. 음수 여백으로 제목 줄 높이(28px)를 넘지 않게 한다.
// backHref: 앱 밖 페이지(/my 등)에서 버튼 대신 링크로 돌아갈 곳
export function ScreenHeader({ title, onBack, backHref }: { title: string; onBack?: () => void; backHref?: string }) {
  const backClass =
    "-my-2 -ml-3 flex size-11 shrink-0 items-center justify-center rounded-xl text-zinc-600 active:bg-zinc-100";
  return (
    <header className="mb-6 flex items-center gap-1">
      {onBack && (
        <button onClick={onBack} aria-label="뒤로" className={backClass}>
          <ChevronLeft aria-hidden className="size-6" />
        </button>
      )}
      {!onBack && backHref && (
        <Link href={backHref} aria-label="뒤로" className={backClass}>
          <ChevronLeft aria-hidden className="size-6" />
        </Link>
      )}
      <h1 className="text-title2">{title}</h1>
    </header>
  );
}
