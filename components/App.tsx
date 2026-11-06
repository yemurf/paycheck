"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ContractExtraction } from "@/lib/contract-schema";
import { loadSamplePhotos, type Photo } from "@/lib/image";
import type { SampleId } from "@/lib/samples";
import type { CheckResult } from "@/rules";
import { ConfirmScreen, type ConfirmState } from "./ConfirmScreen";
import { NoContractScreen } from "./NoContractScreen";
import { ResultScreen } from "./ResultScreen";
import type { SaveInput } from "./saved-results-api";
import { StartScreen } from "./StartScreen";
import { UploadScreen } from "./UploadScreen";

type Step = "start" | "no-contract" | "upload" | "confirm" | "result";

// 모든 상태는 이 컴포넌트 메모리에만 둔다. 저장하지 않고, 에러가 나도 입력값과 사진은 남는다 (PRD 7장).
export function App({ startWithSample = false }: { startWithSample?: boolean }) {
  // 샘플 체험 주소(/check/sample)로 들어오면 바로 샘플 고르기(업로드 화면)부터. 아무것도 고르지 않은 채로 시작한다
  const [step, setStep] = useState<Step>(startWithSample ? "upload" : "start");
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [checkedInput, setCheckedInput] = useState<SaveInput | null>(null); // 이 결과를 낸 입력값 (저장용)
  const [isSample, setIsSample] = useState(startWithSample);
  const [sampleId, setSampleId] = useState<SampleId | null>(null); // 샘플 체험 중에 고른 샘플. 아직 안 골랐으면 null

  function go(next: Step) {
    setStep(next);
    window.scrollTo(0, 0);
  }

  // 각 화면의 ‹ 버튼이 가는 곳. 폰의 뒤로가기도 똑같이 움직인다. null이면 앱을 떠난다.
  const backTarget: Record<Step, Step | null> = {
    start: null,
    "no-contract": "start",
    // 랜딩의 샘플 체험(/check/sample)으로 들어와 아직 결과를 안 봤으면 첫 화면(동의·로그인)을 거치지 않고 앱을 떠난다
    upload: result ? "result" : startWithSample && isSample ? null : "start",
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
    // 샘플 계약서의 근로자는 사용자 본인이 아니니 나이는 18세 이상으로 미리 골라 둔다 (바꿔 볼 수는 있다)
    setConfirm({ contract, weeklyHours: "", wageConfirmed: false, minor: isSample ? false : null });
    go("confirm");
  }

  function reset(nextPhotos: Photo[], sample: boolean) {
    photos.forEach((p) => URL.revokeObjectURL(p.src));
    setPhotos(nextPhotos);
    setIsSample(sample);
    setConfirm(null);
    setResult(null);
    setCheckedInput(null);
  }

  // 다른 계약서 확인하기. 샘플 체험 뒤라면 내 계약서는 해외 전송 동의부터 받아야 하니 첫 화면으로 보낸다
  function restart() {
    if (isSample) {
      // 샘플 체험 주소에서 왔으면 /check로 옮겨 간다 (새로고침해도 샘플이 다시 뜨지 않게)
      if (startWithSample) {
        router.push("/check");
        return;
      }
      reset([], false);
      go("start");
      return;
    }
    reset([], false);
    go("upload");
  }

  function startOwn() {
    if (isSample) reset([], false); // 샘플 체험 뒤에 내 계약서로 시작하면 샘플을 비운다
    go("upload");
  }

  // 샘플 고르기. 고르면 그 샘플 사진을 올리고, 고른 것을 다시 누르면(null) 비운다
  async function pickSample(id: SampleId | null) {
    if (id == null) {
      reset([], true);
      setSampleId(null);
      return;
    }
    setSampleId(id);
    try {
      reset(await loadSamplePhotos(id), true);
    } catch (e) {
      console.error("sample load failed", e);
      setSampleId(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* key가 바뀌면 화면이 새로 그려지면서 들어오는 애니메이션이 한 번 돈다 */}
      <div key={step} className="flex flex-1 animate-screen-in flex-col">
        {step === "start" && (
          <StartScreen onStart={startOwn} onNoContract={() => go("no-contract")} />
        )}
        {step === "no-contract" && <NoContractScreen onBack={() => go("start")} />}
        {step === "upload" && (
          <UploadScreen
            photos={photos}
            isSample={isSample}
            sampleId={sampleId}
            onPickSample={pickSample}
            onPhotosChange={setPhotos}
            onExtracted={onExtracted}
            onBack={() => {
              const target = backTarget.upload;
              if (target) go(target);
              else router.push("/");
            }}
          />
        )}
        {step === "confirm" && confirm && (
          <ConfirmScreen
            state={confirm}
            onChange={setConfirm}
            onChecked={(r, input) => {
              setResult(r);
              setCheckedInput(input);
              go("result");
            }}
            onBack={() => go("upload")}
          />
        )}
        {step === "result" && result && (
          <ResultScreen
            result={result}
            saveInput={isSample ? null : checkedInput /* 샘플 계약서는 저장할 이유가 없으니 저장 카드(카카오 로그인 안내)를 띄우지 않는다 */}
            canAddPhoto={!isSample && photos.length < 2}
            onAddPhoto={() => go("upload")}
            onEdit={() => go("confirm")}
            onRestart={restart}
            restartLabel={isSample ? "내 계약서로 확인하기" : "다른 계약서 확인하기"}
            // 샘플은 내 계약서가 아니라 고칠 이유가 없으니, 그 자리에서 다른 샘플을 고르게 한다
            firstAction={isSample ? { label: "다른 샘플 보기", onClick: () => go("upload") } : undefined}
          />
        )}
      </div>
    </main>
  );
}
