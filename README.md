# 페이체크

알바 근로계약서 사진을 올리면 최저임금, 수습 감액, 주휴수당, 휴게시간, 필수 기재사항이 근로기준법·최저임금법에 맞는지 확인하고, 사장님께 보낼 정정 요청 문장까지 알려주는 모바일 웹입니다.

- 서비스: https://paycheck-pi.vercel.app
- 팀: 내돈내놔 (AI:ON 2026)
- 기획 문서: [`prd_v1.md`](prd_v1.md)
- 법적 근거: 판정에 쓰는 조항과 원문은 서비스의 [`/legal`](https://paycheck-pi.vercel.app/legal) 페이지에 있습니다 (출처: 국가법령정보센터). 데이터는 [`rules/legal-sources.ts`](rules/legal-sources.ts) 한 곳에서 관리합니다.

## 원칙: AI는 읽고 설명만, 판정과 계산은 코드

| 단계 | 누가 | 위치 |
| --- | --- | --- |
| 계약서 사진에서 항목 추출 | Claude (비전, 구조화 출력) | `lib/extract.ts`, `lib/contract-schema.ts` |
| 사용자가 추출값 확인·수정 | 사람 | `components/ConfirmScreen.tsx` |
| 법 기준 판정 (R1~R5) | TypeScript 순수 함수 + 단위 테스트 | `rules/` |
| 결과를 쉬운 말로 설명 | Claude (코드가 계산한 숫자만 쓰도록 검사) | `lib/explain.ts` |

같은 계약서에는 항상 같은 판정이 나오고, 판정 규칙은 `rules/rules.test.ts`의 경계값 테스트로 고정합니다.

## 개인정보

- 회원가입이 없고, 사진과 결과를 저장하지 않습니다.
- 주민등록번호·계좌번호는 사용자가 사진 앱에서 직접 가린 뒤 올립니다.
- 자세한 내용은 서비스의 `/privacy` 페이지를 참고하세요.

## 실행

```bash
npm install
cp .env.example .env.local   # 키를 채우거나 MOCK_AI=1로 키 없이 화면 개발
npm run dev                  # http://localhost:3000
npm test                     # 판정 규칙 테스트
npm run try-extract -- 샘플_근로계약서_하루커피.png   # 추출만 시험
```

## 기술

Next.js (App Router) · TypeScript · Tailwind CSS · Zod · Anthropic SDK (OpenRouter 경유) · Vitest · Vercel

> 참고용 점검이며 법률 판단이 아닙니다. 정확한 확인은 고용노동부 고객상담센터(국번 없이 1350)에 문의하세요.
