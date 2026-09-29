import { useRef, useState } from 'react';
import { resizeImage } from '../utils/image.js';
import { CameraIcon } from './Icons.jsx';

/** 사진 올리기 / 바꾸기 / 지우기 버튼 묶음. onChange(dataUrl | null) */
export default function PhotoPicker({ hasPhoto, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일을 다시 골라도 동작하도록
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await onChange(await resizeImage(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setError('');
    try {
      await onChange(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="photo-picker">
      <div className="photo-picker__buttons">
        <button type="button" className="button button--small" disabled={busy} onClick={() => inputRef.current?.click()}>
          <CameraIcon width={16} height={16} />
          {busy ? '불러오는 중…' : hasPhoto ? '사진 바꾸기' : '내 사진 올리기'}
        </button>
        {hasPhoto && (
          <button type="button" className="button button--small button--ghost" onClick={handleRemove}>
            사진 지우기
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
