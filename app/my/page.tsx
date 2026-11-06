import type { Metadata } from "next";
import { MyContracts } from "@/components/MyContracts";

export const metadata: Metadata = {
  title: "내 계약서 | 페이체크",
  robots: { index: false }, // 사람마다 다른 개인 화면이라 검색에 노출하지 않는다
};

export default function MyPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <MyContracts />
    </main>
  );
}
