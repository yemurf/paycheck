import Link from "next/link";
import type { ReactNode } from "react";

// 랜딩 페이지. 앱은 /check, 샘플 체험은 /check?sample=1
// 숫자와 법 기준은 rules/standards.ts와 같아야 한다 (지어낸 통계는 쓰지 않는다).

const CHECKS = [
  { icon: "💰", title: "최저임금", body: "시급이 계약 연도의 최저시급 이상인지, 계약이 내년까지 이어지면 인상분까지", law: "최저임금법 제6조" },
  { icon: "🌱", title: "수습 감액", body: "1년 이상 계약, 3개월 이내, 최저시급 90%까지라는 조건을 지켰는지", law: "최저임금법 제5조" },
  { icon: "📅", title: "주휴수당", body: "주 15시간 이상 일하는데 주휴수당이 빠지거나 없다고 적혀 있지 않은지", law: "근로기준법 제55조" },
  { icon: "☕", title: "휴게시간", body: "4시간 일하면 30분, 8시간 일하면 1시간 이상 쉬는 시간이 있는지", law: "근로기준법 제54조" },
  { icon: "📝", title: "필수 기재사항", body: "임금, 근로시간, 휴일, 휴가 등 꼭 적어야 하는 항목이 빠지지 않았는지", law: "근로기준법 제17조" },
  {
    icon: "🎒",
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

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-white text-zinc-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- 정적 아이콘 */}
          <img src="/icons/icon.svg" alt="" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-bold text-blue-600">페이체크</span>
        </Link>
        <Link
          href="/check"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-95"
        >
          시작하기
        </Link>
      </header>

      {/* 첫 화면 */}
      <section className="relative">
        <div className="pointer-events-none absolute -top-24 right-[-20%] size-[480px] rounded-full bg-blue-100/70 blur-3xl" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-12 px-5 pt-8 pb-16 md:grid-cols-[1.1fr_1fr] md:pt-16 md:pb-24">
          <div className="animate-screen-in">
            <p className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              2027년 최저시급 10,700원, 내 계약서는?
            </p>
            <h1 className="mt-5 text-[34px] font-extrabold leading-[1.25] tracking-tight md:text-5xl md:leading-[1.2]">
              알바 근로계약서,
              <br />
              사인하기 전에
              <br />
              <span className="text-blue-600">30초만 확인하세요</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-zinc-600">
              사진 한 장이면 최저임금, 수습 감액, 주휴수당, 휴게시간, 필수 항목이 근로기준법·최저임금법에 맞는지
              알려드려요. 이상한 곳이 있으면 사장님께 보낼 문장까지요.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaPrimary href="/check">내 계약서 확인하기</CtaPrimary>
              <CtaSecondary href="/check?sample=1">샘플 계약서로 체험하기</CtaSecondary>
            </div>
            <p className="mt-4 text-sm text-zinc-500">회원가입 없음 · 사진 저장 안 함 · 무료</p>
          </div>

          <PhoneMock />
        </div>
      </section>

      {/* 문제 */}
      <section className="bg-zinc-50 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <SectionTitle eyebrow="왜 만들었나요" title="알바생은 계약서를 받아도 확인할 방법이 없어요" />
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {PAINS.map((p) => (
              <li key={p.quote} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                <p className="text-lg font-semibold leading-snug">“{p.quote}”</p>
                <p className="mt-3 text-sm text-zinc-500">{p.who}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center leading-relaxed text-zinc-600">
            페이체크는 계산만 해주는 대신, <strong className="text-zinc-900">왜 문제인지와 무엇을 하면 되는지</strong>를
            알려줘요.
          </p>
        </div>
      </section>

      {/* 점검 항목 */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <SectionTitle eyebrow="무엇을 확인하나요" title="알바 계약서에서 꼭 확인할 6가지" />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHECKS.map((c) => (
              <li key={c.title} className="rounded-3xl p-6 ring-1 ring-zinc-200 transition hover:shadow-md">
                <span className="text-3xl" aria-hidden>
                  {c.icon}
                </span>
                <h3 className="mt-3 text-lg font-bold">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{c.body}</p>
                <p className="mt-3 text-xs font-semibold text-blue-700">{c.law}</p>
              </li>
            ))}
            {/* 점검 항목이 6개라 마지막 줄 전체를 쓴다 */}
            <li className="sm:col-span-2 lg:col-span-3">
              <Link
                href="/no-contract"
                className="flex h-full flex-col justify-center rounded-3xl bg-blue-600 p-6 text-white transition hover:bg-blue-700 active:scale-[0.98]"
              >
                <h3 className="text-lg font-bold">계약서를 아직 못 받았나요? →</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-blue-100">
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
          <SectionTitle eyebrow="어떻게 쓰나요" title="사진 올리고, 확인하고, 결과 받기" />
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                <span className="flex size-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 믿을 수 있는 이유 */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <SectionTitle eyebrow="믿을 수 있나요" title="AI는 읽고 설명만, 판정은 코드가 해요" />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
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

          <div className="mt-4 grid gap-4 rounded-3xl bg-zinc-900 p-6 text-white md:grid-cols-[auto_1fr] md:items-center md:p-8">
            <span className="text-3xl" aria-hidden>
              🔒
            </span>
            <div>
              <h3 className="text-lg font-bold">개인정보는 남기지 않아요</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                회원가입이 없고, 사진과 결과를 저장하지 않아요. 주민등록번호와 계좌번호는 올리기 전에 직접 가려요.{" "}
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
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-blue-600 px-6 py-12 text-center text-white md:py-16">
          <h2 className="text-2xl font-extrabold leading-snug md:text-4xl">
            사인하기 전에,
            <br className="md:hidden" /> 30초만 확인해 보세요
          </h2>
          <p className="mt-3 text-blue-100">계약서가 없어도 샘플로 바로 체험할 수 있어요.</p>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <Link
              href="/check"
              className="flex-1 rounded-2xl bg-white px-5 py-4 text-center font-semibold text-blue-700 transition active:scale-[0.98]"
            >
              내 계약서 확인하기
            </Link>
            <Link
              href="/check?sample=1"
              className="flex-1 rounded-2xl bg-blue-500 px-5 py-4 text-center font-semibold text-white ring-1 ring-white/30 transition active:scale-[0.98]"
            >
              샘플로 체험하기
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto max-w-5xl space-y-3 px-5 py-8 text-sm text-zinc-500">
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
          <p className="text-xs leading-relaxed">
            페이체크의 결과는 참고용 점검이며 법률 판단이 아니에요. 정확한 확인은 고용노동부 고객상담센터(국번 없이
            1350)에 문의해 주세요.
          </p>
        </div>
      </footer>
    </div>
  );
}

function CtaPrimary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-blue-600 px-6 py-4 text-center text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition active:scale-[0.98] active:bg-blue-700"
    >
      {children}
    </Link>
  );
}

function CtaSecondary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white px-6 py-4 text-center text-base font-semibold text-zinc-800 ring-1 ring-zinc-200 transition active:scale-[0.98] active:bg-zinc-50"
    >
      {children}
    </Link>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold text-blue-600">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold leading-snug tracking-tight md:text-4xl">{title}</h2>
    </div>
  );
}

function Trust({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl bg-blue-50 p-6">
      <h3 className="text-lg font-bold text-blue-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-blue-900/75">{children}</p>
    </div>
  );
}

// 첫 화면 오른쪽: 실제 결과 화면을 본뜬 폰 (샘플 계약서 하루커피의 실제 판정 결과)
function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[320px] animate-screen-in [animation-delay:120ms] [animation-fill-mode:both]">
      <div className="rounded-[2.75rem] bg-zinc-900 p-3 shadow-2xl shadow-blue-900/20">
        <div className="overflow-hidden rounded-[2.1rem] bg-white px-4 pt-6 pb-5">
          <p className="text-base font-bold">점검 결과</p>
          <div className="mt-3 rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
            <p className="text-xs text-zinc-500">항목 5개를 점검했어요</p>
            <p className="mt-0.5 text-sm font-bold">기준과 다른 조항이 있어요</p>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
              <MiniCount n={1} label="달라요" tone="bg-red-50 text-red-700" />
              <MiniCount n={4} label="확인 필요" tone="bg-amber-50 text-amber-800" />
              <MiniCount n={0} label="문제 없음" tone="bg-green-50 text-green-700" />
            </div>
          </div>
          <div className="mt-2.5 rounded-2xl border border-red-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">🌱 수습 감액</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                기준과 달라요
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">계약기간이 1년 미만인데 수습 감액이 있어요.</p>
            <p className="mt-2 rounded-xl bg-zinc-100 p-2 text-[11px] leading-relaxed text-zinc-700">
              사장님, 수습 기간 급여를 찾아보니 이 계약에서는 지금처럼 줄이기 어려울 수 있다고 해서요…
            </p>
          </div>
          <div className="mt-2.5 rounded-2xl border border-amber-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">📅 주휴수당</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                확인 필요
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">주 15시간 일해서 주휴수당 대상인데, 계약서에 언급이 없어요.</p>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-4 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-zinc-200 md:-left-10">
        <p className="text-xs text-zinc-500">사장님께 보낼 문장</p>
        <p className="text-sm font-bold text-blue-600">📋 복사했어요</p>
      </div>
    </div>
  );
}

function MiniCount({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className={`rounded-xl py-1.5 ${tone}`}>
      <p className="text-base font-bold leading-none">{n}</p>
      <p className="mt-0.5 text-[10px] font-semibold">{label}</p>
    </div>
  );
}
