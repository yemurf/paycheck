import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { CONSULTATION_DATE, CONSULTATIONS, LEGAL_SOURCES, LEGAL_VERIFIED_ON, RULE_TITLES, lawUrl } from "@/rules/legal-sources";
import { formatWon } from "@/rules/helpers";
import { MIN_WAGE_BY_YEAR } from "@/rules/standards";
import type { RuleId } from "@/rules";

export const metadata: Metadata = {
  title: "법적 근거 | 페이체크",
  description: "페이체크가 근로계약서를 점검할 때 쓰는 법 조항과 원문 (출처: 국가법령정보센터)",
};

const RULE_IDS: RuleId[] = ["R1", "R2", "R3", "R4", "R5", "R7"];

export default function LegalPage() {
  const minWages = Object.entries(MIN_WAGE_BY_YEAR)
    .map(([year, wage]) => ({ year: Number(year), wage }))
    .filter((m) => m.year >= 2020) // 표는 2020년부터만 보여준다 (판정은 그 이전 연도 값도 쓴다)
    .sort((a, b) => b.year - a.year);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-6 text-body text-zinc-700">
      <Link href="/" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-body-sm text-blue-600">
        <ChevronLeft aria-hidden className="size-4" />
        페이체크로 돌아가기
      </Link>
      <h1 className="mt-2 text-title1 text-zinc-900">법적 근거</h1>
      <p className="mt-2">
        페이체크가 근로계약서를 점검할 때 쓰는 법 조항과 그 원문이에요. 판정은 아래 조항을 옮긴 규칙 코드가 하고,
        AI는 계약서를 읽고 결과를 쉽게 풀어 쓰는 일만 해요.
      </p>
      <p className="mt-3 rounded-2xl bg-zinc-50 px-4 py-3 text-body-sm ring-1 ring-zinc-200">
        출처: <a href={LAW_HOME} className="font-semibold text-blue-700 underline underline-offset-2">국가법령정보센터(법제처)</a>{" "}
        현행 법령 · {LEGAL_VERIFIED_ON} 확인
      </p>

      {/* 점검별 근거 한눈에 */}
      <section className="mt-8">
        <h2 className="text-title3 text-zinc-900">점검별 근거 조항</h2>
        <ul className="mt-3 divide-y divide-zinc-100 rounded-2xl ring-1 ring-zinc-200">
          {RULE_IDS.map((id) => (
            <li key={id} id={id} className="flex scroll-mt-6 gap-3 px-4 py-3 text-body-sm">
              <span className="w-24 shrink-0 font-semibold text-zinc-900">{RULE_TITLES[id]}</span>
              <span>
                {LEGAL_SOURCES.flatMap((s) =>
                  s.articles
                    .filter((a) => a.rules.includes(id) && !a.reference)
                    .map((a) => `${shortName(s.name)} ${a.ref}`),
                ).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 법령별 원문 */}
      {LEGAL_SOURCES.map((source) => (
        <section key={source.name} className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h2 className="text-title3 text-zinc-900">{source.name}</h2>
            <a href={lawUrl(source)} className="text-body-sm text-blue-700 underline underline-offset-2">
              법제처에서 전문 보기
            </a>
          </div>
          <p className="text-caption text-zinc-500">{source.version}</p>

          <div className="mt-3 space-y-3">
            {source.articles.map((a) => (
              <article key={a.ref} className="rounded-2xl p-4 ring-1 ring-zinc-200">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-zinc-900">
                    {a.ref} <span className="font-semibold text-zinc-500">({a.title})</span>
                  </h3>
                  {a.rules.map((r) => (
                    <span key={r} className="rounded-full bg-blue-50 px-2 py-0.5 text-caption font-semibold text-blue-700">
                      {RULE_TITLES[r]}
                    </span>
                  ))}
                  {a.reference && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-caption font-semibold text-zinc-600">
                      참고 · 판정에 미반영
                    </span>
                  )}
                </div>
                <blockquote className="mt-2 border-l-4 border-zinc-200 pl-3 text-body-sm text-zinc-800">{a.text}</blockquote>
                <p className="mt-3 text-body-sm">
                  <span className="font-semibold text-zinc-900">페이체크에서는 </span>
                  {a.use}
                </p>
                <a href={lawUrl(source, a)} className="mt-2 inline-block text-caption text-blue-700 underline underline-offset-2">
                  {shortName(source.name)} {a.jo} 원문 보기
                </a>
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* 1350 상담 */}
      <section className="mt-8">
        <h2 className="text-title3 text-zinc-900">고용노동부 상담센터에 확인한 내용</h2>
        <p className="mt-1 text-body-sm">
          법 조문만으로 정하기 어려운 부분은 고용노동부 고객상담센터(1350)에 전화로 물어보고 판정 기준에 반영했어요. (
          {CONSULTATION_DATE} 상담)
        </p>
        <ul className="mt-3 space-y-2">
          {CONSULTATIONS.map((c) => (
            <li key={c.q} className="rounded-2xl p-4 text-body-sm ring-1 ring-zinc-200">
              <p className="font-semibold text-zinc-900">Q. {c.q}</p>
              <p className="mt-1">A. {c.a}</p>
              <p className="mt-2 flex flex-wrap gap-1">
                {c.rules.map((r) => (
                  <span key={r} className="rounded-full bg-blue-50 px-2 py-0.5 text-caption font-semibold text-blue-700">
                    {RULE_TITLES[r]}
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-caption text-zinc-500">전화 상담 답변은 일반적인 안내라서, 개별 사안은 다르게 판단될 수 있어요.</p>
      </section>

      {/* 최저임금액 */}
      <section className="mt-8">
        <h2 className="text-title3 text-zinc-900">연도별 최저임금 (시간급)</h2>
        <p className="mt-1 text-body-sm">
          최저임금액은 법 조문이 아니라 고용노동부 장관이 해마다 고시해요. 최저임금·수습 감액 점검은 아래 금액을 써요.{" "}
          <a href="https://www.minimumwage.go.kr" className="text-blue-700 underline underline-offset-2">
            최저임금위원회
          </a>
        </p>
        <table className="mt-3 w-full overflow-hidden rounded-2xl text-body-sm ring-1 ring-zinc-200">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">연도</th>
              <th className="px-4 py-2 text-right font-semibold">시간급</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {minWages.map((m) => (
              <tr key={m.year}>
                <td className="px-4 py-2">{m.year}년</td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums text-zinc-900">{formatWon(m.wage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="mt-8 border-t border-zinc-200 pt-4 text-caption text-zinc-500">
        페이체크의 결과는 참고용 점검이며 법률 판단이 아니에요. 법령은 바뀔 수 있으니 정확한 확인은 고용노동부
        고객상담센터(국번 없이 1350)에 문의해 주세요.
      </p>
    </main>
  );
}

const LAW_HOME = "https://www.law.go.kr";

function shortName(name: string) {
  return name.includes("(기간제법)") ? "기간제법" : name;
}
