const ASSETS = 'assets/';
const OUTFITS = [
  { id: 'sport', name: '运动套装', group: '运动', color: 'peach', description: '瑞昂的经典红白运动装。' },
  { id: 'running', name: '跑步服', group: '运动', color: 'blue', price: 220, description: '蓝白跑步上衣配号码布。' },
  { id: 'badminton', name: '羽毛球服', group: '运动', color: 'blue', price: 260, description: '蓝白球衣，搭配羽毛球拍。' },
  { id: 'basketball', name: '篮球服', group: '运动', color: 'peach', price: 320, description: '红色球衣，背上是 23 号。' },
  { id: 'football', name: '足球服', group: '运动', color: 'blue', price: 300, description: '10 号球衣搭配藏青球裤。' },
  { id: 'yoga', name: '瑜伽服', group: '运动', color: 'lilac', price: 240, description: '浅紫色背心与九分裤。' },
  { id: 'tang', name: '唐装套装', group: '传统', color: 'gold', price: 480, level: 8, description: '立领盘扣，背面绣有金色福纹。' },
  { id: 'hanfu', name: '传统服装', group: '传统', color: 'peach', price: 420, description: '交领上衣、马面裙和青绿腰坠。' },
  { id: 'casual', name: '休闲套装', group: '休闲', color: 'mint', price: 280, description: '醒狮刺绣连帽衫配工装裤。' },
  { id: 'festive', name: '新年喜庆套装', group: '节日', color: 'gold', price: 560, level: 10, description: '红色滚边棉袄，金色祥云纹。' },
];

const PROPS = [
  { id: 'fruit', name: '能量果', group: '道具', color: 'peach', icon: 'fruit', price: 80, consumable: true, description: '在背包使用后获得 40 经验。' },
  { id: 'bottle', name: '补给水壶', group: '道具', color: 'mint', icon: 'bottle', price: 120, description: '青绿色醒狮运动水壶。' },
  { id: 'bell', name: '金色铃铛', group: '道具', color: 'gold', icon: 'bell', level: 8, price: 180, consumable: true, description: '在背包使用后获得 120 经验。' },
  { id: 'headband', name: '醒狮发带', group: '配饰', color: 'peach', icon: 'ribbon', price: 160, wearable: true, description: '红色运动发带，缀有醒狮图案。' },
  { id: 'wristband', name: '运动护腕', group: '配饰', color: 'blue', icon: 'shield', price: 120, wearable: true, description: '白底红条护腕。' },
  { id: 'ribbon', name: '荣誉绶带', group: '配饰', color: 'gold', icon: 'award', level: 6, price: 210, wearable: true, description: '带有金色织边的红绶带。' },
  { id: 'gift', name: '醒狮补给礼盒', group: '礼盒', color: 'peach', icon: 'gift', price: 180, consumable: true, description: '打开获得 2 颗能量果和 30 训练币。' },
];

const CATALOG = [
  ...OUTFITS.map(outfit => ({ ...outfit, group: '服装', outfit: true })),
  ...PROPS,
];

const MASCOT_VIEWS = [
  { id: 'lion', name: 'Q 版醒狮', description: '养成、换装与陪伴', image: 'ruiang-face.png' },
  { id: 'animation', name: '瑞昂骑行', description: '原始素材中的骑行形象', image: 'ruiang-bike.png' },
];

const COACH_NAMES = { male: '写实男教练', female: '写实女教练' };

const MOVES = {
  march: {
    name: '原地踏步', front: ['m5'], side: ['m6'],
    steps: ['抬头站直，双臂随踏步自然摆动。', '交替抬膝，脚掌轻落地。'],
  },
  squat: {
    name: '徒手深蹲', front: ['m1', 'm2', 'm1'], side: ['m3', 'm4', 'm3'],
    steps: ['双脚约与肩同宽，脚尖略向外。', '屈髋屈膝下蹲，膝盖与脚尖同向。', '脚掌踩实，平稳起身回到站姿。'],
  },
  pushup: {
    name: '俯卧撑', front: ['f3', 'f4', 'f3'], side: ['f1', 'f2', 'f1'],
    steps: ['双手撑地，肩、髋与脚踝保持一条线。', '屈肘控制下放，肩膀远离耳朵。', '推地回到起始位，腰背保持稳定。'],
  },
  dog: {
    name: '下犬式', side: ['f5', 'f6'],
    steps: ['四点跪姿，双手与肩大致同宽。', '推地抬髋，让背部伸展，保持自然呼吸。'],
  },
  neck: {
    name: '颈侧舒展', front: ['f7'],
    steps: ['自然站立，双肩放松。', '头轻轻侧倾，保持呼吸，再换另一侧。'],
  },
  shoulder: {
    name: '肩背伸展', side: ['f8'],
    steps: ['双手交握向前推，松开双肩。', '在舒适范围内伸展上背，保持缓慢呼吸。'],
  },
  shot: {
    name: '投篮起手', front: ['m7'], side: ['m8'],
    steps: ['屈膝稳住重心，双手在胸前持球。', '托球手肘放在球下方，目光看向篮筐。'],
  },
};

const COURSES = [
  {
    id: 'wake', name: '全身唤醒训练', group: '居家', color: 'peach', icon: 'bolt',
    difficulty: '初级', equipment: '无器械', cover: 'coach-m5.jpg', coach: 'male',
    description: '用原地踏步和基础深蹲活动全身，再做舒展收尾。',
    exercises: [['march', 45], ['squat', 45], ['march', 45, '第二组踏步'], ['squat', 45, '第二组深蹲'], ['shoulder', 30]],
  },
  {
    id: 'stretch', name: '肩颈舒展', group: '拉伸', color: 'mint', icon: 'leaf',
    difficulty: '初级', equipment: '瑜伽垫', cover: 'coach-f7.jpg', coach: 'female',
    description: '从肩颈到背部，放松久坐后紧张的肌肉。',
    exercises: [['neck', 40], ['shoulder', 40], ['dog', 45], ['shoulder', 35, '放松收尾']],
  },
  {
    id: 'strength', name: '自重力量入门', group: '力量', color: 'lilac', icon: 'dumbbell',
    difficulty: '中级', equipment: '瑜伽垫', cover: 'coach-m4.jpg', coach: 'male',
    description: '以深蹲和俯卧撑练习下肢与上肢力量。',
    exercises: [['march', 45], ['squat', 45], ['pushup', 30], ['squat', 45, '第二组深蹲'], ['pushup', 30, '第二组俯卧撑'], ['shoulder', 30]],
  },
  {
    id: 'hiit', name: '节奏间歇 HIIT', group: 'HIIT', color: 'gold', icon: 'flame',
    difficulty: '中级', equipment: '无器械', cover: 'coach-m6.jpg', coach: 'male',
    description: '在踏步与深蹲之间切换，跟着节拍完成间歇练习。',
    exercises: [['march', 30], ['squat', 30], ['march', 30, '第二组快踏步'], ['squat', 30, '第二组深蹲'], ['march', 30, '放慢踏步'], ['shoulder', 30]],
  },
  {
    id: 'shoot', name: '投篮基本功', group: '力量', color: 'blue', icon: 'ball',
    difficulty: '初级', equipment: '篮球', cover: 'coach-m7.jpg', coach: 'male',
    description: '从站姿到持球，跟着教练练习投篮起手。',
    exercises: [['squat', 40, '屈膝预备'], ['shot', 45], ['shot', 45, '重复起手练习'], ['shoulder', 30]],
  },
];

const STAGES = [
  { level: 1, name: '幼狮期', icon: 'lion', color: 'blue' },
  { level: 5, name: '少年期', icon: 'bolt', color: 'peach' },
  { level: 8, name: '战士期', icon: 'shield', color: 'mint' },
  { level: 12, name: '冠军期', icon: 'award', color: 'rose' },
  { level: 16, name: '传奇期', icon: 'spark', color: 'gold' },
];

const LEVELS = [0, 250, 500, 750, 1_000, 2_000, 2_400, 2_900, 3_500, 4_200, 5_000, 6_000, 7_000, 8_500, 10_000, 12_000];
const REST_SECONDS = 30;

const BADGES = [
  { id: 'first', name: '首次运动', icon: 'activity', color: 'gold', rule: '完成第 1 次训练', progress: () => state.history.length, target: 1 },
  { id: 'week', name: '连续 7 天', icon: 'flame', color: 'rose', rule: '连续打卡满 7 天', progress: () => longestStreak(), target: 7 },
  { id: 'strength', name: '力量达人', icon: 'dumbbell', color: 'mint', rule: '完成 3 次力量课程', progress: () => historyCount('力量'), target: 3 },
  { id: 'lion', name: '醒狮勇者', icon: 'lion', color: 'rose', rule: '成长等级达到 Lv.5', progress: () => levelInfo().level, target: 5 },
  { id: 'rhythm', name: '节奏搭子', icon: 'bolt', color: 'gold', rule: '完成 2 次 HIIT 课程', progress: () => historyCount('HIIT'), target: 2 },
  { id: 'stretch', name: '舒展达人', icon: 'leaf', color: 'mint', rule: '完成 3 次拉伸课程', progress: () => historyCount('拉伸'), target: 3 },
  { id: 'goal', name: '如期而动', icon: 'target', color: 'blue', rule: '本周完成当前训练目标', progress: () => weekTrainingDays(today()), target: () => state.goal },
  { id: 'outfits', name: '百变醒狮', icon: 'shirt', color: 'lilac', rule: '拥有 5 套服装', progress: () => state.owned.length, target: 5 },
  { id: 'exchange', name: '初次兑换', icon: 'bag', color: 'peach', rule: '在道具商城完成一次兑换', progress: () => state.exchanges, target: 1 },
  { id: 'twoWeeks', name: '坚持两周', icon: 'calendar', color: 'gold', rule: '连续打卡满 14 天', progress: () => longestStreak(), target: 14 },
  { id: 'warrior', name: '醒狮战士', icon: 'shield', color: 'mint', rule: '成长等级达到 Lv.8', progress: () => levelInfo().level, target: 8 },
  { id: 'regular', name: '运动常客', icon: 'award', color: 'rose', rule: '累计完成 20 次训练', progress: () => state.history.length, target: 20 },
];

const ICONS = {
  home: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-7h6v7"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
  triangle: '<path d="M9 5.9a.8.8 0 0 1 1.2-.7l9 5.4a1.6 1.6 0 0 1 0 2.8l-9 5.4a.8.8 0 0 1-1.2-.7z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M9 5v14M15 5v14" stroke-width="3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18m-13 5h3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1"/>',
  shirt: '<path d="M8 4 4 6l-2 5 4 2 2-2v9h8v-9l2 2 4-2-2-5-4-2a4 4 0 0 1-8 0Z"/>',
  bag: '<rect x="4" y="8" width="16" height="13" rx="3"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8 14-2 7 6-2 6 2-2-7m-4-8 .8 1.7 1.9.3-1.4 1.3.3 1.9L12 10.2l-1.6 1 .3-1.9L9.3 8l1.9-.3z"/>',
  flame: '<path d="M12 22c4.4 0 7-3.1 7-6.8 0-3.5-2.2-5.8-3.4-6.8-.3 2.1-1.5 2.5-1.5 2.5-1.3-2.6-.2-5.2-2.8-8.9-.4 3-1.6 4.7-3.4 6.8C6.3 10.7 5 12.8 5 15.6 5 19.2 8 22 12 22Z"/><path d="M12 22a3 3 0 0 1-2.8-3c0-1.5 1-2.9 2.8-4.4 1.7 1.6 2.8 3 2.8 4.4A3 3 0 0 1 12 22Z"/>',
  spark: '<path d="M12 2.5 14.3 9.7 21.5 12l-7.2 2.3-2.3 7.2-2.3-7.2L2.5 12l7.2-2.3z"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
  leaf: '<path d="M20 4c-9 0-15 2-15 9a6 6 0 0 0 6 6c7 0 9-6 9-15ZM4 20l10-10"/>',
  dumbbell: '<path d="M9 12h6M5 7v10a2 2 0 0 0 4 0V7a2 2 0 0 0-4 0Zm10 0v10a2 2 0 0 0 4 0V7a2 2 0 0 0-4 0ZM2 10v4m20-4v4"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  arrowLeft: '<path d="M20 12H5m6 6-6-6 6-6"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  chevronLeft: '<path d="m15 6-6 6 6 6"/>',
  upRight: '<path d="M6 18 18 6M6 6h12v12"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12m0-12L6 18"/>',
  rotate: '<path d="M20 8a8 8 0 0 0-13-3L3 9m0-5v5h5m-4 7a8 8 0 0 0 13 3l4-4m0 5v-5h-5"/>',
  switch: '<path d="M4 7h15l-4-4m5 14H5l4 4M20 7l-5 4M4 17l5-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  step: '<path d="M4 19h5v-5h5V9h6M4 5h6M4 9h3"/>',
  mirror: '<path d="M12 3v18M9 7 3 16h6V7Zm6 0 6 9h-6V7Z"/>',
  camera: '<rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 10 6-3v10l-6-3"/>',
  sound: '<path d="M3 9h4l5-4v14l-5-4H3zm13-1a5 5 0 0 1 0 8m2-11a9 9 0 0 1 0 14"/>',
  mute: '<path d="M3 9h4l5-4v14l-5-4H3zm13 0 5 6m0-6-5 6"/>',
  metronome: '<path d="M9 4h6l4 16H5zm3 11 5-9"/>',
  drop: '<path d="M12 3s-6 6.2-6 11a6 6 0 0 0 12 0c0-4.8-6-11-6-11Z"/>',
  box: '<path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3zM3 7.5 12 12l9-4.5M12 12v9M7.5 5.3l9 4.5"/>',
  activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  bell: '<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zm5 3a2 2 0 0 0 4 0"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="m10 3-1 3-2 1-3-1-2 4 2 2v1l-2 2 2 4 3-1 2 1 1 2h4l1-2 2-1 3 1 2-4-2-2v-1l2-2-2-4-3 1-2-1-1-3z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="m12 9 3 3-3 3-3-3z" fill="currentColor" stroke="none"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="m14 6 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15zm8 0h8"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3m4 0-1 15H6L5 6m5 4v7m4-7v7"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8m-7-4v12m0-12H9a2.5 2.5 0 1 1 2.6-2.8L12 8Zm0 0h3a2.5 2.5 0 1 0-2.6-2.8L12 8Z"/>',
  shield: '<path d="M12 22c-4-2-8-6-8-11V5l8-3 8 3v6c0 5-4 9-8 11Z"/><path d="m8 12 3 3 5-6"/>',
  fruit: '<path d="M12 8c-5-5-11 2-7 10 2 4 5 3 7 2 2 1 5 2 7-2 4-8-2-15-7-10Zm0 0c0-4 2-6 5-6v2c-1 2-3 2-5 2"/>',
  bottle: '<path d="M9 3h6v5l3 4v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8l3-4zm0 4h6m-9 6h12"/>',
  ribbon: '<path d="M9 3h6v7l4 11-7-4-7 4 4-11zM9 10h6"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8m0-12.8L5.6 18.4M3.5 9a11 11 0 0 1 11.5 11.5M9 3.5A11 11 0 0 1 20.5 15"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4.3 2.7c-.9.4-1.3 1-1.3 2.3m0 3h.01"/>',
  lion: '<path d="M4.5 11C1 8 4 4 8 5c2-3 6-3 8 0 4-1 7 3 3.5 6 2 2 1.5 6-1 7l-3 2h-7l-3-2c-2.5-1-3-5-1-7Z"/><circle cx="8" cy="11" r="2"/><circle cx="16" cy="11" r="2"/><path d="m10 16 2-1 2 1"/>',
  hand: '<path d="M9 12V5a1.5 1.5 0 1 1 3 0v5-1a1.5 1.5 0 1 1 3 0v2-1a1.5 1.5 0 1 1 3 0v2a1.5 1.5 0 1 1 3 0v3a6 6 0 0 1-6 6h-2a5 5 0 0 1-4-2l-4-5a1.6 1.6 0 0 1 2-2.4L9 13"/>',
};

function icon(name, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.spark}</svg>`;
}

function courseById(id) {
  return COURSES.find(course => course.id === id);
}

function productById(id) {
  return CATALOG.find(item => item.id === id);
}

function outfitById(id) {
  return OUTFITS.find(outfit => outfit.id === id) || OUTFITS[0];
}

function exerciseFor(course, index) {
  const [id, seconds, title] = course.exercises[index];
  const move = MOVES[id];
  return { ...move, title: title || move.name, seconds, coach: (move.front || move.side)[0][0] === 'm' ? 'male' : 'female' };
}

function courseSeconds(course) {
  const seconds = course.exercises.reduce((sum, [, amount]) => sum + amount, 0);
  return seconds+(course.exercises.length-1)*REST_SECONDS;
}

function courseMinutes(course) {
  return Math.ceil(courseSeconds(course)/60);
}

function img(file, alt = '', classes = '') {
  return `<img class="${classes}" src="${ASSETS}${file}" alt="${esc(alt)}" draggable="false">`;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function formatNumber(number) {
  return new Intl.NumberFormat('zh-CN').format(number);
}
