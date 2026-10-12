/**
 * 아사나 목록 (Asana Log의 아사나 사전 데이터)
 * ------------------------------------------------------------
 * ✏️ 새 자세를 추가하는 방법
 *
 * 1. 아래 ASANAS 배열의 원하는 위치에 한 줄을 복사해서 붙여 넣으세요.
 * 2. 각 항목을 채워 주세요.
 *
 *    {
 *      id: 'side-plank',            // 고유 이름. 영어 소문자와 하이픈(-)만 사용, 다른 자세와 겹치면 안 돼요.
 *      ko: '사이드 플랭크',           // 한국어 이름
 *      en: 'Side Plank',             // 영어 이름
 *      sa: 'Vasisthasana',           // 산스크리트어 이름
 *      category: '균형',              // 아래 CATEGORIES 중 하나
 *      aliases: ['측면 플랭크'],       // (선택) 검색에 쓰일 다른 이름들. 없으면 이 줄은 지워도 돼요.
 *    },
 *
 * 3. 저장하면 기록 작성 화면과 아사나 사전에 바로 나타납니다.
 * 4. (선택) 선 일러스트를 넣고 싶다면 src/data/poseFigures.js 에 같은 id로 그림을 추가하세요.
 *    그림이 없으면 기본 아이콘이 보이고, 앱의 아사나 상세 화면에서 사진을 올릴 수도 있어요.
 *
 * 💡 코드를 고치지 않고 앱의 [아사나 사전 → 새 자세 추가] 버튼으로 추가할 수도 있어요.
 *    (그렇게 추가한 자세는 이 파일이 아니라 브라우저에 저장됩니다.)
 *
 * ⚠️ 주의
 * - 이미 기록에 사용한 자세의 `id`는 바꾸지 마세요. 기록에는 id만 저장되기 때문에
 *   id를 바꾸면 예전 기록에서 그 자세 이름이 보이지 않게 돼요.
 *   (ko / en / sa 이름은 언제든 자유롭게 고쳐도 괜찮아요.)
 * - 문자열 안에 작은따옴표(')가 들어가면 앞에 역슬래시를 붙여 주세요. 예: 'Child\'s Pose'
 * ------------------------------------------------------------
 */

/** 카테고리 목록 — 사전에서 보이는 순서이기도 해요. 새 카테고리가 필요하면 여기에 추가하세요. */
export const CATEGORIES = ['기본', '서기', '균형', '앉기', '후굴', '비틀기', '역자세', '휴식'];

export const ASANAS = [
  // ── 기본 ─────────────────────────────
  { id: 'downward-dog', ko: '다운독', en: 'Downward-Facing Dog', sa: 'Adho Mukha Svanasana', category: '기본', aliases: ['아래를 향한 개 자세', '견상 자세'] },
  { id: 'plank', ko: '플랭크 자세', en: 'Plank Pose', sa: 'Phalakasana', category: '기본', aliases: ['판자 자세'] },
  { id: 'chaturanga', ko: '차투랑가', en: 'Four-Limbed Staff Pose', sa: 'Chaturanga Dandasana', category: '기본' },
  { id: 'cat-cow', ko: '고양이-소 자세', en: 'Cat-Cow Pose', sa: 'Marjaryasana-Bitilasana', category: '기본', aliases: ['캣카우'] },
  { id: 'tabletop', ko: '테이블 자세', en: 'Tabletop Pose', sa: 'Bharmanasana', category: '기본', aliases: ['네발 기기 자세', '테이블탑'] },
  { id: 'three-legged-dog', ko: '세 다리 다운독', en: 'Three-Legged Downward Dog', sa: 'Eka Pada Adho Mukha Svanasana', category: '기본', aliases: ['한 다리 다운독', '쓰리 레그 독'] },
  { id: 'dolphin', ko: '돌고래 자세', en: 'Dolphin Pose', sa: 'Ardha Pincha Mayurasana', category: '기본' },

  // ── 서기 ─────────────────────────────
  { id: 'mountain', ko: '산 자세', en: 'Mountain Pose', sa: 'Tadasana', category: '서기' },
  { id: 'warrior-1', ko: '전사 1번 자세', en: 'Warrior I', sa: 'Virabhadrasana I', category: '서기', aliases: ['Warrior 1'] },
  { id: 'warrior-2', ko: '전사 2번 자세', en: 'Warrior II', sa: 'Virabhadrasana II', category: '서기', aliases: ['Warrior 2'] },
  { id: 'triangle', ko: '삼각 자세', en: 'Triangle Pose', sa: 'Trikonasana', category: '서기' },
  { id: 'extended-side-angle', ko: '측면 확장 자세', en: 'Extended Side Angle Pose', sa: 'Utthita Parsvakonasana', category: '서기' },
  { id: 'chair', ko: '의자 자세', en: 'Chair Pose', sa: 'Utkatasana', category: '서기' },
  { id: 'standing-forward-bend', ko: '선 전굴 자세', en: 'Standing Forward Bend', sa: 'Uttanasana', category: '서기' },
  { id: 'low-lunge', ko: '로우 런지', en: 'Low Lunge', sa: 'Anjaneyasana', category: '서기', aliases: ['초승달 자세'] },
  { id: 'garland', ko: '말라아사나', en: 'Garland Pose', sa: 'Malasana', category: '서기', aliases: ['화환 자세', '스쿼트'] },
  { id: 'half-forward-bend', ko: '반 전굴 자세', en: 'Half Standing Forward Bend', sa: 'Ardha Uttanasana', category: '서기', aliases: ['아르다 우타나아사나'] },
  { id: 'high-lunge', ko: '하이 런지', en: 'High Lunge', sa: 'Utthita Ashwa Sanchalanasana', category: '서기', aliases: ['크레센트 런지', 'Crescent Lunge'] },
  { id: 'reverse-warrior', ko: '리버스 워리어', en: 'Reverse Warrior', sa: 'Viparita Virabhadrasana', category: '서기', aliases: ['뒤집은 전사 자세', '평화로운 전사 자세'] },
  { id: 'pyramid', ko: '피라미드 자세', en: 'Pyramid Pose', sa: 'Parsvottanasana', category: '서기' },
  { id: 'wide-legged-forward-bend', ko: '다리 벌린 선 전굴 자세', en: 'Wide-Legged Forward Bend', sa: 'Prasarita Padottanasana', category: '서기', aliases: ['와이드 레그 전굴'] },
  { id: 'goddess', ko: '여신 자세', en: 'Goddess Pose', sa: 'Utkata Konasana', category: '서기' },

  // ── 균형 ─────────────────────────────
  { id: 'tree', ko: '나무 자세', en: 'Tree Pose', sa: 'Vrksasana', category: '균형' },
  { id: 'warrior-3', ko: '전사 3번 자세', en: 'Warrior III', sa: 'Virabhadrasana III', category: '균형', aliases: ['Warrior 3'] },
  { id: 'eagle', ko: '독수리 자세', en: 'Eagle Pose', sa: 'Garudasana', category: '균형' },
  { id: 'half-moon', ko: '반달 자세', en: 'Half Moon Pose', sa: 'Ardha Chandrasana', category: '균형' },
  { id: 'dancer', ko: '무희 자세', en: 'Dancer Pose', sa: 'Natarajasana', category: '균형' },
  { id: 'crow', ko: '까마귀 자세', en: 'Crow Pose', sa: 'Bakasana', category: '균형', aliases: ['학 자세'] },
  { id: 'side-plank', ko: '사이드 플랭크', en: 'Side Plank', sa: 'Vasisthasana', category: '균형', aliases: ['측면 플랭크', '옆 판자 자세'] },
  { id: 'extended-hand-to-big-toe', ko: '선 엄지발가락 잡기 자세', en: 'Extended Hand-to-Big-Toe Pose', sa: 'Utthita Hasta Padangusthasana', category: '균형' },
  { id: 'standing-split', ko: '스탠딩 스플릿', en: 'Standing Split', sa: 'Urdhva Prasarita Eka Padasana', category: '균형', aliases: ['선 다리 찢기'] },

  // ── 앉기 ─────────────────────────────
  { id: 'easy-pose', ko: '편안한 자세', en: 'Easy Pose', sa: 'Sukhasana', category: '앉기', aliases: ['책상다리'] },
  { id: 'lotus', ko: '연꽃 자세', en: 'Lotus Pose', sa: 'Padmasana', category: '앉기', aliases: ['결가부좌'] },
  { id: 'seated-forward-bend', ko: '앉은 전굴 자세', en: 'Seated Forward Bend', sa: 'Paschimottanasana', category: '앉기' },
  { id: 'bound-angle', ko: '나비 자세', en: 'Bound Angle Pose', sa: 'Baddha Konasana', category: '앉기' },
  { id: 'boat', ko: '보트 자세', en: 'Boat Pose', sa: 'Navasana', category: '앉기' },
  { id: 'pigeon', ko: '비둘기 자세', en: 'Pigeon Pose', sa: 'Kapotasana', category: '앉기' },
  { id: 'staff', ko: '막대 자세', en: 'Staff Pose', sa: 'Dandasana', category: '앉기', aliases: ['단다아사나'] },
  { id: 'hero', ko: '영웅 자세', en: 'Hero Pose', sa: 'Virasana', category: '앉기' },
  { id: 'thunderbolt', ko: '금강 자세', en: 'Thunderbolt Pose', sa: 'Vajrasana', category: '앉기', aliases: ['번개 자세', '무릎 꿇고 앉기'] },
  { id: 'head-to-knee', ko: '머리 무릎 자세', en: 'Head-to-Knee Forward Bend', sa: 'Janu Sirsasana', category: '앉기' },
  { id: 'wide-angle-seated-forward-bend', ko: '박쥐 자세', en: 'Wide-Angle Seated Forward Bend', sa: 'Upavistha Konasana', category: '앉기', aliases: ['다리 벌린 앉은 전굴'] },
  { id: 'cow-face', ko: '소머리 자세', en: 'Cow Face Pose', sa: 'Gomukhasana', category: '앉기', aliases: ['소 얼굴 자세'] },
  { id: 'half-splits', ko: '반 원숭이 자세', en: 'Half Splits', sa: 'Ardha Hanumanasana', category: '앉기', aliases: ['하프 스플릿'] },
  { id: 'splits', ko: '원숭이 자세', en: 'Monkey Pose', sa: 'Hanumanasana', category: '앉기', aliases: ['앞뒤 다리 찢기', '스플릿', 'Splits'] },

  // ── 후굴 ─────────────────────────────
  { id: 'cobra', ko: '코브라 자세', en: 'Cobra Pose', sa: 'Bhujangasana', category: '후굴' },
  { id: 'upward-dog', ko: '업독', en: 'Upward-Facing Dog', sa: 'Urdhva Mukha Svanasana', category: '후굴', aliases: ['위를 향한 개 자세'] },
  { id: 'locust', ko: '메뚜기 자세', en: 'Locust Pose', sa: 'Salabhasana', category: '후굴' },
  { id: 'bow', ko: '활 자세', en: 'Bow Pose', sa: 'Dhanurasana', category: '후굴' },
  { id: 'camel', ko: '낙타 자세', en: 'Camel Pose', sa: 'Ustrasana', category: '후굴' },
  { id: 'bridge', ko: '브릿지 자세', en: 'Bridge Pose', sa: 'Setu Bandha Sarvangasana', category: '후굴', aliases: ['다리 자세'] },
  { id: 'wheel', ko: '바퀴 자세', en: 'Wheel Pose', sa: 'Urdhva Dhanurasana', category: '후굴', aliases: ['휠'] },
  { id: 'fish', ko: '물고기 자세', en: 'Fish Pose', sa: 'Matsyasana', category: '후굴' },
  { id: 'sphinx', ko: '스핑크스 자세', en: 'Sphinx Pose', sa: 'Salamba Bhujangasana', category: '후굴' },

  // ── 비틀기 ───────────────────────────
  { id: 'half-lord-of-fishes', ko: '반 비틀기 자세', en: 'Half Lord of the Fishes', sa: 'Ardha Matsyendrasana', category: '비틀기', aliases: ['앉은 비틀기'] },
  { id: 'supine-twist', ko: '누운 비틀기 자세', en: 'Supine Spinal Twist', sa: 'Supta Matsyendrasana', category: '비틀기' },
  { id: 'revolved-chair', ko: '비튼 의자 자세', en: 'Revolved Chair Pose', sa: 'Parivrtta Utkatasana', category: '비틀기' },
  { id: 'revolved-triangle', ko: '비튼 삼각 자세', en: 'Revolved Triangle Pose', sa: 'Parivrtta Trikonasana', category: '비틀기' },
  { id: 'thread-the-needle', ko: '바늘 꿰기 자세', en: 'Thread the Needle', sa: 'Parsva Balasana', category: '비틀기', aliases: ['실 꿰기 자세'] },

  // ── 역자세 ───────────────────────────
  { id: 'headstand', ko: '머리서기', en: 'Headstand', sa: 'Sirsasana', category: '역자세' },
  { id: 'shoulder-stand', ko: '어깨서기', en: 'Shoulder Stand', sa: 'Salamba Sarvangasana', category: '역자세' },
  { id: 'plow', ko: '쟁기 자세', en: 'Plow Pose', sa: 'Halasana', category: '역자세' },
  { id: 'handstand', ko: '핸드스탠드', en: 'Handstand', sa: 'Adho Mukha Vrksasana', category: '역자세', aliases: ['물구나무서기'] },
  { id: 'forearm-stand', ko: '팔꿈치 서기', en: 'Forearm Stand', sa: 'Pincha Mayurasana', category: '역자세', aliases: ['핀차 마유라아사나', '공작 깃털 자세'] },

  // ── 휴식 ─────────────────────────────
  { id: 'child', ko: '아기 자세', en: 'Child\'s Pose', sa: 'Balasana', category: '휴식' },
  { id: 'happy-baby', ko: '해피 베이비 자세', en: 'Happy Baby Pose', sa: 'Ananda Balasana', category: '휴식' },
  { id: 'legs-up-the-wall', ko: '벽에 다리 올리기', en: 'Legs-Up-the-Wall Pose', sa: 'Viparita Karani', category: '휴식' },
  { id: 'puppy', ko: '강아지 자세', en: 'Extended Puppy Pose', sa: 'Uttana Shishosana', category: '휴식', aliases: ['퍼피 자세'] },
  { id: 'reclined-bound-angle', ko: '누운 나비 자세', en: 'Reclining Bound Angle Pose', sa: 'Supta Baddha Konasana', category: '휴식' },
  { id: 'knees-to-chest', ko: '무릎 당기기 자세', en: 'Knees-to-Chest Pose', sa: 'Apanasana', category: '휴식', aliases: ['바람 빼기 자세'] },
  { id: 'corpse', ko: '송장 자세', en: 'Corpse Pose', sa: 'Savasana', category: '휴식', aliases: ['사바아사나'] },
];
