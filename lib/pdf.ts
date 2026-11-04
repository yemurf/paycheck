// 브라우저 전용. PDF 계약서를 장마다 이미지로 바꿔서 사진과 똑같이 다룬다.
// 서버로는 이미지만 가니, 크기 한도와 미리보기를 사진과 같은 방식으로 처리할 수 있다.
import { MAX_SIDE, photoFromCanvas, whiteCanvas, type Photo } from "./image";

export class PdfError extends Error {
  constructor(public code: "PASSWORD" | "UNREADABLE") {
    super(code);
  }
}

export async function loadPdfPages(file: Blob, maxPages: number): Promise<{ photos: Photo[]; totalPages: number }> {
  // pdf.js는 크니까 PDF를 고를 때만 불러온다
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerPort) {
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url), {
      type: "module",
    });
  }

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let doc;
  try {
    doc = await task.promise;
  } catch (e) {
    throw new PdfError(e instanceof Error && e.name === "PasswordException" ? "PASSWORD" : "UNREADABLE");
  }

  try {
    const photos: Photo[] = [];
    for (let n = 1; n <= Math.min(doc.numPages, maxPages); n++) {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: MAX_SIDE / Math.max(base.width, base.height) });
      const { canvas } = whiteCanvas(Math.round(viewport.width), Math.round(viewport.height));
      await page.render({ canvas, viewport, background: "#ffffff" }).promise;
      photos.push({ ...(await photoFromCanvas(canvas)), fromPdf: true });
    }
    return { photos, totalPages: doc.numPages };
  } finally {
    await task.destroy();
  }
}
