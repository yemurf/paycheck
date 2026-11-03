import type { MetadataRoute } from "next";

// 홈 화면에 추가했을 때 주소창 없이 앱처럼 열린다 (PWA 기본 설정).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "페이체크 - 알바 근로계약서 점검",
    short_name: "페이체크",
    description: "알바 근로계약서를 사진으로 올리면 확인이 필요한 조항을 알려드려요.",
    lang: "ko",
    start_url: "/check", // 홈 화면 아이콘은 랜딩을 건너뛰고 바로 앱으로
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
