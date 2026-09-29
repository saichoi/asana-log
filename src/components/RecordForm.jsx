import { useEffect, useRef, useState } from 'react';
import { MAX_LESSON_LENGTH, MAX_TEXT_LENGTH, TEXT_FIELDS, validateDraft } from '../models/record.js';
import { todayString } from '../utils/date.js';
import AsanaPicker from './AsanaPicker.jsx';
import SortableAsanaList from './SortableAsanaList.jsx';
import AutoTextarea from './AutoTextarea.jsx';
import MarkdownEditor from './MarkdownEditor.jsx';
import { BackIcon, PlusIcon } from './Icons.jsx';

/**
 * 기록 작성 / 수정 폼
 * - initialDraft: 처음 채워 둘 값
 * - isEdit: 수정 모드 여부 (제목, 버튼 문구만 달라진다)
 */
export default function RecordForm({ initialDraft, isEdit, onSubmit, onCancel, onDirtyChange, lessonSuggestions = [] }) {
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);
  useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange]);

  const setField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    // 사용자가 고치기 시작하면 해당 에러와 폼 전체 에러는 지운다.
    if (errors[key] || errors.form) setErrors(({ [key]: _, form: __, ...rest }) => rest);
  };

  const removeAsana = (id) => setField('asanaIds', draft.asanaIds.filter((a) => a !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // 첫 번째 에러 위치로 스크롤
      requestAnimationFrame(() =>
        formRef.current?.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
      return;
    }
    setSaving(true);
    try {
      await onSubmit(draft);
    } catch (err) {
      setErrors({ submit: err.message });
      setSaving(false);
    }
  };

  return (
    <section className="page">
      {isEdit && (
        <div className="topbar">
          <button type="button" className="icon-button" aria-label="수정 취소" onClick={onCancel}>
            <BackIcon />
          </button>
        </div>
      )}
      <header className="page__header">
        <p className="page__eyebrow">{isEdit ? 'Edit' : 'Today\'s Practice'}</p>
        <h1 className="page__title">{isEdit ? '기록 수정' : '오늘의 수련'}</h1>
      </header>

      <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="date">날짜</label>
          <input
            id="date"
            type="date"
            className="input"
            value={draft.date}
            max={todayString()}
            onChange={(e) => setField('date', e.target.value)}
            aria-invalid={Boolean(errors.date)}
          />
          {errors.date && <p className="field-error">{errors.date}</p>}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="lesson">
            수업 이름 <span className="field__optional">선택</span>
          </label>
          <input
            id="lesson"
            className="input"
            value={draft.lesson}
            placeholder="예) 새벽요가(빈야샤)"
            maxLength={MAX_LESSON_LENGTH + 10}
            autoComplete="off"
            enterKeyHint="done"
            onChange={(e) => setField('lesson', e.target.value)}
            aria-invalid={Boolean(errors.lesson)}
          />
          {lessonSuggestions.length > 0 && (
            <div className="chip-group chip-group--suggest" aria-label="전에 입력한 수업">
              {lessonSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`chip chip--small${draft.lesson.trim() === name ? ' is-active' : ''}`}
                  aria-pressed={draft.lesson.trim() === name}
                  onClick={() => setField('lesson', draft.lesson.trim() === name ? '' : name)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          {errors.lesson && <p className="field-error">{errors.lesson}</p>}
        </div>

        <div className="field">
          <span className="field__label">
            오늘의 아사나
            {draft.asanaIds.length > 1 && <span className="field__optional">⋮⋮ 를 끌어서 수업 순서대로 정렬</span>}
          </span>
          {draft.asanaIds.length > 0 && (
            <SortableAsanaList
              ids={draft.asanaIds}
              onChange={(ids) => setField('asanaIds', ids)}
              onRemove={removeAsana}
            />
          )}
          <button type="button" className="button button--dashed button--block" onClick={() => setPickerOpen(true)}>
            <PlusIcon width={18} height={18} />
            {draft.asanaIds.length > 0 ? '아사나 추가·변경' : '아사나 선택하기'}
          </button>
        </div>

        {TEXT_FIELDS.map(({ key, label, placeholder, markdown }) => {
          const length = draft[key].length;
          return (
            <div key={key} className="field">
              <label className="field__label" htmlFor={key}>{label}</label>
              {markdown ? (
                <MarkdownEditor
                  id={key}
                  value={draft[key]}
                  placeholder={placeholder}
                  onChange={(value) => setField(key, value)}
                  invalid={Boolean(errors[key])}
                />
              ) : (
                <AutoTextarea
                  id={key}
                  className="input textarea"
                  value={draft[key]}
                  placeholder={placeholder}
                  onChange={(e) => setField(key, e.target.value)}
                  aria-invalid={Boolean(errors[key])}
                />
              )}
              {length > MAX_TEXT_LENGTH * 0.8 && (
                <p className={`field__count${length > MAX_TEXT_LENGTH ? ' is-over' : ''}`}>
                  {length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
                </p>
              )}
              {errors[key] && <p className="field-error">{errors[key]}</p>}
            </div>
          );
        })}

        {errors.form && <p className="field-error field-error--form">{errors.form}</p>}
        {errors.submit && <p className="notice notice--error" role="alert">{errors.submit}</p>}

        <div className="form__actions">
          {isEdit && <button type="button" className="button" onClick={onCancel}>취소</button>}
          <button type="submit" className="button button--primary button--grow" disabled={saving}>
            {saving ? '저장 중…' : isEdit ? '수정 완료' : '기록 저장'}
          </button>
        </div>
      </form>

      {pickerOpen && (
        <AsanaPicker
          selectedIds={draft.asanaIds}
          onClose={() => setPickerOpen(false)}
          onConfirm={(ids) => {
            setField('asanaIds', ids);
            setPickerOpen(false);
          }}
        />
      )}
    </section>
  );
}
