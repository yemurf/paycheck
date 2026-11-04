import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "개인정보 처리 안내 | 페이체크",
};

// 사실과 다르면 안 되는 문서다. 처리 방식(전송처, 저장 여부)을 바꾸면 이 페이지도 같이 고친다.
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 leading-relaxed text-zinc-700">
      <Link href="/" className="-ml-1 inline-flex items-center gap-0.5 text-sm text-blue-600">
        <ChevronLeft aria-hidden className="size-4" />
        페이체크로 돌아가기
      </Link>
      <h1 className="mt-4 text-xl font-bold text-zinc-900">개인정보 처리 안내</h1>
      <p className="mt-2 text-sm text-zinc-500">페이체크는 회원가입 없이 쓰고, 아무것도 저장하지 않아요.</p>

      <Section title="무엇을 받나요">
        <ul className="list-disc space-y-1 pl-5">
          <li>근로계약서 사진 (주민등록번호·계좌번호는 올리기 전에 사진 앱에서 직접 가려 주세요. 올린 사진은 크기만 줄여서 보내요)</li>
          <li>확인 화면에서 직접 고치거나 입력한 값</li>
        </ul>
      </Section>

      <Section title="어디에 쓰나요">
        <p>계약서 내용을 읽고 점검 결과와 설명을 보여주는 데에만 써요.</p>
      </Section>

      <Section title="어디로 보내나요">
        <p>
          사진과 입력값은 분석을 위해 미국의 AI 중개 서비스 <strong>OpenRouter</strong>로 보내지고, OpenRouter는 이를
          Claude AI를 제공하는 회사(Anthropic 또는 Claude를 운영하는 클라우드 회사)에 전달해요. 사진에 주민등록번호,
          계좌번호처럼 민감한 정보가 있다면 올리기 전에 꼭 가려 주세요. 페이체크는 사진을 따로 가려 주지 않아요.
        </p>
      </Section>

      <Section title="얼마나 보관하나요">
        <ul className="list-disc space-y-1 pl-5">
          <li>페이체크는 사진, 입력값, 결과를 저장하지 않아요. 화면을 닫거나 새로고침하면 사라져요.</li>
          <li>너무 많은 요청을 막기 위해 접속 IP를 1분 동안 서버 메모리에서만 써요.</li>
          <li>
            AI 서비스와 서버 호스팅(Vercel)은 각 회사의 정책에 따라 처리 기록을 일정 기간 보관할 수 있어요.
          </li>
        </ul>
      </Section>

      <Section title="점검 결과에 대해">
        <p>
          페이체크의 결과는 참고용 점검이며 법률 판단이 아니에요. 정확한 확인은 고용노동부 고객상담센터(국번 없이
          1350)에 문의해 주세요.
        </p>
      </Section>

      <Section title="만든 사람">
        <p>내돈내놔 팀 (AI:ON 2026 출품작)</p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 text-sm">
      <h2 className="mb-1.5 text-base font-semibold text-zinc-900">{title}</h2>
      {children}
    </section>
  );
}
