import type { ContractExtraction } from "../lib/contract-schema";
import { formatDuration, netWorkMinutes, parseTime, spanMinutes } from "./helpers";
import {
  BASIS,
  MINOR_DAILY_EXTENSION_MINUTES,
  MINOR_DAILY_MINUTES,
  MINOR_WEEKLY_EXTENSION_MINUTES,
  MINOR_WEEKLY_MINUTES,
  NIGHT_END_MINUTES,
  NIGHT_START_MINUTES,
} from "./standards";
import type { RuleResult, Status } from "./types";

type ScheduleEntry = ContractExtraction["schedule"][number];

const base = { id: "R7", title: "18세 미만 근로", basis: BASIS.R7 } as const;

// 사진으로는 알 수 없어서 18세 미만이면 항상 안내한다
const PAPERS =
  "18세 미만이면 사업장에 가족관계증명서와 친권자(또는 후견인) 동의서를 갖춰 둬야 해요. 사장님이 달라고 하지 않았다면 먼저 챙겨 가세요.";
const UNDER_15 = "만 15세 미만이거나 중학생이면 고용노동부에서 받은 취직인허증도 있어야 일할 수 있어요.";
const HELP = "궁금한 점은 청소년근로권익센터(국번 없이 1388, 카카오톡 #1388)에 물어볼 수 있어요.";

const DAILY_LIMIT = MINOR_DAILY_MINUTES + MINOR_DAILY_EXTENSION_MINUTES;
const WEEKLY_LIMIT = MINOR_WEEKLY_MINUTES + MINOR_WEEKLY_EXTENSION_MINUTES;

// 근무가 오후 10시~오전 6시와 겹치는지. 자정을 넘기는 근무는 다음 날 새벽까지 본다.
export function worksAtNight(entry: ScheduleEntry): boolean {
  const start = parseTime(entry.start);
  const span = spanMinutes(entry);
  if (start == null || span == null) return false;
  const end = start + span;
  const nights = [
    [0, NIGHT_END_MINUTES],
    [NIGHT_START_MINUTES, 24 * 60 + NIGHT_END_MINUTES],
    [24 * 60 + NIGHT_START_MINUTES, 48 * 60],
  ];
  return nights.some(([from, to]) => start < to && end > from);
}

// weeklyMinutes: 요일별 근무시간 합계, 스케줄 근무면 사용자가 입력한 평소 주 근로시간
export function checkMinor(c: ContractExtraction, weeklyMinutes: number | null): RuleResult {
  const days = c.schedule.filter((e) => spanMinutes(e) != null);
  const problems: string[] = [];
  const checks: string[] = [];

  for (const entry of days) {
    const work = netWorkMinutes(entry)!;
    if (work > DAILY_LIMIT) {
      problems.push(`${entry.day}요일은 ${formatDuration(work)} 일해서 하루 한도(합의해도 8시간)를 넘어요.`);
    } else if (work > MINOR_DAILY_MINUTES) {
      checks.push(`${entry.day}요일은 ${formatDuration(work)} 일해요. 하루 7시간을 넘기려면 서로 합의해야 해요.`);
    }
  }

  if (weeklyMinutes != null) {
    if (weeklyMinutes > WEEKLY_LIMIT) {
      problems.push(`일주일에 ${formatDuration(weeklyMinutes)} 일해서 주 한도(합의해도 40시간)를 넘어요.`);
    } else if (weeklyMinutes > MINOR_WEEKLY_MINUTES) {
      checks.push(`일주일에 ${formatDuration(weeklyMinutes)} 일해요. 주 35시간을 넘기려면 서로 합의해야 해요.`);
    }
  }

  const night = days.filter(worksAtNight).map((e) => `${e.day}요일 ${e.start}~${e.end}`);
  if (night.length > 0) {
    checks.push(
      `${night.join(", ")} 근무가 오후 10시~오전 6시에 걸쳐 있어요. 18세 미만은 본인이 동의하고 고용노동부 인가를 받아야만 이 시간에 일할 수 있어요.`,
    );
  }

  const status: Status = problems.length > 0 ? "problem" : "check";
  const summary =
    problems.length > 0
      ? "18세 미만이 일할 수 있는 시간보다 길게 일해요."
      : night.length > 0
        ? "18세 미만은 밤 10시 이후에 일하기 어려워요."
        : checks.length > 0
          ? "18세 미만 근로시간 기준을 넘는 부분이 있어요. 합의했는지 확인해 보세요."
          : days.length === 0 && weeklyMinutes == null
            ? "근무 시간을 몰라 18세 미만 기준은 확인하지 못했어요. 필요한 서류를 챙겨 주세요."
            : "근무시간은 18세 미만 기준에 맞아요. 필요한 서류를 챙겨 주세요.";

  const hours =
    problems.length + checks.length > 0
      ? [...problems, ...checks].join(" ")
      : days.length === 0 && weeklyMinutes == null
        ? "근무 시간이 적혀 있지 않아 하루 7시간, 일주일 35시간을 넘는지 확인하지 못했어요."
        : "하루 7시간, 일주일 35시간 안에서 일하고, 밤 10시~오전 6시 근무도 없어요.";

  return {
    ...base,
    status,
    summary,
    detail: [hours, "휴일에 일하는 것도 원칙적으로 안 돼요.", PAPERS, UNDER_15, HELP].join(" "),
  };
}
