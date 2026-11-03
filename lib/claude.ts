import Anthropic from "@anthropic-ai/sdk";

// API 키는 서버 환경변수(ANTHROPIC_API_KEY)에서만 읽는다.
// PRD 7장: 30초 넘으면 1회 자동 재시도 후 중단.
export const anthropic = new Anthropic({
  timeout: 30_000,
  maxRetries: 1,
});

// OpenRouter를 쓸 때는 CLAUDE_MODEL=anthropic/claude-opus-5.5 처럼 바꾼다.
export const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
