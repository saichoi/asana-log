import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from '../data/asanas.js';
import { useAsanas } from '../context/AsanaContext.jsx';
import { ASANA_LIMITS, createEmptyAsanaDraft, validateAsanaDraft } from '../models/asana.js';
import AsanaFigure from './AsanaFigure.jsx';
import PhotoPicker from './PhotoPicker.jsx';
import { BackIcon } from './Icons.jsx';

const NAME_FIELDS = [
  { key: 'ko', label: '한국어 이름', placeholder: '예) 사이드 플랭크', required: true },
  { key: 'en', label: 'English', placeholder: 'e.g. Side Plank' },
  { key: 'sa', label: 'Sanskrit', placeholder: 'e.g. Vasisthasana' },
];

/** 아사나 추가 / 수정 폼. asanaId 가 없으면 새로 추가 */
export default function AsanaForm({ asanaId, onSaved, onCancel, onDirtyChange }) {
  const { asanas, getAsana, images, addAsana, updateAsana, setImage } = useAsanas();
  const editing = asanaId ? getAsana(asanaId) : null;

  const initial = useMemo(() => {
    if (!editing) return { ...createEmptyAsanaDraft(), photo: null };
    const { ko, en, sa, category, description = '' } = editing;
    return { ko, en, sa, category, description, photo: images[editing.id] ?? null };
    // 폼을 여는 순간의 값으로 고정한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange]);

  const setField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(({ [key]: _, ...rest }) => rest);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateAsanaDraft(draft, asanas, editing?.id);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() =>
        document.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
      return;
    }
    setSaving(true);
    try {
      const saved = editing ? await updateAsana(editing.id, draft) : await addAsana(draft);
      if (draft.photo !== initial.photo) await setImage(saved.id, draft.photo);
      await onSaved(saved.id, Boolean(editing));
    } catch (err) {
      setErrors({ submit: err.message });
      setSaving(false);
    }
  };

  return (
    <section className="page page--detail">
      <div className="topbar">
        <button type="button" className="icon-button" aria-label="취소" onClick={onCancel}>
          <BackIcon />
        </button>
      </div>
      <header className="page__header">
        <p className="page__eyebrow">{editing ? 'Edit Asana' : 'New Asana'}</p>
        <h1 className="page__title">{editing ? '자세 수정' : '새 자세 추가'}</h1>
        {!editing && <p className="page__subtitle">추가한 자세는 기록 작성과 사전에서 바로 쓸 수 있어요.</p>}
      </header>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <span className="field__label">이미지 <span className="field__optional">선택</span></span>
          <div className="photo-field">
            <AsanaFigure asana={editing ?? { id: '__new__', ko: draft.ko }} photo={draft.photo} size="md" />
            <PhotoPicker hasPhoto={Boolean(draft.photo)} onChange={(dataUrl) => setField('photo', dataUrl)} />
          </div>
        </div>

        {NAME_FIELDS.map(({ key, label, placeholder, required }) => (
          <div key={key} className="field">
            <label className="field__label" htmlFor={`asana-${key}`}>
              {label} {!required && <span className="field__optional">선택</span>}
            </label>
            <input
              id={`asana-${key}`}
              className="input"
              value={draft[key]}
              placeholder={placeholder}
              maxLength={ASANA_LIMITS[key] + 10}
              autoCapitalize={key === 'ko' ? 'off' : 'words'}
              autoComplete="off"
              onChange={(e) => setField(key, e.target.value)}
              aria-invalid={Boolean(errors[key])}
            />
            {errors[key] && <p className="field-error">{errors[key]}</p>}
          </div>
        ))}

        <div className="field">
          <span className="field__label">분류</span>
          <div className="chip-group" role="radiogroup" aria-label="분류">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                role="radio"
                aria-checked={draft.category === category}
                className={`chip${draft.category === category ? ' is-active' : ''}`}
                onClick={() => setField('category', category)}
              >
                {category}
              </button>
            ))}
          </div>
          {errors.category && <p className="field-error">{errors.category}</p>}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="asana-description">
            설명 <span className="field__optional">선택</span>
          </label>
          <textarea
            id="asana-description"
            className="input textarea textarea--resizable"
            rows={4}
            value={draft.description}
            placeholder="자세 방법, 주의할 점, 선생님의 팁 등"
            onChange={(e) => setField('description', e.target.value)}
            aria-invalid={Boolean(errors.description)}
          />
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>

        {errors.submit && <p className="notice notice--error" role="alert">{errors.submit}</p>}

        <div className="form__actions">
          <button type="button" className="button" onClick={onCancel}>취소</button>
          <button type="submit" className="button button--primary button--grow" disabled={saving}>
            {saving ? '저장 중…' : editing ? '수정 완료' : '사전에 추가'}
          </button>
        </div>
      </form>
    </section>
  );
}
