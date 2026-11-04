"use client";

import Link from "next/link";
import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "./ui";

const STEPS = [
  { title: "가린 사진 올리기", body: "주민등록번호·계좌번호를 가린 계약서 사진을 골라요" },
  { title: "읽은 내용 확인", body: "AI가 읽은 시급과 근무시간을 확인하고 고쳐요" },
  { title: "점검 결과 보기", body: "확인이 필요한 조항과 사장님께 보낼 문장까지 알려드려요" },
];

const BADGES = ["회원가입 없음", "사진 저장 안 함", "30초 안에 결과"];

type Props = {
  onStart: () => void;
  onSample: () => void;
  onNoContract: () => void;
  sampleLoading: boolean;
};

export function StartScreen({ onStart, onSample, onNoContract, sampleLoading }: Props) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 pt-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- 정적 아이콘 */}
          <img src="/icons/icon.svg" alt="" width={32} height={32} className="squircle-mask" />
          <span className="font-bold text-blue-600">페이체크</span>
        </div>

        <h1 className="mt-6 text-[28px] font-bold leading-[1.3] tracking-tight">
          알바 근로계약서,
          <br />
          사인하기 전에 확인해 보세요
        </h1>
        <p className="mt-3 leading-relaxed text-zinc-600">
          최저임금, 수습 감액, 주휴수당, 휴게시간, 필수 항목이 근로기준법·최저임금법에 맞는지 확인해 드려요.
        </p>

        <p className="mt-4 text-sm text-zinc-500">{BADGES.join(" · ")}</p>

        <ol className="mt-8 space-y-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="w-4 shrink-0 font-bold text-blue-600">{i + 1}</span>
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-zinc-500">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <label className="mt-8 flex gap-3 squircle-2xl bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-600 ring-1 ring-zinc-200">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-blue-600"
          />
          <span>
            사진은 분석을 위해 해외 AI 서비스(OpenRouter를 거쳐 Claude AI)로 전송돼요. 페이체크는 사진과 결과를
            저장하지 않아요. 주민등록번호와 계좌번호는 <strong className="rounded bg-red-200 box-decoration-clone px-1 text-zinc-900">올리기 전에 직접 가려</strong>{" "}
            주세요.{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              자세히 보기
            </Link>
          </span>
        </label>
      </div>

      <div className="space-y-3 pt-6 pb-4">
        <PrimaryButton disabled={!agreed} onClick={onStart}>
          내 계약서 확인하기
        </PrimaryButton>
        <SecondaryButton disabled={sampleLoading} onClick={onSample}>
          {sampleLoading ? "샘플을 불러오고 있어요…" : "샘플 계약서로 체험해 보기"}
        </SecondaryButton>
        <button onClick={onNoContract} className="w-full py-2 text-sm text-zinc-500 underline underline-offset-2">
          계약서를 아직 못 받았어요
        </button>
      </div>
    </div>
  );
}
