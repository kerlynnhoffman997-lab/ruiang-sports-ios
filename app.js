const STORAGE_KEY = 'ruiang-move-ios-v1';
const app = document.querySelector('#app');
const sheet = document.querySelector('#sheet');
const toastNode = document.querySelector('#toast');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const pageTitles = {
  home:'首页', train:'训练', plan:'计划', me:'我的', wardrobe:'换装衣橱', shop:'道具商城',
  badges:'成就勋章', bag:'我的装备', records:'运动记录', growth:'成长旅程', settings:'设置',
  course:'训练准备', workout:'训练中', result:'训练结果',
};
const poses = { home:0, wardrobe:0 };
const preloaded = new Set();
const ui = {
  trainingFilter:'全部', wardrobeFilter:'全部', shopFilter:'全部', cart:new Set(), exchangeReceipt:null,
  planDate:today(), previewOutfit:'sport', growthStage:null,
  playing:false, starting:'', pace:1, angle:'front', mirror:false, breakdown:false, frame:0,
  metronome:false, camera:null, cameraPending:false, cameraRequest:0,
};
let state = readState();
let route = { page:'home' };
let dialogData;
let toastTimer;
let tickMark = 0;
let audio;
let drag;
let suppressSpriteClick = 0;

function dateKey(date) {
  const pad = number => String(number).padStart(2,'0');
  return [date.getFullYear(),pad(date.getMonth()+1),pad(date.getDate())].join('-');
}

function dateAt(key) {
  const [year,month,day] = key.split('-').map(Number);
  return new Date(year,month-1,day,12);
}

function today() {
  return dateKey(new Date());
}

function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && dateKey(dateAt(value)) === value;
}

function addDays(key, amount) {
  const date = dateAt(key);
  date.setDate(date.getDate()+amount);
  return dateKey(date);
}

function mondayOf(key) {
  return addDays(key,-((dateAt(key).getDay()+6)%7));
}

function monthDay(key) {
  const date = dateAt(key);
  return (date.getMonth()+1)+'月'+date.getDate()+'日';
}

function friendlyDate(key) {
  return monthDay(key)+' · 周'+'日一二三四五六'[dateAt(key).getDay()];
}

function formatClock(seconds) {
  return [Math.floor(seconds/60),seconds%60].map(part => String(part).padStart(2,'0')).join(':');
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds/60);
  const remainder = seconds%60;
  return minutes ? minutes+' 分'+(remainder ? ' '+remainder+' 秒' : '钟') : remainder+' 秒';
}

function freshId(kind) {
  return kind+'-'+(globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2));
}

function seedState() {
  const date = today();
  const checkins = Array.from({length:5},(_,i) => addDays(date,i-5));
  const history = ['wake','strength','stretch','hiit','wake'].map((course,index) => ({
    id:'demo-'+index, course, date:checkins[index], seconds:[210,225,160,180,210][index],
    calories:[17,19,8,18,16][index], xp:25, coins:15, streak:index+1,
  }));
  return {
    name:'瑞昂的小队员', xp:1280, coins:1280, vitality:520, goal:3, exchanges:0,
    outfit:'sport', avatar:'lion', accessory:'', owned:['sport','running','casual'],
    items:{fruit:2,bottle:1,wristband:1}, history, checkins, badges:[],
    voice:false, reminders:true,
    plans:[
      {id:'welcome-wake',date,time:'07:30',course:'wake'},
      {id:'welcome-stretch',date,time:'18:30',course:'stretch'},
      {id:'welcome-strength',date:addDays(date,2),time:'18:30',course:'strength'},
      {id:'welcome-shoot',date:addDays(date,4),time:'17:00',course:'shoot'},
      {id:'welcome-prior',date:addDays(date,-1),time:'18:00',course:'wake',done:'demo-4'},
    ],
    sessions:{'demo-resume':{id:'demo-resume',course:'hiit',plan:'',step:2,remaining:25,seconds:65,rest:false,touched:0}},
  };
}

function readState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const saved = JSON.parse(stored);
      if (saved && typeof saved === 'object' && Array.isArray(saved.history) && Array.isArray(saved.plans)) {
        const avatar = MASCOT_VIEWS.some(view => view.id === saved.avatar) ? saved.avatar : 'lion';
        const restored = { ...seedState(), ...saved, avatar };
        restored.sessions = restoreSessions(restored);
        return restored;
      }
    }
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
  return seedState();
}

function restoreSessions(data) {
  const sessions = Object.create(null);
  const finished = new Set(data.history.map(entry => entry.id));
  for (const [key, session] of Object.entries(data.sessions || {})) {
    if (!session?.id || finished.has(session.id)) continue;
    // Older checkpoints used the course ID as the storage key.
    const course = courseById(session.course || key);
    if (!course || !Number.isInteger(session.step) || !course.exercises[session.step]) continue;
    const plan = data.plans.find(entry => entry.id === session.plan && entry.course === course.id && !entry.done);
    sessions[session.id] = { ...session, course:course.id, plan:plan?.id || '', touched:session.touched || 0 };
  }
  return sessions;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  } catch {
    // Keep the current browser session usable when storage is unavailable.
  }
}

function stageForLevel(level) {
  return STAGES.findLast(entry => level >= entry.level) || STAGES[0];
}

function levelInfo() {
  const level = LEVELS.findLastIndex(threshold => state.xp >= threshold)+1;
  return { level, stage:stageForLevel(level), max:level === LEVELS.length, next:LEVELS[level] || LEVELS.at(-1) };
}

function charm() {
  const outfitIndex = OUTFITS.findIndex(outfit => outfit.id === state.outfit);
  return 380+outfitIndex*8+(state.accessory ? 15 : 0);
}

function plansFor(date) {
  return state.plans.filter(plan => plan.date === date && courseById(plan.course)).sort((a,b) => a.time.localeCompare(b.time));
}

function pendingPlan(courseId, planId) {
  if (!planId) return undefined;
  return state.plans.find(plan => plan.id === planId && plan.course === courseId && !plan.done);
}

function recentSessions(courseId = '') {
  return Object.values(state.sessions).filter(session => !courseId || session.course === courseId)
    .sort((a,b) => b.touched-a.touched);
}

function savedSession(courseId, planId = '', sessionId = '') {
  if (sessionId) {
    const pinned = state.sessions[sessionId];
    return pinned?.course === courseId && pinned.plan === planId ? pinned : undefined;
  }
  return recentSessions(courseId).find(session => session.plan === planId);
}

function workoutSession(destination) {
  const plan = pendingPlan(destination.id,destination.plan);
  return savedSession(destination.id,plan?.id,destination.session);
}

function historyCount(group) {
  return state.history.filter(log => courseById(log.course)?.group === group).length;
}

function weekTrainingDays(date) {
  const first = mondayOf(date);
  const last = addDays(first,6);
  return new Set(state.history.map(log => log.date).filter(day => day >= first && day <= last)).size;
}

function currentStreak() {
  const days = new Set(state.checkins);
  let date = days.has(today()) ? today() : addDays(today(),-1);
  let count = 0;
  while (days.has(date)) {
    count++;
    date = addDays(date,-1);
  }
  return count;
}

function longestStreak() {
  let longest = 0;
  let run = 0;
  let prior = '';
  for (const day of [...new Set(state.checkins)].sort()) {
    run = prior && addDays(prior,1) === day ? run+1 : 1;
    longest = Math.max(longest,run);
    prior = day;
  }
  return longest;
}

function badgeTarget(badge) {
  return typeof badge.target === 'function' ? badge.target() : badge.target;
}

function unlockBadges() {
  const earned = BADGES.filter(badge => !state.badges.includes(badge.id) && badge.progress() >= badgeTarget(badge));
  state.badges.push(...earned.map(badge => badge.id));
  return earned;
}

function update(message, oldLevel = levelInfo().level) {
  const earned = unlockBadges();
  save();
  render();
  const feedback = [message,earningsText(earned)].filter(Boolean).join(' · ');
  if (feedback) showToast(feedback);
  const current = levelInfo();
  if (current.level > oldLevel) {
    const stageUnlocked = current.stage !== stageForLevel(oldLevel);
    openSheet(stageUnlocked ? '解锁'+current.stage.name : '升级成功',`<div class="upgrade-content">${img('ruiang-celebrate.png')}<h3>到达 Lv.${current.level}</h3><p>当前成长阶段 · ${current.stage.name}</p></div>
      <div class="sheet-actions"><a class="button button-outline" href="#growth">查看成长</a><button class="button button-primary" data-action="close-sheet">继续</button></div>`);
  }
}

function earningsText(earned) {
  return earned.length ? '获得「'+earned.map(badge => badge.name).join('、')+'」勋章' : '';
}

function tabFor(page) {
  if (['course','workout','result'].includes(page)) return 'train';
  if (['wardrobe','shop'].includes(page)) return 'home';
  if (['bag','badges','records','growth','settings'].includes(page)) return 'me';
  return page;
}

function readRoute() {
  const [path,query] = location.hash.slice(1).split('?');
  const [page,id] = path.split('/');
  const options = new URLSearchParams(query || '');
  if (['course','workout'].includes(page) && !courseById(id)) return {page:'train'};
  if (page === 'result' && !state.history.some(log => log.id === id)) return {page:'records'};
  return {
    page:Object.hasOwn(pageTitles,page) ? page : 'home',id,
    plan:options.get('plan') || '',session:options.get('session') || '',
  };
}

function hashFor(page, id = '', {plan = '',session = ''} = {}) {
  const query = new URLSearchParams();
  if (plan) query.set('plan',plan);
  if (session) query.set('session',session);
  const suffix = query.toString();
  return '#'+page+(id ? '/'+id : '')+(suffix ? '?'+suffix : '');
}

function go(page, id = '', options = {}) {
  const hash = hashFor(page,id,options);
  if (location.hash === hash) {
    render();
  } else if (options.replace) {
    location.replace(hash);
  } else {
    location.hash = hash;
  }
}

function onRouteChange(initial = false) {
  const next = readRoute();
  const session = next.page === 'workout' ? workoutSession(next) : null;
  if (next.page === 'workout' && !session) {
    go('course',next.id,{plan:next.plan,replace:true});
    return;
  }
  const sameCalendar = !initial && route.page === 'plan' && next.page === 'plan';
  const changedWorkout = next.page !== route.page || next.id !== route.id || next.plan !== route.plan || next.session !== route.session;
  if (toastNode.dataset.route !== location.hash) hideToast();
  if (sheet.open) sheet.close();
  if (route.page === 'workout' && changedWorkout) {
    ui.playing = false;
    ui.metronome = false;
    stopCamera();
    window.speechSynthesis?.cancel();
    save();
  }
  if (next.page === 'wardrobe' && route.page !== 'wardrobe') {
    ui.previewOutfit = ui.requestedOutfit || state.outfit;
    ui.requestedOutfit = '';
    poses.wardrobe = 0;
  }
  if (next.page === 'growth' && route.page !== 'growth') ui.growthStage = null;
  if (next.page === 'shop' && route.page !== 'shop') ui.exchangeReceipt = null;
  if (next.page === 'plan') ui.planDate = isDateKey(next.id) ? next.id : today();
  if (session && changedWorkout) {
    ui.breakdown = false;
    ui.frame = 0;
    ui.angle = 'front';
    ui.playing = ui.starting === session.id;
    ui.starting = '';
    tickMark = performance.now();
  }
  route = next;
  document.title = (route.page === 'home' ? '' : pageTitles[route.page]+' · ')+'瑞昂运动';
  render(sameCalendar);
  if (!initial && !sameCalendar) {
    window.scrollTo(0,0);
    document.querySelector('#main')?.focus({preventScroll:true});
  }
}

function render(restoreFocus = true) {
  const previousRail = app.querySelector('.outfit-grid');
  const outfitOffset = previousRail?.scrollLeft;
  const previousMotion = reducedMotion.matches ? null : captureMotionState();
  const focus = restoreFocus ? document.activeElement : null;
  const key = focus?.dataset.action;
  const match = key ? [key,focus.dataset.id,focus.dataset.value] : null;
  let page;
  switch (route.page) {
    case 'train': page = trainView(); break;
    case 'plan': page = planView(); break;
    case 'me': page = meView(); break;
    case 'wardrobe': page = wardrobeView(); break;
    case 'shop': page = shopView(); break;
    case 'bag': page = bagView(); break;
    case 'badges': page = badgesView(); break;
    case 'growth': page = growthView(); break;
    case 'records': page = recordsView(); break;
    case 'settings': page = settingsView(); break;
    case 'course': page = preparationView(courseById(route.id)); break;
    case 'workout': page = workoutView(courseById(route.id),workoutSession(route)); break;
    case 'result': page = resultView(state.history.find(log => log.id === route.id)); break;
    default: page = homeView();
  }
  app.innerHTML = shell(page);
  const outfitRail = app.querySelector('.outfit-grid');
  if (outfitRail && previousRail?.dataset.filter === outfitRail.dataset.filter) {
    outfitRail.scrollLeft = outfitOffset;
  } else if (outfitRail && !previousRail) {
    const chosen = outfitRail.querySelector('.outfit-card.selected');
    if (chosen && chosen.offsetLeft + chosen.offsetWidth > outfitRail.clientWidth) {
      outfitRail.scrollLeft = chosen.offsetLeft;
    }
  }
  if (previousMotion) animateComponentChanges(previousMotion);
  for (const sprite of app.querySelectorAll('[data-sprite]')) {
    turnSprite(sprite.dataset.sprite,0);
    if (sprite.dataset.avatar === 'lion') {
      for (const view of [1,2]) preload(ASSETS+sprite.dataset.outfit+'-'+view+'.png');
    }
  }
  const video = document.querySelector('#camera-video');
  if (video && ui.camera) video.srcObject = ui.camera;
  if (match && !sheet.open) {
    const button = [...app.querySelectorAll('[data-action]')].find(node =>
      node.dataset.action === match[0] && node.dataset.id === match[1] && node.dataset.value === match[2]);
    button?.focus({preventScroll:true});
  }
}

function captureMotionState() {
  const indicators = new Map();
  for (const indicator of app.querySelectorAll('[data-indicator]')) {
    if (indicator.offsetWidth) {
      indicators.set(indicator.dataset.indicator,{
        index:indicator.dataset.index,
        transform:getComputedStyle(indicator).transform,
      });
    }
  }
  const xpBar = app.querySelector('[data-experience-bar]');
  const xpFill = xpBar?.firstElementChild;
  return {
    indicators,
    stage:app.querySelector('[data-stage]')?.dataset.stage,
    xp:xpBar && {
      target:parseFloat(xpFill.style.getPropertyValue('--progress')),
      fill:xpBar.clientWidth ? xpFill.getBoundingClientRect().width/xpBar.clientWidth*100 : 0,
      total:app.querySelector('[data-experience-total]').textContent,
    },
  };
}

function animateComponentChanges(previous) {
  for (const indicator of app.querySelectorAll('[data-indicator]')) {
    const from = previous.indicators.get(indicator.dataset.indicator);
    if (from && from.index !== indicator.dataset.index && indicator.offsetWidth) {
      indicator.animate([{transform:from.transform},{transform:getComputedStyle(indicator).transform}],{
        duration:280, easing:'cubic-bezier(.2,.8,.2,1)',
      });
    }
  }
  const stage = app.querySelector('[data-stage]');
  if (stage && previous.stage && stage.dataset.stage !== previous.stage) {
    stage.querySelector('.growth-copy').animate([
      {opacity:.45,translate:'0 6px'},{opacity:1,translate:'0 0'},
    ],{duration:210,easing:'ease-out'});
    stage.querySelector('.growth-art-badge').animate([
      {opacity:.35,scale:.83},{opacity:1,scale:1.045,offset:.68},{opacity:1,scale:1},
    ],{duration:280,easing:'cubic-bezier(.2,.75,.3,1)'});
  }
  const total = app.querySelector('[data-experience-total]');
  if (!total || !previous.xp || total.textContent === previous.xp.total) return;
  const fill = app.querySelector('[data-experience-bar] > span');
  const target = fill.style.getPropertyValue('--progress');
  const start = previous.xp.fill+'%';
  const endsLevel = parseFloat(target) < previous.xp.target;
  const frames = endsLevel ? [
    {width:start,opacity:1},{width:'100%',opacity:1,offset:.32},
    {width:'100%',opacity:0,offset:.48},{width:target,opacity:0,offset:.5},{width:target,opacity:1},
  ] : [{width:start},{width:target}];
  fill.animate(frames,{duration:endsLevel ? 490 : 410,easing:'cubic-bezier(.2,.66,.21,1)'});
  total.animate([{opacity:.55,translate:'0 3px'},{opacity:1,translate:'0 0'}],{duration:210,easing:'ease-out'});
}

function preload(url) {
  if (preloaded.has(url)) return;
  const image = new Image();
  image.src = url;
  preloaded.add(url);
}

function turnSprite(context, delta) {
  const sprite = app.querySelector('[data-sprite="'+context+'"]');
  if (!sprite || sprite.dataset.avatar !== 'lion') return;
  const angle = ((poses[context]+delta)%360+360)%360;
  poses[context] = angle;
  const quadrant = Math.round(angle/90)%4;
  const view = quadrant === 3 ? 1 : quadrant;
  const squash = 1-(Math.abs(angle-Math.round(angle/90)*90)/45)*0.13;
  const picture = sprite.querySelector('img');
  const src = ASSETS+sprite.dataset.outfit+'-'+view+'.png';
  if (picture.getAttribute('src') !== src) picture.src = src;
  picture.style.setProperty('--sprite-x',(quadrant === 3 ? -1 : 1)*squash);
}

function animateSprite(sprite) {
  const mover = sprite.querySelector('.sprite-mover');
  mover.getAnimations().forEach(animation => animation.cancel());
  if (!reducedMotion.matches) {
    mover.animate([{transform:'translateY(0)'},{transform:'translateY(-20px) rotate(-3deg)'},{transform:'translateY(0)'}],{duration:520,easing:'cubic-bezier(.2,.7,.25,1)'});
  }
  if (sprite.dataset.sprite !== 'home') return;
  const speech = document.querySelector('#hero-dialogue');
  if (sprite.dataset.avatar === 'lion') {
    const phrases = ['加油！今天也要坚持哦','先热个身，再出发！','每次运动都算数！'];
    ui.say = ((ui.say ?? -1)+1)%phrases.length;
    speech.textContent = phrases[ui.say];
  } else {
    speech.textContent = '准备好，骑行出发！';
  }
  const effects = app.querySelector('.sprite-effects');
  effects.classList.remove('pop');
  requestAnimationFrame(() => effects.classList.add('pop'));
}

function hideToast() {
  clearTimeout(toastTimer);
  toastNode.classList.remove('visible');
}

function showToast(message) {
  clearTimeout(toastTimer);
  toastNode.dataset.route = location.hash;
  toastNode.innerHTML = icon('check',18)+`<span>${esc(message)}</span>`;
  toastNode.classList.add('visible');
  toastTimer = setTimeout(hideToast,3000);
}

function openSheet(title, content, meta = {}) {
  dialogData = meta;
  sheet.innerHTML = `<div class="sheet-inner"><header><h2 id="sheet-title">${title}</h2>
    <button class="icon-button" type="button" data-action="close-sheet" aria-label="关闭">${icon('close',21)}</button></header>${content}</div>`;
  if (!sheet.open) sheet.showModal();
  else sheet.querySelector('[data-action="close-sheet"]').focus({preventScroll:true});
}

function cartItems() {
  return [...ui.cart].map(productById).filter(item => item && itemStatus(item) === 'available');
}

function checkpointLabel(session,course) {
  return session.rest ? `已完成 ${session.step+1}/${course.exercises.length} 个动作，组间休息`
    : `第 ${session.step+1}/${course.exercises.length} 个动作`;
}

function registerDay() {
  const day = today();
  if (state.checkins.includes(day)) return false;
  state.checkins.push(day);
  return true;
}

function checkIn() {
  if (!registerDay()) return;
  const old = levelInfo().level;
  state.xp += 15;
  state.coins += 10;
  update('打卡成功 · 经验 +15 · 训练币 +10',old);
}

function avatarSheet() {
  openSheet('切换形象',`<div class="avatar-options">${MASCOT_VIEWS.map(avatar => `
    <button class="avatar-option${avatar.id === state.avatar ? ' selected' : ''}" data-action="select-avatar" data-id="${avatar.id}" aria-pressed="${avatar.id === state.avatar}">
      ${img(avatar.image)}<span><strong>${avatar.name}</strong><small>${avatar.description}</small></span>${avatar.id === state.avatar ? icon('check',20) : icon('chevron',18)}
    </button>`).join('')}</div><a class="text-link coach-sheet-link" href="#train">查看教练示范课程 ${icon('arrow',16)}</a>`);
}

function exchangeSheet() {
  const cart = cartItems();
  if (!cart.length) {
    if (sheet.open) sheet.close();
    return;
  }
  const total = cart.reduce((sum,item) => sum+item.price,0);
  const missing = total-state.coins;
  openSheet('已选商品',`<div class="confirmation-list">${cart.map(item => `<div><span>${item.name}</span><strong>${item.price} 币</strong><button class="icon-button" type="button" data-action="cart-remove" data-id="${item.id}" aria-label="移除${item.name}">${icon('trash',16)}</button></div>`).join('')}</div>
    <div class="confirmation-total"><span>合计</span><strong>${formatNumber(total)} 训练币</strong></div>
    <p class="sheet-hint${missing > 0 ? ' field-error' : ''}">${missing > 0 ? '还差 '+formatNumber(missing)+' 训练币' : '兑换后剩余 '+formatNumber(-missing)+' 训练币'}</p>
    <div class="sheet-actions"><button class="button button-outline" data-action="close-sheet">继续挑选</button><button class="button button-primary" data-action="confirm-exchange"${total > state.coins ? ' disabled' : ''}>确认兑换</button></div>`);
}

function exchange() {
  const cart = cartItems();
  const total = cart.reduce((sum,item) => sum+item.price,0);
  if (!cart.length || total > state.coins) return;
  for (const item of cart) {
    if (item.outfit) state.owned.push(item.id);
    else state.items[item.id] = (state.items[item.id] || 0)+1;
  }
  state.coins -= total;
  state.exchanges++;
  ui.cart.clear();
  ui.exchangeReceipt = cart;
  sheet.close();
  update('兑换成功 · '+cart.map(item => item.name).join('、'));
}

function itemUse(id) {
  const item = productById(id);
  if (!item?.consumable || !(state.items[id] > 0)) return;
  const old = levelInfo().level;
  state.items[id]--;
  if (id === 'gift') {
    state.items.fruit = (state.items.fruit || 0)+2;
    state.coins += 30;
    update('获得 2 颗能量果和 30 训练币',old);
  } else {
    const xp = id === 'bell' ? 120 : 40;
    state.xp += xp;
    update(item.name+' · 经验 +'+xp,old);
  }
}

function planSheet(id) {
  const existing = state.plans.find(entry => entry.id === id);
  const day = existing?.date || ui.planDate;
  const course = courseById(existing?.course) || COURSES[0];
  if (existing?.done) {
    openSheet('已完成安排',`<p class="sheet-context"><strong>${course.name}</strong><span>${friendlyDate(day)} ${existing.time}</span></p>
      <div class="sheet-actions"><button class="button button-outline delete-button" data-action="plan-remove" data-id="${id}">${icon('trash',16)}移除安排</button>
        <button class="button button-primary" data-action="close-sheet">完成</button></div>`);
    return;
  }
  const time = existing?.time || firstPlanTime(day,course);
  const checkpoint = existing && savedSession(course.id,existing.id);
  openSheet(existing ? '编辑安排' : '制定新计划',`<form data-form="plan" class="sheet-form">
    <div class="paired-fields"><label class="field"><span>日期</span><input type="date" name="date" value="${day}" required></label>
    <label class="field"><span>时间</span><input type="time" name="time" value="${time}" aria-describedby="plan-error" required></label></div>
    <label class="field"><span>训练课程</span><select name="course">${COURSES.map(entry => `<option value="${entry.id}"${entry.id === course.id ? ' selected' : ''}>${entry.name}</option>`).join('')}</select></label>
    <p class="sheet-hint">预计 <b data-plan-duration>${courseMinutes(course)}</b> 分钟，含组间休息。</p>
    ${checkpoint ? '<p class="sheet-hint">更换课程后，可在训练页续练原课程。</p>' : ''}
    <p class="field-error" id="plan-error" role="alert" hidden></p>
    <div class="sheet-actions">${existing ? `<button class="button button-outline delete-button" type="button" data-action="plan-remove" data-id="${existing.id}">${icon('trash',16)}移除安排</button>` : `<button class="button button-outline" type="button" data-action="close-sheet">取消</button>`}<button class="button button-primary" type="submit">保存安排</button></div>
  </form>`,{plan:existing?.id});
}

function planConflict(date, time, course, excludeId) {
  const start = new Date(date+'T'+time).getTime();
  const end = start+courseSeconds(course)*1000;
  return state.plans.find(plan => {
    const other = courseById(plan.course);
    if (!other || plan.id === excludeId) return false;
    const otherStart = new Date(plan.date+'T'+plan.time).getTime();
    return start < otherStart+courseSeconds(other)*1000 && otherStart < end;
  });
}

function firstPlanTime(date, course) {
  const now = new Date();
  const quarter = Math.ceil((now.getHours()*60+now.getMinutes()+1)/15)*15;
  const initial = date === today() ? Math.min(quarter,24*60-1) : 18*60+30;
  for (let minute = initial; minute < 24*60; minute += 15) {
    const time = formatClock(minute);
    if (!planConflict(date,time,course)) return time;
  }
  return formatClock(initial);
}

function detachPlanSessions(planId) {
  for (const session of Object.values(state.sessions)) {
    if (session.plan === planId) session.plan = '';
  }
}

function planSave(form) {
  const values = new FormData(form);
  const original = state.plans.find(entry => entry.id === dialogData.plan);
  const date = values.get('date');
  const time = values.get('time');
  const course = courseById(values.get('course'));
  if (!isDateKey(date) || !time || !course || original?.done) return;
  const conflict = planConflict(date,time,course,original?.id);
  if (conflict) {
    const error = form.querySelector('#plan-error');
    error.textContent = '与 '+monthDay(conflict.date)+' '+conflict.time+' 的「'+courseById(conflict.course).name+'」时间重叠。';
    error.hidden = false;
    form.elements.time.setCustomValidity(error.textContent);
    form.elements.time.setAttribute('aria-invalid','true');
    form.elements.time.focus();
    return;
  }
  if (original) {
    if (course.id !== original.course) detachPlanSessions(original.id);
    Object.assign(original,{ date,time,course:course.id });
  } else {
    state.plans.push({id:freshId('plan'),date,time,course:course.id});
  }
  sheet.close();
  save();
  go('plan',date,{replace:true});
  showToast('计划已保存');
}

function planRemoveSheet(id) {
  const plan = state.plans.find(entry => entry.id === id);
  if (!plan) return;
  const note = plan.done ? '本次训练可在运动记录中查看。'
    : savedSession(plan.course,id) ? '已保存的进度可在训练页继续。' : '';
  openSheet('移除这条安排？',`<p class="sheet-context"><strong>${courseById(plan.course).name}</strong><span>${friendlyDate(plan.date)} ${plan.time}</span></p>
    ${note ? `<p class="sheet-hint">${note}</p>` : ''}
    <div class="sheet-actions"><button class="button button-outline" data-action="plan-edit" data-id="${id}">返回</button>
      <button class="button button-primary" data-action="delete-plan" data-id="${id}">确认移除</button></div>`);
}

function goalSheet() {
  openSheet('每周训练目标',`<form class="sheet-form" data-form="goal">
    <label class="field"><span>每周训练天数</span><select name="goal">${Array.from({length:7},(_,i) => i+1).map(day => `<option value="${day}"${day === state.goal ? ' selected' : ''}>${day} 天 / 周</option>`).join('')}</select></label>
    <p class="sheet-hint">同一天完成多节课，计为一个训练日。</p>
    <div class="sheet-actions"><button class="button button-outline" type="button" data-action="close-sheet">取消</button><button class="button button-primary" type="submit">保存目标</button></div>
  </form>`);
}

function badgeSheet(id) {
  const badge = BADGES.find(entry => entry.id === id);
  if (!badge) return;
  const unlocked = state.badges.includes(id);
  const target = badgeTarget(badge);
  const progress = unlocked ? target : Math.min(target,badge.progress());
  openSheet(badge.name,`<div class="badge-detail">${emblem(badge,unlocked)}<p>${badge.rule}</p><strong>${unlocked ? '已获得' : progress+' / '+target}</strong>${progressBar(progress/target*100,'gold','解锁进度')}</div>`);
}

function notificationsSheet() {
  const upcoming = state.reminders ? plansFor(today()).filter(plan => !plan.done) : [];
  openSheet('消息通知',upcoming.length ? `<div class="notification-list">${upcoming.map(plan =>
    `<a class="profile-link" href="${hashFor('course',plan.course,{plan:plan.id})}">${namedIcon('calendar','peach')}<span><strong>${courseById(plan.course).name}</strong><small>今天 ${plan.time} · ${savedSession(plan.course,plan.id) ? '可续练' : '待训练'}</small></span>${icon('chevron',18)}</a>`
  ).join('')}</div>` : `<div class="notification-empty">${namedIcon('bell','gold')}<p>暂无新消息</p></div>`);
}

function guideSheet() {
  openSheet('欢迎加入瑞昂运动',`<div class="guide-content">${img('ruiang-box.png','瑞昂在练习拳击')}<p>选一节课开始运动。每次训练都能获得经验和训练币，解锁瑞昂的新服装。</p></div>
    <div class="sheet-actions"><button class="button button-outline" data-action="close-sheet">关闭</button><a class="button button-primary" href="#train">选择课程 ${icon('arrow',17)}</a></div>`);
}

function startWorkout(course) {
  if (!course) return;
  const plan = pendingPlan(course.id,route.plan)?.id || '';
  let session = savedSession(course.id,plan,route.session);
  if (!session) {
    session = {id:freshId('training'),course:course.id,plan,step:0,remaining:exerciseFor(course,0).seconds,seconds:0,rest:false};
    state.sessions[session.id] = session;
  }
  ui.starting = session.id;
  saveWorkout(session);
  go('workout',course.id,{plan,session:session.id});
}

function saveWorkout(session) {
  session.touched = Date.now();
  save();
}

function activeWorkout() {
  if (route.page !== 'workout') return null;
  const course = courseById(route.id);
  const session = workoutSession(route);
  return session && {course,session,exercise:exerciseFor(course,session.step)};
}

function workoutFrames(exercise) {
  return ui.angle === 'side' ? (exercise.side || exercise.front) : (exercise.front || exercise.side);
}

function frameIndex(session,exercise) {
  if (ui.breakdown) return ui.frame;
  const frames = workoutFrames(exercise);
  const elapsed = exercise.seconds-session.remaining;
  return Math.floor(elapsed*ui.pace/2)%frames.length;
}

function speak(text) {
  if (!state.voice || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  window.speechSynthesis.speak(utterance);
}

function stopCamera() {
  ui.cameraRequest++;
  ui.cameraPending = false;
  ui.camera?.getTracks().forEach(track => track.stop());
  ui.camera = null;
}

async function toggleCamera() {
  if (ui.camera || ui.cameraPending) {
    stopCamera();
    render();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast('请在支持摄像头权限的浏览器页面中打开');
    return;
  }
  const request = ++ui.cameraRequest;
  ui.cameraPending = true;
  render();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
    if (ui.cameraRequest !== request || !activeWorkout()) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    ui.camera = stream;
  } catch (error) {
    if (ui.cameraRequest === request) {
      showToast(error.name === 'NotFoundError' ? '没有找到可用的摄像头' : '无法开启摄像头，请检查浏览器权限');
    }
  } finally {
    if (ui.cameraRequest === request) {
      ui.cameraPending = false;
      render();
    }
  }
}

function cueBeat() {
  if (!ui.metronome || audio?.state !== 'running') return;
  const beat = audio.createOscillator();
  const volume = audio.createGain();
  beat.type = 'sine';
  beat.frequency.value = 590;
  volume.gain.setValueAtTime(0.045,audio.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.001,audio.currentTime+0.07);
  beat.connect(volume).connect(audio.destination);
  beat.start();
  beat.stop(audio.currentTime+0.075);
}

function toggleMetronome() {
  if (ui.metronome) {
    ui.metronome = false;
  } else if ('AudioContext' in window) {
    audio ||= new AudioContext();
    ui.metronome = true;
    void audio.resume().then(cueBeat).catch(() => {});
  } else {
    showToast('当前浏览器无法播放节拍');
  }
  render();
}

function updateTimer(course,session,exercise) {
  const timer = document.querySelector('#workout-timer');
  if (!timer) return;
  timer.textContent = formatClock(session.remaining);
  const track = app.querySelector('.bar');
  const progress = session.rest ? session.remaining/REST_SECONDS
    : (session.step+1-session.remaining/exercise.seconds)/course.exercises.length;
  track.firstElementChild.style.setProperty('--progress',(progress*100)+'%');
  track.setAttribute('aria-valuenow',Math.round(progress*100));
  const picture = document.querySelector('#coach-frame');
  if (picture) {
    const frames = workoutFrames(exercise);
    const name = frames[Math.min(frameIndex(session,exercise),frames.length-1)];
    const src = ASSETS+'coach-'+name+'.jpg';
    if (picture.getAttribute('src') !== src) picture.src = src;
  }
}

function enterExercise(course,session,index) {
  session.step = index;
  session.remaining = exerciseFor(course,index).seconds;
  session.rest = false;
  ui.frame = 0;
  ui.breakdown = false;
  speak(exerciseFor(course,index).name);
}

function nextMove() {
  const active = activeWorkout();
  if (!active) return;
  const {course,session} = active;
  if (session.rest) {
    enterExercise(course,session,session.step+1);
  } else if (session.step+1 === course.exercises.length) {
    finishWorkout(course,session);
    return;
  } else {
    stopCamera();
    session.rest = true;
    session.remaining = REST_SECONDS;
    speak('组间休息，喝口水。');
  }
  tickMark = performance.now();
  saveWorkout(session);
  render();
}

function previousMove() {
  const active = activeWorkout();
  if (!active || active.session.step < 1) return;
  enterExercise(active.course,active.session,active.session.step-1);
  tickMark = performance.now();
  saveWorkout(active.session);
  render();
}

function finishWorkout(course,session) {
  if (state.history.some(entry => entry.id === session.id)) return;
  ui.playing = false;
  stopCamera();
  const old = levelInfo().level;
  const multiplier = ({拉伸:3,居家:5,力量:6,HIIT:8})[course.group] || 5;
  registerDay();
  state.xp += 25;
  state.coins += 15;
  state.vitality += 5;
  const log = {id:session.id,course:course.id,date:today(),seconds:session.seconds,calories:Math.round(session.seconds*multiplier/60),xp:25,coins:15,streak:currentStreak()};
  const current = levelInfo();
  if (current.level > old) {
    log.levelUp = current.level;
    if (current.stage !== stageForLevel(old)) log.stageUnlocked = current.stage.name;
  }
  const plan = pendingPlan(course.id,session.plan);
  if (plan) {
    plan.done = log.id;
    log.plannedDate = plan.date;
  }
  state.history.push(log);
  delete state.sessions[session.id];
  const earned = unlockBadges();
  save();
  go('result',log.id,{replace:true});
  showToast(['经验 +25','训练币 +15',earningsText(earned),log.levelUp ? '升级至 Lv.'+log.levelUp : ''].filter(Boolean).join(' · '));
}

function pulse() {
  if (!ui.playing) return;
  const active = activeWorkout();
  if (!active) return;
  const elapsed = Math.floor((performance.now()-tickMark)/1000);
  if (elapsed < 1) return;
  const {course,session,exercise} = active;
  tickMark += elapsed*1000;
  const seconds = Math.min(elapsed,session.remaining);
  session.remaining -= seconds;
  if (!session.rest) {
    session.seconds += seconds;
    cueBeat();
  }
  if (session.remaining === 0) {
    nextMove();
  } else {
    saveWorkout(session);
    updateTimer(course,session,exercise);
  }
}

function togglePlayback() {
  if (!activeWorkout()) return;
  if (ui.playing) {
    pulse();
    if (!activeWorkout()) return;
  }
  ui.playing = !ui.playing;
  if (ui.playing) ui.breakdown = false;
  tickMark = performance.now();
  render();
}

function toggleBreakdown() {
  if (ui.playing) pulse();
  const active = activeWorkout();
  if (!active || active.session.rest) return;
  ui.breakdown = !ui.breakdown;
  ui.frame = 0;
  if (ui.breakdown) ui.playing = false;
  render();
}

function selectGrowthStage(level) {
  const current = levelInfo().stage.level;
  ui.growthStage = level === current ? null : level;
  render();
}

const actions = {
  'avatar': avatarSheet,
  'select-avatar': id => {
    if (!MASCOT_VIEWS.some(avatar => avatar.id === id)) return;
    state.avatar = id;
    poses.home = 0;
    sheet.close();
    update();
  },
  'close-sheet': () => sheet.close(),
  'check-in': checkIn,
  'growth-stage': id => selectGrowthStage(Number(id)),
  'turn': (id,value) => turnSprite(id,Number(value)*90),
  'train-filter': (_,value) => { ui.trainingFilter = value; render(); },
  'wardrobe-filter': (_,value) => { ui.wardrobeFilter = value; render(); },
  'try-on': id => {
    ui.previewOutfit = outfitById(id).id;
    poses.wardrobe = 0;
    render();
  },
  'wear': id => {
    if (!state.owned.includes(id)) return;
    state.outfit = id;
    state.avatar = 'lion';
    poses.home = 0;
    update('已穿戴 · '+outfitById(id).name);
  },
  'wardrobe-reset': () => go('home'),
  'wardrobe-item': id => {
    ui.requestedOutfit = outfitById(id).id;
    ui.wardrobeFilter = '全部';
    go('wardrobe');
  },
  'shop-filter': (_,value) => { ui.shopFilter = value; render(); },
  'shop-item': id => {
    const item = productById(id);
    if (!item || itemStatus(item) !== 'available') return;
    ui.cart.add(id);
    ui.shopFilter = item.group;
    go('shop');
  },
  'cart': id => {
    const item = productById(id);
    if (!item || itemStatus(item) !== 'available') return;
    if (ui.cart.has(id)) ui.cart.delete(id);
    else ui.cart.add(id);
    ui.exchangeReceipt = null;
    render();
  },
  'checkout': exchangeSheet,
  'cart-remove': id => {
    ui.cart.delete(id);
    render();
    exchangeSheet();
  },
  'confirm-exchange': exchange,
  'use-item': itemUse,
  'wear-accessory': id => {
    const item = productById(id);
    if (!item?.wearable || !(state.items[id] > 0)) return;
    state.accessory = state.accessory === id ? '' : id;
    if (state.accessory) state.avatar = 'lion';
    update((state.accessory ? '已穿戴 · ' : '已取下 · ')+item.name);
  },
  'plan-day': (_,value) => go('plan',value,{replace:true}),
  'plan-week': (_,value) => go('plan',addDays(ui.planDate,Number(value)),{replace:true}),
  'plan-today': () => go('plan',today(),{replace:true}),
  'plan-add': () => planSheet(),
  'plan-edit': planSheet,
  'plan-remove': planRemoveSheet,
  'delete-plan': id => {
    state.plans = state.plans.filter(plan => plan.id !== id);
    detachPlanSessions(id);
    sheet.close();
    update('已删除安排');
  },
  'goal': goalSheet,
  'badge': badgeSheet,
  'notifications': notificationsSheet,
  'guide': guideSheet,
  'start-workout': id => startWorkout(courseById(id)),
  'play-workout': togglePlayback,
  'prev-move': previousMove,
  'next-move': nextMove,
  'skip-rest': nextMove,
  'breakdown': toggleBreakdown,
  'frame': (_,value) => { ui.frame = Number(value); render(); },
  'view-angle': () => { ui.angle = ui.angle === 'front' ? 'side' : 'front'; render(); },
  'mirror': () => { ui.mirror = !ui.mirror; render(); },
  'speed': () => {
    const speeds = [0.5,1,1.5];
    ui.pace = speeds[(speeds.indexOf(ui.pace)+1)%speeds.length];
    render();
  },
  'camera': toggleCamera,
  'metronome': toggleMetronome,
  'voice': () => {
    state.voice = !state.voice;
    if (state.voice) speak('语音提示已开启。');
    else window.speechSynthesis?.cancel();
    update(state.voice ? '语音已开启' : '语音已关闭');
  },
};

document.addEventListener('click',event => {
  const target = event.target.closest('button,a');
  if (!target || target.disabled) return;
  if (target.matches('.skip-link')) {
    event.preventDefault();
    app.querySelector('main')?.focus();
  } else if (target.dataset.sprite) {
    if (performance.now() > suppressSpriteClick) animateSprite(target);
  } else if (target.dataset.action) {
    const {action,id,value} = target.dataset;
    actions[action]?.(id,value);
  } else if (sheet.open && target.hash) {
    sheet.close();
  }
});

document.addEventListener('submit',event => {
  const form = event.target;
  if (!form.dataset.form) return;
  event.preventDefault();
  if (form.dataset.form === 'plan') {
    planSave(form);
  } else if (form.dataset.form === 'goal') {
    state.goal = Number(new FormData(form).get('goal'));
    sheet.close();
    update('每周训练目标已保存');
  } else if (form.dataset.form === 'settings') {
    const values = new FormData(form);
    const name = values.get('name').trim();
    if (!name) {
      form.elements.name.setCustomValidity('请输入昵称');
      form.elements.name.reportValidity();
      return;
    }
    state.name = name;
    state.voice = values.has('voice');
    state.reminders = values.has('reminders');
    update('设置已保存');
  }
});

document.addEventListener('input',event => {
  const form = event.target.form;
  if (form?.dataset.form === 'plan') {
    form.elements.time.setCustomValidity('');
    form.elements.time.removeAttribute('aria-invalid');
    form.querySelector('#plan-error').hidden = true;
    if (event.target === form.elements.course) {
      form.querySelector('[data-plan-duration]').textContent = courseMinutes(courseById(event.target.value));
    }
  }
  if (form?.dataset.form === 'settings') form.elements.name.setCustomValidity('');
});

sheet.addEventListener('click',event => {
  if (event.target === sheet) sheet.close();
});

app.addEventListener('pointerdown',event => {
  const target = event.target.closest('[data-sprite][data-avatar="lion"]');
  if (!target || event.button !== 0) return;
  drag = {target,id:event.pointerId,start:event.clientX,x:event.clientX,moved:false};
  target.setPointerCapture(event.pointerId);
});

app.addEventListener('pointermove',event => {
  if (!drag || drag.id !== event.pointerId) return;
  if (!drag.moved && Math.abs(event.clientX-drag.start) < 7) return;
  drag.moved = true;
  drag.target.classList.add('dragging');
  turnSprite(drag.target.dataset.sprite,(event.clientX-drag.x)*1.8);
  drag.x = event.clientX;
});

for (const pointerEvent of ['pointerup','pointercancel']) {
  app.addEventListener(pointerEvent,event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (drag.moved) suppressSpriteClick = performance.now()+250;
    drag.target.classList.remove('dragging');
    drag = null;
  });
}

app.addEventListener('keydown',event => {
  const stage = event.target.closest('[data-action="growth-stage"]');
  if (stage && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
    event.preventDefault();
    const index = STAGES.findIndex(entry => entry.level === Number(stage.dataset.id));
    const last = STAGES.length-1;
    const target = ({ArrowLeft:(index+last)%STAGES.length,ArrowRight:(index+1)%STAGES.length,Home:0,End:last})[event.key];
    const level = STAGES[target].level;
    selectGrowthStage(level);
    document.getElementById('stage-tab-'+level)?.focus({preventScroll:true});
    return;
  }
  const sprite = event.target.closest('[data-sprite][data-avatar="lion"]');
  if (!sprite || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  turnSprite(sprite.dataset.sprite,event.key === 'ArrowLeft' ? -90 : 90);
});

document.addEventListener('visibilitychange',() => {
  if (document.hidden && activeWorkout()) {
    ui.playing = false;
    stopCamera();
    save();
    render(false);
  }
});
window.addEventListener('hashchange',() => onRouteChange());
window.addEventListener('pagehide',() => { stopCamera(); save(); });

function prepareMobileApp() {
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = './app.webmanifest';
  document.head.append(manifest);
  if (window.isSecureContext && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(error => {
      console.warn('离线资源加载失败',error);
    });
  }
}

unlockBadges();
save();
onRouteChange(true);
prepareMobileApp();
setInterval(pulse,160);



