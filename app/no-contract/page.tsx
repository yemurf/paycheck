"use client";

import { useRouter } from "next/navigation";
import { NoContractScreen } from "@/components/NoContractScreen";

// 랜딩 페이지에서 바로 여는 "계약서를 못 받았어요" 안내 (앱 안의 같은 화면을 그대로 쓴다)
export default function NoContractPage() {
  const router = useRouter();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <NoContractScreen onBack={() => router.push("/")} />
    </main>
  );
}
