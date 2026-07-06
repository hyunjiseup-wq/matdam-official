// =============================================================
// 이미지 업로드 전처리 (웹)
// - 타입·용량 검증 → 캔버스 리사이즈(긴 변 maxDim) → JPEG 변환
// - 스토리지 버킷에도 5MB·이미지 MIME 제한이 걸려 있어 2중 방어
// =============================================================

/** 원본 파일 허용 상한 — 이보다 크면 리사이즈 시도 없이 거부 */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
/** 업로드 최종 상한 (버킷 file_size_limit 와 동일) */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** 맛집 사진 긴 변 기본값 */
export const PHOTO_MAX_DIM = 1600;
/** 프로필 아바타 긴 변 */
export const AVATAR_MAX_DIM = 512;

const JPEG_QUALITY = 0.82;

export interface PreparedImage {
  blob: Blob;
  ext: string;
  contentType: string;
}

/**
 * 업로드 전 이미지 검증·축소. 웹(캔버스) 환경에서는 긴 변 maxDim 으로
 * 줄여 JPEG 로 변환하고, 캔버스가 없는 환경(네이티브)에서는 검증만 한다.
 * 변환에 실패해도 원본이 상한 이내면 그대로 통과시켜 업로드는 막지 않는다.
 */
export async function prepareImageForUpload(
  file: Blob,
  maxDim: number = PHOTO_MAX_DIM
): Promise<PreparedImage> {
  const type = (file as any).type || '';
  if (type && !type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있어요.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('사진이 너무 커요. 25MB 이하 이미지를 선택해주세요.');
  }

  const fallback = (): PreparedImage => {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error('사진이 너무 커요. 5MB 이하 이미지를 선택해주세요.');
    }
    return { blob: file, ext: extFromType(type), contentType: type || 'image/jpeg' };
  };

  if (typeof document === 'undefined') return fallback();

  try {
    const source = await loadImageSource(file);
    const scale = Math.min(1, maxDim / Math.max(source.width, source.height));
    const w = Math.max(1, Math.round(source.width * scale));
    const h = Math.max(1, Math.round(source.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fallback();
    ctx.fillStyle = '#fff'; // 투명 PNG → JPEG 변환 시 검은 배경 방지
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(source.image, 0, 0, w, h);
    source.release();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob) return fallback();

    // 이미 작고 축소도 없던 JPEG 라면 재인코딩으로 커지는 것 방지
    if (scale === 1 && type === 'image/jpeg' && blob.size >= file.size) return fallback();

    return { blob, ext: 'jpg', contentType: 'image/jpeg' };
  } catch {
    return fallback();
  }
}

interface LoadedImage {
  image: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

async function loadImageSource(file: Blob): Promise<LoadedImage> {
  if (typeof createImageBitmap === 'function') {
    const bmp = await createImageBitmap(file);
    return {
      image: bmp,
      width: bmp.width,
      height: bmp.height,
      release: () => bmp.close(),
    };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('이미지를 읽을 수 없어요.'));
      el.src = url;
    });
    return {
      image: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function extFromType(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/gif') return 'gif';
  return 'jpg';
}
