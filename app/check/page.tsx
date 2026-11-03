import type { Metadata } from "next";
import { App } from "@/components/App";

export const metadata: Metadata = {
  title: "계약서 확인하기 | 페이체크",
};

export default function CheckPage() {
  return <App />;
}
