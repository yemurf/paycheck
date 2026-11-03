// 브라우저 전용. 사진을 업로드 전에 축소한다.
// 민감정보는 사용자가 사진 앱에서 직접 가린 뒤 올린다 (앱 안에서 가리는 기능은 없앴다).

const MAX_SIDE = 1600; // PRD 8장: 업로드 전 긴 변 1,600px

export type Photo = {
  id: string;
  src: string; // 미리보기용 object URL
  blob: Blob; // 축소한 JPEG. 서버로는 이것만 보낸다
  width: number;
  height: number;
};

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", quality),
  );
}

// 사진을 열어 긴 변 1,600px JPEG로 바꾼다. HEIC를 못 여는 브라우저면 예외.
export async function loadPhoto(file: Blob): Promise<Photo> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  // PNG의 투명한 부분이 JPEG에서 검게 변하지 않게 흰 바탕을 깐다
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvasToJpeg(canvas, 0.85);
  // crypto.randomUUID는 https에서만 있어서, 같은 와이파이로 폰 테스트(http://192.168…)할 때 깨진다
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { id, src: URL.createObjectURL(blob), blob, width, height };
}

// 체험용 샘플 계약서 (가상의 인물·사업장, public/samples)
export async function loadSamplePhoto(): Promise<Photo> {
  const res = await fetch("/samples/sample-contract.png");
  if (!res.ok) throw new Error("sample not found");
  return loadPhoto(await res.blob());
}
