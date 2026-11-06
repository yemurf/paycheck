import { ArrowRight, BatteryFull, Check, ChevronDown, ChevronLeft, Lock, SignalHigh, Wifi } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuthArea, LoginNotice } from "@/components/AuthArea";
import { RULE_ICON } from "@/components/rule-icons";
import { minWageNotice } from "@/lib/min-wage-notice";

// 랜딩 페이지. 앱은 /check, 샘플 체험은 /check/sample
// 숫자와 법 기준은 rules/standards.ts와 같아야 한다 (지어낸 통계는 쓰지 않는다).

const CHECKS = [
  { icon: RULE_ICON.R1, title: "최저임금", body: "시급이 계약 연도의 최저시급 이상인지, 계약이 내년까지 이어지면 인상분까지", law: "최저임금법 제6조" },
  { icon: RULE_ICON.R2, title: "수습 감액", body: "1년 이상 계약, 3개월 이내, 최저시급 90%까지라는 조건을 지켰는지", law: "최저임금법 제5조" },
  { icon: RULE_ICON.R3, title: "주휴수당", body: "주 15시간 이상 일하는데 주휴수당이 빠지거나 없다고 적혀 있지 않은지", law: "근로기준법 제55조" },
  { icon: RULE_ICON.R4, title: "휴게시간", body: "4시간 일하면 30분, 8시간 일하면 1시간 이상 쉬는 시간이 있는지", law: "근로기준법 제54조" },
  { icon: RULE_ICON.R5, title: "필수 기재사항", body: "임금, 근로시간, 휴일, 휴가 등 꼭 적어야 하는 항목이 빠지지 않았는지", law: "근로기준법 제17조" },
  {
    icon: RULE_ICON.R7,
    title: "18세 미만이라면",
    body: "하루 7시간·주 35시간을 넘지 않는지, 밤 10시 이후 근무가 없는지, 가족관계증명서와 친권자 동의서까지",
    law: "근로기준법 제69조·제70조",
  },
];

const PAINS = [
  { quote: "수습, 주휴수당… 이게 원래 이런 건지 모르겠어요", who: "계약서를 받았지만 뜻을 모를 때" },
  { quote: "급여 앱이 계산은 해주는데, 왜 이 금액인지는 몰라요", who: "앱 계산을 그냥 믿게 될 때" },
  { quote: "사장님한테 뭐라고 말해야 할지 모르겠어요", who: "이상한 걸 알아도 말 꺼내기 어려울 때" },
];

const STEPS = [
  { title: "가린 사진 올리기", body: "주민등록번호와 계좌번호를 사진 앱에서 가린 뒤 계약서 사진을 골라요. 두 장까지 돼요." },
  { title: "읽은 내용 확인", body: "AI가 읽은 시급, 근무시간, 계약기간을 확인하고 다른 곳만 고쳐요." },
  { title: "결과와 요청 문장", body: "기준과 다른 조항, 근거 조문, 쉬운 설명과 사장님께 보낼 문장까지 받아요." },
];

// 오늘이 속한 해의 최저시급 안내. 하루 단위로 다시 만들어서, 해가 바뀌면 다시 배포하지 않아도 새해 금액이 나온다.
async function MinWageNotice() {
  "use cache";
  cacheLife("days");
  return minWageNotice(new Date());
}

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-white text-zinc-900">
      <LoginNotice />
      {/* 헤더 오른쪽은 로그인 영역(선택). 점검 시작은 히어로의 '내 계약서 확인하기'가 맡는다 */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- 정적 아이콘 */}
          <img src="/icons/icon.svg" alt="" width={32} height={32} className="squircle-mask" />
          <span className="text-title3 text-blue-600">페이체크</span>
        </Link>
        <div className="min-w-0">
          <AuthArea next="/" variant="header" />
        </div>
      </header>

      {/* 첫 화면 */}
      <section className="relative">
        <div className="pointer-events-none absolute -top-24 right-[-20%] size-[480px] rounded-full bg-blue-100/70 blur-3xl" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-12 px-5 pt-8 pb-16 md:grid-cols-[1.1fr_1fr] md:pt-16 md:pb-24">
          <div className="animate-screen-in">
            <h1 className="text-display md:text-display-lg">
              알바 근로계약서,
              <br />
              사인하기 전에
              <br />
              <span className="text-blue-600">30초만 확인하세요</span>
            </h1>
            <p className="mt-4 text-lead text-zinc-600">
              <MinWageNotice /> 계약서 사진
              한 장이면 최저임금, 수습 감액, 주휴수당, 휴게시간, 필수 항목이 법 기준에 맞는지 알려드리고, 다른 곳이
              있으면 사장님께 보낼 문장도 써 드려요.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaPrimary href="/check">내 계약서 확인하기</CtaPrimary>
              <CtaSecondary href="/check/sample">회원가입 없이 샘플로 체험하기</CtaSecondary>
            </div>
          </div>

          <PhoneMock />
        </div>
      </section>

      {/* 문제 */}
      <section className="bg-zinc-50 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <SectionTitle title="알바생은 계약서를 받아도 확인할 방법이 없어요" />
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {PAINS.map((p) => (
              <li key={p.quote} className="squircle-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                <p className="text-title3 font-semibold">“{p.quote}”</p>
                <p className="mt-3 text-body-sm text-zinc-500">{p.who}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-body text-zinc-600">
            페이체크는 금액만 알려주지 않고, <strong className="text-zinc-900">어느 조항이 왜 문제인지, 사장님께 뭐라고
            말하면 되는지</strong>까지 알려줘요.
          </p>
        </div>
      </section>

      {/* 점검 항목 */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <SectionTitle title="알바 계약서에서 꼭 확인할 6가지" />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHECKS.map((c) => (
              <li key={c.title} className="squircle-3xl p-6 ring-1 ring-zinc-200 transition hover:shadow-md">
                <c.icon aria-hidden className="size-7 text-blue-600" strokeWidth={1.75} />
                <h3 className="mt-3 text-title3">{c.title}</h3>
                <p className="mt-2 text-body-sm text-zinc-600">{c.body}</p>
                <p className="mt-3 text-caption font-semibold text-blue-700">{c.law}</p>
              </li>
            ))}
            {/* 점검 항목이 6개라 마지막 줄 전체를 쓴다 */}
            <li className="sm:col-span-2 lg:col-span-3">
              <Link
                href="/no-contract"
                className="flex h-full flex-col justify-center squircle-3xl bg-blue-600 p-6 text-white transition hover:bg-blue-700 active:scale-[0.98]"
              >
                <h3 className="flex items-center gap-1 text-title3">
                  계약서를 아직 못 받았나요?
                  <ArrowRight aria-hidden className="size-5" />
                </h3>
                <p className="mt-2 text-body-sm text-blue-100">
                  근로계약서는 서면으로 받아야 해요. 사장님께 보낼 요청 문장도 준비해 뒀어요.
                </p>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* 사용 방법 */}
      <section className="bg-zinc-50 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <SectionTitle title="계약서 사진만 있으면 돼요" />
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="squircle-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                <h3 className="text-title3">
                  <span className="mr-2 text-blue-600">{i + 1}</span>
                  {s.title}
                </h3>
                <p className="mt-2 text-body-sm text-zinc-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 믿을 수 있는 이유 */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <SectionTitle title="AI는 읽고 설명만, 판정은 코드가 해요" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Trust title="같은 계약서엔 같은 결과">
              근로기준법·최저임금법에 맞는지는 AI가 아니라 미리 정해 둔 규칙 코드가 판정해요. 경계값마다 테스트로 확인했어요.
            </Trust>
            <Trust title="숫자는 코드가 계산한 것만">
              AI 설명에 판정 결과에 없는 숫자가 나오면 그 설명은 버리고 기본 문구를 보여줘요.
            </Trust>
            <Trust title="근거 조문을 함께">
              모든 결과에 최저임금법·근로기준법 조문을 같이 보여줘요.{" "}
              <Link href="/legal" className="font-semibold underline underline-offset-2">
                법적 근거 전체 보기
              </Link>
            </Trust>
          </div>

          <div className="mt-4 grid gap-4 squircle-3xl bg-zinc-900 p-6 text-white md:grid-cols-[auto_1fr] md:items-center md:p-8">
            <Lock aria-hidden className="size-7 text-zinc-300" strokeWidth={1.75} />
            <div>
              <h3 className="text-title3">사진은 남기지 않아요</h3>
              <p className="mt-2 text-body-sm text-zinc-300">
                로그인 없이 쓸 수 있고, 사진은 저장하지 않아요. 결과는 로그인하고 직접 저장할 때만 남고, 언제든 지울 수
                있어요. 주민등록번호와 계좌번호는 올리기 전에 직접 가려요.{" "}
                <Link href="/privacy" className="underline underline-offset-2">
                  개인정보 처리 안내
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 마지막 행동 유도 */}
      <section className="px-5 pb-16 md:pb-24">
        <div className="mx-auto max-w-5xl squircle-4xl bg-blue-600 px-6 py-12 text-center text-white md:py-16">
          <h2 className="text-title1 md:text-title1-lg">
            사인하기 전에,
            <br className="md:hidden" /> 30초만 확인해 보세요
          </h2>
          <p className="mt-3 text-body text-blue-100">계약서가 없어도 샘플로 바로 체험할 수 있어요.</p>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            {/* 마우스를 올리거나 키보드로 고르면 살짝 떠오르고 화살표가 앞으로 나간다 */}
            <Link
              href="/check"
              className="group flex flex-1 items-center justify-center gap-1 squircle-2xl bg-white px-5 py-4 text-headline text-blue-700 transition duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/30 focus-visible:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
            >
              내 계약서 확인하기
              <ArrowRight
                aria-hidden
                className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1"
              />
            </Link>
            <Link
              href="/check/sample"
              className="flex flex-1 items-center justify-center squircle-2xl bg-blue-500 px-5 py-4 text-headline text-white ring-1 ring-white/30 transition duration-200 ease-out hover:-translate-y-1 hover:bg-blue-400 hover:ring-white/70 hover:shadow-xl hover:shadow-blue-900/30 focus-visible:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
            >
              {/* 샘플 체험은 다음 단계가 아니라 화살표를 붙이지 않는다 */}
              회원가입 없이 샘플로 체험하기
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto max-w-5xl space-y-3 px-5 py-8 text-body-sm text-zinc-500">
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-zinc-700">페이체크 · 내돈내놔 팀</span>
            <span>AI:ON 2026 출품작</span>
            <Link href="/privacy" className="underline underline-offset-2">
              개인정보 처리 안내
            </Link>
            <Link href="/legal" className="underline underline-offset-2">
              법적 근거
            </Link>
            <a href="https://github.com/yemurf/paycheck" className="underline underline-offset-2">
              GitHub
            </a>
          </p>
          <p className="text-caption">
            페이체크의 결과는 참고용 점검이며 법률 판단이 아니에요. 정확한 확인은 고용노동부 고객상담센터(국번 없이
            1350)에 문의해 주세요.
          </p>
        </div>
      </footer>
    </div>
  );
}

// 히어로 버튼. 마우스를 올리거나 키보드로 고르면 아래 CTA처럼 살짝 떠오른다(터치 기기에서는 hover가 없다).
// 화살표는 다음 단계로 넘어가는 주 버튼에만 붙인다 (DESIGN.md 5장).
function CtaPrimary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-center gap-1 squircle-2xl bg-blue-600 px-6 py-4 text-center text-headline text-white shadow-lg shadow-blue-600/25 transition duration-200 ease-out hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus-visible:-translate-y-1 active:translate-y-0 active:scale-[0.98] active:bg-blue-700"
    >
      {children}
      <ArrowRight
        aria-hidden
        className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1"
      />
    </Link>
  );
}

function CtaSecondary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="squircle-2xl bg-white px-6 py-4 text-center text-headline text-zinc-800 ring-1 ring-zinc-200 transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-zinc-900/10 hover:ring-zinc-300 focus-visible:-translate-y-1 active:translate-y-0 active:scale-[0.98] active:bg-zinc-50"
    >
      {children}
    </Link>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-center text-title1 md:text-title1-lg">{title}</h2>;
}

function Trust({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="squircle-3xl bg-blue-50 p-6">
      <h3 className="text-title3 text-blue-900">{title}</h3>
      <p className="mt-2 text-body-sm text-blue-900/75">{children}</p>
    </div>
  );
}

// 첫 화면 오른쪽: 실제 결과 화면(ResultScreen)을 그대로 본뜬 휴대폰 화면 (샘플 계약서 하루커피의 실제 판정 결과)
// 글자 크기·간격 토큰의 예외: 화면 안 폭이 약 282px이라 실제 화면(375px)을 0.75배로 줄여 그린다.
// title2 20→15, title1 24→18, headline·body 16→12, body-sm 14→11, caption 12→10(장식용이라 11px 미만 허용, aria-hidden).
function PhoneMock() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-[300px] animate-screen-in [animation-delay:120ms] [animation-fill-mode:both]"
    >
      {/* 옆면 버튼: 금속 테와 같은 색, 끝을 둥글게 */}
      <span className="absolute top-[17%] -left-[2px] h-7 w-[3px] rounded-l-full bg-gradient-to-b from-zinc-500 to-zinc-700" />
      <span className="absolute top-[24%] -left-[2px] h-11 w-[3px] rounded-l-full bg-gradient-to-b from-zinc-500 to-zinc-700" />
      <span className="absolute top-[31%] -left-[2px] h-11 w-[3px] rounded-l-full bg-gradient-to-b from-zinc-500 to-zinc-700" />
      <span className="absolute top-[26%] -right-[2px] h-16 w-[3px] rounded-r-full bg-gradient-to-b from-zinc-500 to-zinc-700" />

      {/*
        폰 외곽은 스쿼클 유틸리티를 쓰지 않는다. Safari에서는 스쿼클이 작은 원호(48px)로 바뀌어 각져 보이고,
        Chrome에서는 반지름이 1.8배가 되면서 바깥·안쪽 곡선이 어긋나 모서리 베젤만 두꺼워진다.
        모든 브라우저에서 같은 큰 원호로, 바깥 56 → 금속 테 3px → 53 → 베젤 6px → 화면 47 (동심원)
      */}
      <div className="aspect-[9/19.5] rounded-[56px] bg-gradient-to-br from-zinc-400 via-zinc-800 to-zinc-500 p-[3px] shadow-2xl shadow-blue-900/25">
        <div className="h-full rounded-[53px] bg-zinc-950 p-[6px]">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[47px] bg-white">
            {/* 상태 표시줄과 카메라 */}
            <div className="relative flex h-11 shrink-0 items-center justify-between px-8 pt-1 text-[13px] font-semibold">
              <span>9:41</span>
              <span className="absolute top-2.5 left-1/2 h-6 w-[84px] -translate-x-1/2 rounded-full bg-zinc-950" />
              <span className="flex items-center gap-1">
                <SignalHigh className="size-3.5" strokeWidth={2.5} />
                <Wifi className="size-3.5" strokeWidth={2.5} />
                <BatteryFull className="size-[18px]" strokeWidth={2} />
              </span>
            </div>

            {/* 앱 화면 */}
            <div className="flex-1 overflow-hidden px-4 pt-2">
              <div className="flex items-center gap-1">
                <ChevronLeft className="-ml-1 size-5 text-zinc-600" />
                <p className="text-[15px] font-bold">점검 결과</p>
              </div>

              <div className="mt-3 squircle-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
                <p className="text-[11px] text-zinc-500">항목 5개를 점검했어요</p>
                <p className="mt-0.5 text-[15px] font-bold tracking-[-0.02em]">기준과 다른 조항이 있어요</p>
                <div className="mt-2.5 grid grid-cols-3 divide-x divide-zinc-200 border-t border-zinc-200 pt-2.5 text-center">
                  <MiniCount n={1} label="기준과 달라요" tone="text-red-600" />
                  <MiniCount n={4} label="확인이 필요해요" tone="text-amber-700" />
                  <MiniCount n={0} label="문제 없어요" tone="text-zinc-500" />
                </div>
              </div>

              <div className="mt-2.5 overflow-hidden squircle-2xl border border-red-200 bg-white shadow-sm">
                <div className="p-3">
                  <div className="flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold">
                      <RULE_ICON.R2 className="size-4 text-zinc-500" />
                      수습 감액
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        기준과 달라요
                      </span>
                      <ChevronDown className="size-4 rotate-180 text-zinc-400" />
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-[1.6] text-zinc-700">계약기간이 1년 미만인데 수습 감액이 있어요.</p>
                </div>
                <div className="border-t border-zinc-100 px-3 pt-2 pb-3">
                  <p className="text-[10px] text-zinc-500">
                    근거: 최저임금법 제5조 <span className="text-blue-700 underline underline-offset-2">조문 원문 보기</span>
                  </p>
                  <p className="mt-2.5 text-[11px] font-semibold text-zinc-700">사장님께 이렇게 말해 보세요</p>
                  <p className="mt-1.5 squircle-xl bg-zinc-100 p-2 text-[12px] leading-[1.6] text-zinc-800">
                    사장님, 수습 기간 급여를 찾아보니 이 계약에서는 지금처럼 줄이기 어려울 수 있다고 해서요…
                  </p>
                  <p className="mt-1.5 flex items-center justify-center gap-1 squircle-xl bg-blue-50 py-2 text-[11px] font-semibold text-blue-700">
                    <Check className="size-3.5" strokeWidth={2.5} />
                    복사했어요
                  </p>
                </div>
              </div>

              <div className="mt-2.5 squircle-2xl border border-amber-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold">
                    <RULE_ICON.R3 className="size-4 text-zinc-500" />
                    주휴수당
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      확인이 필요해요
                    </span>
                    <ChevronDown className="size-4 rotate-180 text-zinc-400" />
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-[1.6] text-zinc-700">
                  주 15시간 일해서 주휴수당 대상인데, 계약서에 언급이 없어요.
                </p>
                <p className="-mx-3 mt-3 border-t border-zinc-100 px-3 pt-2 text-[10px] text-zinc-500">
                  근거: 근로기준법 제55조 <span className="text-blue-700 underline underline-offset-2">조문 원문 보기</span>
                </p>
              </div>
            </div>

            {/* 아래로 더 이어지는 느낌 + 홈 표시줄 */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/90 to-transparent" />
            <span className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-zinc-900" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCount({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div>
      <p className={`text-[18px] font-bold leading-none tabular-nums ${tone}`}>{n}</p>
      <p className="mt-1 text-[10px] text-zinc-500">{label}</p>
    </div>
  );
}
