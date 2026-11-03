"use client";

import { useEffect, useRef, useState } from "react";
import type { ContractExtraction } from "@/lib/contract-schema";
import { loadSamplePhoto, type Photo } from "@/lib/image";
import type { CheckResult } from "@/rules";
import { ConfirmScreen, type ConfirmState } from "./ConfirmScreen";
import { NoContractScreen } from "./NoContractScreen";
import { ResultScreen } from "./ResultScreen";
import { StartScreen } from "./StartScreen";
import { UploadScreen } from "./UploadScreen";

type Step = "start" | "no-contract" | "upload" | "confirm" | "result";

// 모든 상태는 이 컴포넌트 메모리에만 둔다. 저장하지 않고, 에러가 나도 입력값과 사진은 남는다 (PRD 7장).
export function App() {
  const [step, setStep] = useState<Step>("start");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);

  function go(next: Step) {
    setStep(next);
    window.scrollTo(0, 0);
  }

  // 각 화면의 ‹ 버튼이 가는 곳. 폰의 뒤로가기도 똑같이 움직인다. null이면 앱을 떠난다.
  const backTarget: Record<Step, Step | null> = {
    start: null,
    "no-contract": "start",
    upload: result ? "result" : "start",
    confirm: "upload",
    result: "confirm",
  };

  // 화면 전환은 주소를 바꾸지 않으므로, 폰 뒤로가기를 누르면 앱이 통째로 닫혀 입력이 사라진다.
  // 기록을 하나 끼워 두고, 뒤로가기가 그 기록을 지우면 ‹ 버튼처럼 이전 화면으로 보낸 뒤 다시 끼운다.
  const stepRef = useRef(step);
  const backRef = useRef(backTarget[step]);
  useEffect(() => {
    stepRef.current = step;
    backRef.current = backTarget[step];
  });
  useEffect(() => {
    history.pushState({ paycheck: true }, "");
    function onPopState() {
      const target = backRef.current;
      if (target == null) {
        history.back(); // 시작 화면에서는 그대로 나간다
        return;
      }
      go(target);
      history.pushState({ paycheck: true }, "");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function onExtracted(contract: ContractExtraction) {
    // 분석 중에 뒤로가기로 업로드 화면을 떠났으면 결과로 끌고 가지 않는다
    if (stepRef.current !== "upload") return;
    setConfirm({ contract, weeklyHours: "", wageConfirmed: false });
    go("confirm");
  }

  function reset(nextPhotos: Photo[], sample: boolean) {
    photos.forEach((p) => URL.revokeObjectURL(p.src));
    setPhotos(nextPhotos);
    setIsSample(sample);
    setConfirm(null);
    setResult(null);
  }

  function restart() {
    reset([], false);
    go("upload");
  }

  function startOwn() {
    if (isSample) reset([], false); // 샘플 체험 뒤에 내 계약서로 시작하면 샘플을 비운다
    go("upload");
  }

  // 심사위원처럼 계약서가 없는 사람도 끝까지 써볼 수 있게, 가상의 계약서를 올린 상태로 시작한다
  async function startSample() {
    setSampleLoading(true);
    try {
      reset([await loadSamplePhoto()], true);
      go("upload");
    } catch (e) {
      console.error("sample load failed", e);
    } finally {
      setSampleLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* key가 바뀌면 화면이 새로 그려지면서 들어오는 애니메이션이 한 번 돈다 */}
      <div key={step} className="flex flex-1 animate-screen-in flex-col">
        {step === "start" && (
          <StartScreen
            onStart={startOwn}
            onSample={startSample}
            onNoContract={() => go("no-contract")}
            sampleLoading={sampleLoading}
          />
        )}
        {step === "no-contract" && <NoContractScreen onBack={() => go("start")} />}
        {step === "upload" && (
          <UploadScreen
            photos={photos}
            isSample={isSample}
            onPhotosChange={setPhotos}
            onExtracted={onExtracted}
            onBack={() => go(result ? "result" : "start")}
          />
        )}
        {step === "confirm" && confirm && (
          <ConfirmScreen
            state={confirm}
            onChange={setConfirm}
            onChecked={(r) => {
              setResult(r);
              go("result");
            }}
            onBack={() => go("upload")}
          />
        )}
        {step === "result" && result && (
          <ResultScreen
            result={result}
            canAddPhoto={!isSample && photos.length < 2}
            onAddPhoto={() => go("upload")}
            onEdit={() => go("confirm")}
            onRestart={restart}
          />
        )}
      </div>
    </main>
  );
}
