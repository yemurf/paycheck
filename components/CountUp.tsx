"use client";

import { useEffect, useState } from "react";

// 숫자가 0부터 목표값까지 짧게 세어지며 나타난다 (결과 요약의 개수).
// 화면 읽기 프로그램에는 처음부터 최종값만 읽히게 하고, 움직이는 숫자는 숨긴다.
// 동작 줄이기를 켠 기기에서는 바로 최종값을 보여 준다.
export function CountUp({ value, duration = 600, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    let frame = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now() + (reduce ? 0 : delay);
    const total = reduce ? 0 : duration;
    const tick = (now: number) => {
      const t = total === 0 ? 1 : Math.min(1, Math.max(0, (now - start) / total));
      const eased = 1 - (1 - t) ** 3; // 처음엔 빠르게, 끝에서 천천히
      setShown(Math.round(eased * value));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, delay]);

  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden>{shown}</span>
    </>
  );
}
