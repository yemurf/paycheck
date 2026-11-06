import type { Metadata, Viewport } from "next";
// Pretendard: 글자가 쓰인 만큼만 내려받는 분할 버전 (모바일에서 2MB 통파일 대신)
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { PressGlow } from "@/components/PressGlow";

const description = "알바 근로계약서를 사진으로 올리면 확인이 필요한 조항을 알려드려요.";

export const metadata: Metadata = {
  // 링크 미리보기(카톡 등)의 이미지 주소를 절대 경로로 만들 때 쓴다
  metadataBase: new URL("https://paycheck-pi.vercel.app"),
  title: "페이체크",
  description,
  appleWebApp: { title: "페이체크", statusBarStyle: "default" },
  openGraph: {
    title: "페이체크 - 알바 근로계약서, 사인하기 전에 확인해 보세요",
    description,
    siteName: "페이체크",
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-white text-zinc-900">
        {children}
        <PressGlow />
      </body>
    </html>
  );
}
