import { POSE_FIGURES } from '../data/poseFigures.js';
import { useAsanas } from '../context/AsanaContext.jsx';
import { LeafIcon } from './Icons.jsx';

const toPoints = (flat) => flat.reduce((acc, n, i) => acc + (i % 2 ? `,${n}` : `${i ? ' ' : ''}${n}`), '');

/** 선 일러스트 그리기 (src/data/poseFigures.js 데이터 사용) */
function Figure({ figure, title }) {
  return (
    <svg className="figure" viewBox="0 0 100 100" role="img" aria-label={title}>
      {figure.ground !== false && <line className="figure__ground" x1="6" y1="91" x2="94" y2="91" />}
      {figure.props?.map((prop, i) => <polyline key={`p${i}`} className="figure__prop" points={toPoints(prop)} />)}
      {figure.lines.map((line, i) => <polyline key={i} className="figure__line" points={toPoints(line)} />)}
      <circle className="figure__head" cx={figure.head[0]} cy={figure.head[1]} r="5.5" />
    </svg>
  );
}

/**
 * 아사나 이미지: 올린 사진 → 선 일러스트 → 기본 아이콘 순서로 보여 준다.
 * size: 'sm'(목록 썸네일) | 'lg'(상세 화면)
 */
export default function AsanaFigure({ asana, size = 'sm', photo }) {
  const { images } = useAsanas();
  const src = photo !== undefined ? photo : images[asana?.id];
  const figure = POSE_FIGURES[asana?.id];
  const title = asana ? `${asana.ko} 자세` : '자세';

  return (
    <span className={`asana-figure asana-figure--${size}`}>
      {src ? (
        <img className="asana-figure__photo" src={src} alt={title} />
      ) : figure ? (
        <Figure figure={figure} title={title} />
      ) : (
        <span className="asana-figure__placeholder" aria-label={`${title} 이미지 없음`}>
          <LeafIcon />
        </span>
      )}
    </span>
  );
}
