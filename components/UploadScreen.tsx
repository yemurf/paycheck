"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, extractContract } from "@/lib/api-client";
import type { ContractExtraction } from "@/lib/contract-schema";
import { loadPhoto, type Photo } from "@/lib/image";
import { loadPdfPages, PdfError } from "@/lib/pdf";
import { ErrorBox, PrimaryButton, ScreenHeader, SecondaryButton, WorkingScreen } from "./ui";

const MAX_PHOTOS = 2;

const EXTRACT_STEPS = [
  { at: 0, text: "사진을 보내고 있어요" },
  { at: 2, text: "계약서 글자를 읽고 있어요" },
  { at: 8, text: "시급과 근무시간을 정리하고 있어요" },
  { at: 15, text: "빠진 항목이 없는지 살펴보고 있어요" },
  { at: 22, text: "거의 다 됐어요" },
];

type Props = {
  photos: Photo[];
  isSample: boolean;
  onPhotosChange: (photos: Photo[]) => void;
  onExtracted: (data: ContractExtraction) => void;
  onBack: () => void;
};

export function UploadScreen({ photos, isSample, onPhotosChange, onExtracted, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Photo | null>(null);
  const [converting, setConverting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const hasPdf = photos.some((p) => p.fromPdf);

  // 사진은 바로 줄이고, PDF는 앞에서부터 남은 장 수만큼 이미지로 바꾼다
  async function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    setNotice(null);
    setConverting(true);
    const added: Photo[] = [];
    try {
      for (const file of Array.from(list)) {
        const room = MAX_PHOTOS - photos.length - added.length;
        if (room <= 0) break;
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const { photos: pages, totalPages } = await loadPdfPages(file, room);
          added.push(...pages);
          if (totalPages > pages.length) {
            setNotice(`PDF가 ${totalPages}쪽이라 앞 ${pages.length}쪽만 올렸어요. 계약서는 ${MAX_PHOTOS}장까지 볼 수 있어요.`);
          }
        } else {
          added.push(await loadPhoto(file));
        }
      }
    } catch (e) {
      setError(
        e instanceof PdfError
          ? e.code === "PASSWORD"
            ? "암호가 걸린 PDF는 열 수 없어요. 암호를 푼 PDF나 사진으로 올려 주세요."
            : "PDF를 열 수 없어요. 다른 파일이나 사진으로 다시 올려 주세요."
          : "사진을 열 수 없어요. 다른 사진으로 다시 올려주세요.",
      );
    } finally {
      setConverting(false);
    }
    if (added.length > 0) onPhotosChange([...photos, ...added]);
  }

  function removePhoto(id: string) {
    const photo = photos.find((p) => p.id === id);
    if (photo) URL.revokeObjectURL(photo.src);
    onPhotosChange(photos.filter((p) => p.id !== id));
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      onExtracted(await extractContract(photos));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "분석이 늦어지고 있어요. 잠시 후 다시 눌러주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {viewing && <PhotoViewer photo={viewing} onClose={() => setViewing(null)} />}
      {loading && <WorkingScreen title="계약서를 읽고 있어요" steps={EXTRACT_STEPS} expectedSeconds={18} />}
      <ScreenHeader title="계약서 사진 올리기" onBack={loading ? undefined : onBack} />

      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex-1">
        {isSample ? (
          <p className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-800">
            가상의 카페 계약서예요. 아래 <strong>분석하기</strong>를 눌러 실제로 점검되는 과정을 체험해 보세요.
          </p>
        ) : (
          <MaskGuide />
        )}

        {photos.length > 0 && (
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {photos.map((p, i) => (
              <li key={p.id} className="relative animate-screen-in">
                <button
                  onClick={() => setViewing(p)}
                  aria-label={`계약서 ${i + 1}장 크게 보기`}
                  className="relative block w-full transition active:scale-[0.98]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 object URL */}
                  <img
                    src={p.src}
                    alt={`계약서 ${i + 1}장`}
                    className="aspect-[3/4] w-full rounded-xl border border-zinc-200 object-cover object-top"
                  />
                  <span className="absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-black/60 to-transparent pt-6 pb-2 text-center text-xs font-semibold text-white">
                    🔍 눌러서 크게 보기
                  </span>
                </button>
                <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                  {p.fromPdf ? `${i + 1}장 · PDF` : `${i + 1}장`}
                </span>
                {!isSample && (
                  <button
                    onClick={() => removePhoto(p.id)}
                    aria-label={`${i + 1}장 빼기`}
                    className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
            {photos.length < MAX_PHOTOS && !isSample && (
              <li>
                <button
                  onClick={() => input.current?.click()}
                  className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-300 text-sm text-zinc-500 transition active:scale-[0.98]"
                >
                  <span className="text-2xl">＋</span>
                  다음 장 추가
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="mt-6 space-y-3 pb-4">
        {error && <ErrorBox>{error}</ErrorBox>}
        {notice && <p className="rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700">{notice}</p>}
        {photos.length === 0 ? (
          <PrimaryButton disabled={converting} onClick={() => input.current?.click()}>
            {converting ? "PDF를 여는 중이에요…" : "가린 사진이나 PDF 고르기"}
          </PrimaryButton>
        ) : (
          <>
            {!isSample &&
              (hasPdf ? (
                <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-200">
                  <strong>PDF는 올린 그대로 보내요.</strong> 사진을 눌러{" "}
                  <strong className="rounded bg-red-200 box-decoration-clone px-1 text-zinc-900">
                    주민등록번호나 계좌번호가 보이는지 확인해 주세요.
                  </strong>{" "}
                  보이면 ✕로 빼고, 화면을 캡처해 사진 앱에서 가린 뒤 사진으로 올려 주세요.
                </p>
              ) : (
                <p className="text-center text-sm text-zinc-500">주민등록번호와 계좌번호가 가려졌는지 한 번 더 확인해 주세요.</p>
              ))}
            <PrimaryButton disabled={loading || converting} onClick={submit}>
              분석하기
            </PrimaryButton>
            {!isSample && photos.length < MAX_PHOTOS && (
              <SecondaryButton disabled={converting} onClick={() => input.current?.click()}>
                {converting ? "PDF를 여는 중이에요…" : "계약서 다음 장 추가"}
              </SecondaryButton>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 사진을 전체 화면으로 본다. 확대하면 가로로 넓어지고, 손가락으로 밀어서 구석까지 볼 수 있다.
function PhotoViewer({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden"; // 뒤 화면이 같이 스크롤되지 않게
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal aria-label="계약서 크게 보기" className="fixed inset-0 z-50 flex animate-screen-in flex-col bg-zinc-950">
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <button
          onClick={() => setZoomed(!zoomed)}
          className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white active:bg-white/25"
        >
          {zoomed ? "화면에 맞추기" : "🔍 확대"}
        </button>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="flex size-10 items-center justify-center rounded-full bg-white/15 text-lg text-white active:bg-white/25"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-auto overscroll-contain" onDoubleClick={() => setZoomed(!zoomed)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 object URL */}
        <img
          src={photo.src}
          alt="계약서 크게 보기"
          className={zoomed ? "w-[220%] max-w-none" : "mx-auto h-full w-full object-contain"}
        />
      </div>
      <p className="px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-white/60">
        {zoomed ? "손가락으로 밀어서 볼 수 있어요" : "두 번 눌러도 확대돼요"}
      </p>
    </div>
  );
}

// 사진 앱에서 직접 가리는 방법 안내
function MaskGuide() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
        <p className="font-semibold text-amber-900">🖊 올리기 전에 직접 가려 주세요</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
          주민등록번호와 계좌번호를 사진 앱의 펜으로 칠한 뒤 올려 주세요. 가린 사진만 서버로 보내요.
        </p>
        <dl className="mt-3 space-y-1.5 text-sm text-amber-900/80">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 font-semibold text-amber-900">아이폰</dt>
            <dd>사진 → 편집 → 마크업(펜) → 칠하고 완료</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 font-semibold text-amber-900">갤럭시</dt>
            <dd>갤러리 → 편집(연필) → 그리기 → 칠하고 저장</dd>
          </div>
        </dl>
      </div>
      <ul className="space-y-1 px-1 text-sm text-zinc-500">
        <li>· 계약서 전체가 나오게, 밝은 곳에서 찍은 사진이 좋아요</li>
        <li>· 계약서가 두 장이면 두 장 모두 올려 주세요</li>
        <li>· PDF는 주민등록번호와 계좌번호가 가려진 것만 올려 주세요. 가려져 있지 않다면 화면을 캡처해 사진 앱에서 가린 뒤 사진으로 올려 주세요</li>
      </ul>
    </div>
  );
}
