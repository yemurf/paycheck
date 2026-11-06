"use client";

import { useEffect } from "react";

// 버튼을 누르면 손가락이 닿은 자리에서 빛이 동그랗게 퍼졌다 사라진다 (모바일에서 hover 대신 쓰는 누름 효과).
// data-press가 붙은 요소에만 적용된다. 서버 컴포넌트의 링크에도 붙일 수 있게, 화면 전체에 이것 하나만 둔다(app/layout.tsx).
// 모양과 시간은 app/globals.css의 [data-press]. 동작 줄이기를 켠 기기에서는 globals.css가 움직임을 끈다.
export function PressGlow() {
  useEffect(() => {
    function onDown(e: PointerEvent) {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-press]");
      if (!el || el.matches(":disabled, [aria-disabled='true']")) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--press-x", `${e.clientX - r.left}px`);
      el.style.setProperty("--press-y", `${e.clientY - r.top}px`);
      // 연달아 눌러도 처음부터 다시 퍼지게 한 번 껐다 켠다
      el.removeAttribute("data-pressed");
      void el.offsetWidth;
      el.setAttribute("data-pressed", "");
    }
    function onEnd(e: AnimationEvent) {
      if (e.animationName === "press-glow") (e.target as HTMLElement).removeAttribute("data-pressed");
    }
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("animationend", onEnd);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("animationend", onEnd);
    };
  }, []);
  return null;
}
