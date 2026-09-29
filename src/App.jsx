import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRecords } from './hooks/useRecords.js';
import { useAsanas } from './context/AsanaContext.jsx';
import { createEmptyDraft, recentLessons } from './models/record.js';
import { currentMonth } from './utils/date.js';
import BottomNav from './components/BottomNav.jsx';
import RecordList from './components/RecordList.jsx';
import RecordDetail from './components/RecordDetail.jsx';
import RecordForm from './components/RecordForm.jsx';
import AsanaDictionary from './components/AsanaDictionary.jsx';
import AsanaDetail from './components/AsanaDetail.jsx';
import AsanaForm from './components/AsanaForm.jsx';

const LEAVE_MESSAGE = '작성 중인 내용이 저장되지 않았어요. 이동할까요?';

/**
 * 화면 위치(route)
 * - tab:       'list' | 'write' | 'dictionary'
 * - detailId:  기록 탭에서 보고 있는 기록
 * - editingId: 작성 탭에서 수정 중인 기록
 * - asanaId:   사전 탭에서 보고 있는 아사나
 * - asanaForm: 사전 탭의 아사나 폼 ('new' 또는 수정할 아사나 id)
 * - from:      뒤로 가기를 눌렀을 때 돌아갈 화면
 */
const HOME = { tab: 'list' };

export default function App() {
  const { records, loading, error, create, update, remove } = useRecords();
  const { removeAsana } = useAsanas();

  const [route, setRoute] = useState(HOME);
  const [listMonth, setListMonth] = useState(currentMonth); // 기록 목록에서 보고 있는 달
  const [formNonce, setFormNonce] = useState(0); // 새 기록 폼을 초기화할 때 증가
  const [toast, setToast] = useState('');
  const dirtyRef = useRef(false);

  const handleDirtyChange = useCallback((dirty) => {
    dirtyRef.current = dirty;
  }, []);

  // 작성 중에 새로고침하거나 창을 닫으려 하면 브라우저 확인창 띄우기
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  /** 화면 이동 공통 처리: 작성 중인 내용이 있으면 먼저 확인 */
  const go = (next) => {
    if (dirtyRef.current && !window.confirm(LEAVE_MESSAGE)) return false;
    dirtyRef.current = false;
    setRoute(next);
    if (next.tab === 'write' && !next.editingId) setFormNonce((n) => n + 1);
    window.scrollTo(0, 0);
    return true;
  };
  const back = (fallback) => go(route.from ?? fallback);

  const handleTabChange = (tab) => {
    // 이미 새 기록 작성 화면이면 다시 눌러도 입력 내용을 지우지 않는다.
    if (tab === 'write' && route.tab === 'write' && !route.editingId) return;
    go({ tab });
  };

  const openRecord = (id) => go({ tab: 'list', detailId: id, from: route });
  const openAsana = (id) => go({ tab: 'dictionary', asanaId: id, from: route });

  const editingRecord = useMemo(
    () => records.find((r) => r.id === route.editingId) ?? null,
    [records, route.editingId],
  );
  const initialDraft = useMemo(() => {
    if (!editingRecord) return createEmptyDraft();
    const { date, lesson = '', asanaIds, content, challenge, change, memo } = editingRecord;
    return { date, lesson, asanaIds, content, challenge, change, memo };
    // formNonce 가 바뀌면 오늘 날짜로 새 초안을 만든다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingRecord, formNonce]);

  const lessonSuggestions = useMemo(() => recentLessons(records), [records]);

  const handleRecordSubmit = async (draft) => {
    const { editingId } = route;
    if (editingId) await update(editingId, draft);
    else await create(draft);
    setListMonth(draft.date.slice(0, 7)); // 저장한 기록이 있는 달을 보여 준다
    dirtyRef.current = false;
    go(editingId ? { tab: 'list', detailId: editingId } : HOME);
    setToast(editingId ? '기록을 수정했어요' : '오늘의 수련을 기록했어요');
  };

  // 상세 화면에서 아사나 순서만 바꿔 바로 저장
  const handleRecordReorder = async (id, asanaIds) => {
    const record = records.find((r) => r.id === id);
    if (record) await update(id, { ...record, asanaIds });
  };

  const handleRecordDelete = async (id) => {
    await remove(id);
    go(HOME);
    setToast('기록을 삭제했어요');
  };

  const handleAsanaSaved = (id, wasEdit) => {
    dirtyRef.current = false;
    go(wasEdit && route.from ? route.from : { tab: 'dictionary', asanaId: id });
    setToast(wasEdit ? '자세를 수정했어요' : '사전에 새 자세를 추가했어요');
  };

  const handleAsanaDelete = async (id) => {
    await removeAsana(id);
    go({ tab: 'dictionary' });
    setToast('자세를 삭제했어요');
  };

  let screen;
  if (route.tab === 'write') {
    screen = (
      <RecordForm
        key={route.editingId ?? `new-${formNonce}`}
        initialDraft={initialDraft}
        isEdit={Boolean(route.editingId)}
        onSubmit={handleRecordSubmit}
        onCancel={() => go({ tab: 'list', detailId: route.editingId })}
        onDirtyChange={handleDirtyChange}
        lessonSuggestions={lessonSuggestions}
      />
    );
  } else if (route.tab === 'dictionary') {
    if (route.asanaForm) {
      screen = (
        <AsanaForm
          key={route.asanaForm}
          asanaId={route.asanaForm === 'new' ? null : route.asanaForm}
          onSaved={handleAsanaSaved}
          onCancel={() => back({ tab: 'dictionary' })}
          onDirtyChange={handleDirtyChange}
        />
      );
    } else if (route.asanaId) {
      screen = (
        <AsanaDetail
          asanaId={route.asanaId}
          records={records}
          onBack={() => back({ tab: 'dictionary' })}
          onEdit={(id) => go({ tab: 'dictionary', asanaForm: id, from: route })}
          onDelete={handleAsanaDelete}
          onOpenRecord={openRecord}
        />
      );
    } else {
      screen = (
        <AsanaDictionary
          onOpen={openAsana}
          onAdd={() => go({ tab: 'dictionary', asanaForm: 'new', from: route })}
        />
      );
    }
  } else if (route.detailId) {
    screen = (
      <RecordDetail
        record={records.find((r) => r.id === route.detailId) ?? null}
        onBack={() => back(HOME)}
        onEdit={(id) => go({ tab: 'write', editingId: id })}
        onDelete={handleRecordDelete}
        onOpenAsana={openAsana}
        onReorder={handleRecordReorder}
      />
    );
  } else {
    screen = (
      <RecordList
        records={records}
        loading={loading}
        error={error}
        month={listMonth}
        onMonthChange={(month) => {
          setListMonth(month);
          window.scrollTo(0, 0);
        }}
        onOpen={openRecord}
        onWrite={() => go({ tab: 'write' })}
      />
    );
  }

  return (
    <div className="app">
      <main className="app__main">{screen}</main>
      {toast && <div className="toast" role="status">{toast}</div>}
      <BottomNav tab={route.tab} onChange={handleTabChange} />
    </div>
  );
}
