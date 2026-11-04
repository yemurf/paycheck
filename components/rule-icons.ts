import { Backpack, CalendarCheck, Coffee, Coins, FileText, Sprout, type LucideIcon } from "lucide-react";
import type { RuleId } from "@/rules";

// 점검 항목별 아이콘. 랜딩 페이지와 결과 화면이 같이 쓴다.
export const RULE_ICON: Record<RuleId, LucideIcon> = {
  R1: Coins,
  R2: Sprout,
  R3: CalendarCheck,
  R4: Coffee,
  R5: FileText,
  R7: Backpack,
};
