"use client";

import { CopyMessage, Disclaimer, ScreenHeader } from "./ui";

// F10: AI 없이 고정 문구
const REQUEST_MESSAGE =
  "사장님, 근로계약서를 한 부 받아볼 수 있을까요? 근로계약서는 서면으로 받아야 한다고 들어서요. 감사합니다!";

export function NoContractScreen({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <ScreenHeader title="계약서를 못 받았어요" onBack={onBack} />
      <p className="text-body text-zinc-700">
        근로계약서는 <strong>서면으로 받아야 해요.</strong> 알바도 마찬가지예요. 임금, 근로시간, 휴일,
        휴가 같은 조건을 적은 계약서를 일하는 사람에게 줘야 해요.
      </p>

      <h2 className="mt-8 mb-2 text-body-sm font-semibold text-zinc-700">이렇게 요청해 보세요</h2>
      <CopyMessage message={REQUEST_MESSAGE} />

      <p className="mt-6 text-caption text-zinc-500">
        근거: 근로기준법 제17조(근로조건의 명시), 기간제법 제17조(근로조건의 서면명시)
      </p>
      <Disclaimer />
    </div>
  );
}
