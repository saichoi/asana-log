/**
 * 사진 파일을 긴 변 maxSize(px) 이하의 JPEG data URL 로 줄인다.
 * localStorage 용량(보통 5MB)을 아끼기 위해 업로드 전에 꼭 거친다.
 */
export async function resizeImage(file, maxSize = 640, quality = 0.82) {
  if (!file?.type?.startsWith('image/')) throw new Error('이미지 파일만 올릴 수 있어요.');

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('이미지를 읽을 수 없어요. 다른 사진으로 시도해 주세요.'));
      image.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fffdf8'; // 투명 PNG 배경
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
