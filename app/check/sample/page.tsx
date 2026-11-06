import type { Metadata } from "next";
import { App } from "@/components/App";

export const metadata: Metadata = {
  title: "샘플 계약서로 체험하기 | 페이체크",
};

// 랜딩의 "회원가입 없이 샘플로 체험하기". 처음부터 샘플을 준비하는 상태로 그려서 첫 화면이 스쳐 보이지 않는다.
export default function SampleCheckPage() {
  return <App startWithSample />;
}
