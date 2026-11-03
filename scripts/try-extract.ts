// 로컬 파일로 추출을 바로 시험한다 (Next 서버 없이).
// 사용법: npm run try-extract -- 근로계약서_아웃백_정예진.pdf [두번째장.jpg]
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { extractContract, type ContractFile } from "../lib/extract";

const MEDIA_TYPES: Record<string, ContractFile["mediaType"]> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error("사용법: npm run try-extract -- <파일> [파일2]");
  process.exit(1);
}

const files: ContractFile[] = paths.map((p) => {
  const mediaType = MEDIA_TYPES[extname(p).toLowerCase()];
  if (!mediaType) throw new Error(`지원하지 않는 파일: ${p}`);
  return { mediaType, data: readFileSync(p).toString("base64") };
});

async function main() {
  const started = Date.now();
  const result = await extractContract(files);
  console.log(JSON.stringify(result, null, 2));
  console.error(`\n${((Date.now() - started) / 1000).toFixed(1)}초`);
}

main();
