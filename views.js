const PRIMARY_NAV = [
  ['home','首页','home'], ['train','训练','play'], ['plan','计划','calendar'], ['me','我的','user'],
];
const SHORTCUTS = [
  ['wardrobe','换装衣橱','shirt','rose'], ['shop','道具商城','bag','blue'], ['badges','成就勋章','award','gold'],
];

function navLink([id, label, symbol]) {
  const active = route.page === id || tabFor(route.page) === id;
  return `<a href="#${id}" class="nav-item${active ? ' active' : ''}"${active ? ' aria-current="page"' : ''}>${icon(symbol,21)}<span>${label}</span></a>`;
}

function shell(main) {
  const tab = PRIMARY_NAV.findIndex(([id]) => id === tabFor(route.page));
  const training = route.page === 'workout';
  return `<main id="main" tabindex="-1" class="main-content${training ? ' training-content' : ''}" data-page="${route.page}">${main}</main>
  ${training ? '' : `<nav class="mobile-nav" aria-label="主导航" style="--slots:${PRIMARY_NAV.length};--slot:${tab}">
    <span class="selection-indicator" data-indicator="navigation" data-index="${tab}" aria-hidden="true"></span>
    ${PRIMARY_NAV.map(navLink).join('')}
  </nav>`}`;
}

function pageHead(title, { subtitle = '', back = '', kicker = '', action = '', className = '' } = {}) {
  return `<header class="page-head ${className}">
    <div class="page-title">
      ${back ? `<a class="back-link" href="#${back}">${icon('arrowLeft',18)}<span>返回</span></a>` : ''}
      ${kicker ? `<div class="page-kicker">${kicker}</div>` : ''}
      <div class="page-title-row"><h1>${title}</h1>${action ? `<div class="page-tools">${action}</div>` : ''}</div>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
  </header>`;
}

function coinPill() {
  const balance = formatNumber(state.coins);
  const content = `${img('prop-coin.jpg')}<strong>${balance}</strong><span>训练币</span>`;
  return route.page === 'shop' ? `<span class="coin-pill">${content}</span>`
    : `<a class="coin-pill" href="#shop" aria-label="道具商城，${balance} 训练币">${content}</a>`;
}

function namedIcon(symbol, color, size = 21) {
  return `<span class="icon-tile tone-${color}">${icon(symbol,size)}</span>`;
}

function progressBar(percent, color = 'gold', label = '进度', animate = false) {
  const safe = Math.min(100,Math.max(0,percent));
  return `<div class="bar bar-${color}" role="progressbar" aria-label="${label}" aria-valuenow="${Math.round(safe)}" aria-valuemin="0" aria-valuemax="100"${animate ? ' data-experience-bar' : ''}><span style="--progress:${safe}%"></span></div>`;
}

function levelCard() {
  const current = levelInfo();
  return `<section class="card level-card">
    <div class="line-heading"><h2>${icon('spark',18)}成长等级</h2></div>
    <div class="level-line"><span class="level-pill">Lv.${current.level}</span><strong>${current.stage.name}</strong><span class="xp-caption"><b data-experience-total>${formatNumber(state.xp)}</b> / ${formatNumber(current.next)} XP</span></div>
    ${progressBar(state.xp/current.next*100,'gold','成长经验',true)}
    <p class="level-caption">${current.max ? '已达到最高等级' : `距 Lv.${current.level+1} 还需 <strong>${formatNumber(current.next-state.xp)}</strong> 经验`}</p>
    <div class="attribute-row">
      <div>${icon('dumbbell',16)}<strong>${state.vitality}</strong><small>体能</small></div>
      <div>${icon('spark',16)}<strong>${charm()}</strong><small>魅力</small></div>
      <div>${icon('flame',16)}<strong>${currentStreak()}<em>天</em></strong><small>连续打卡</small></div>
    </div>
  </section>`;
}

function homeProgress() {
  const current = levelInfo();
  const checked = state.checkins.includes(today());
  const streak = currentStreak();
  const progress = Math.min(streak,7);
  const marks = Array.from({length:7},(_,index) => `<i${index < progress ? ' class="earned"' : ''}></i>`).join('');
  return `<div class="home-progress">
    <a href="#growth" class="card home-stat home-level" aria-label="查看成长等级，Lv.${current.level}，${current.stage.name}">
      <div class="home-stat-heading">${icon('spark',16)}<strong>成长等级</strong>${icon('chevron',14)}</div>
      <div class="home-stat-value"><b>Lv.${current.level}</b><span data-experience-total>${formatNumber(state.xp)} XP</span></div>
      ${progressBar(state.xp/current.next*100,'gold','成长经验',true)}
    </a>
    <section class="card home-stat home-streak" aria-label="连续打卡">
      <div class="home-stat-heading">${icon('flame',16)}<strong>连续打卡</strong></div>
      <div class="home-stat-value"><b>${streak}<small>天</small></b>
        <button class="button compact ${checked ? 'button-done' : 'button-primary'}" data-action="check-in" aria-label="${checked ? '今日已打卡' : '今日打卡'}"${checked ? ' disabled' : ''}>${checked ? '已打卡' : '打卡'}</button>
      </div>
      <div class="streak-marks" role="img" aria-label="七日打卡进度，${progress} 天">${marks}</div>
    </section>
  </div>`;
}

function spriteMarkup(outfit, context, avatar = 'lion') {
  const picked = MASCOT_VIEWS.find(option => option.id === avatar);
  const file = avatar === 'lion' ? outfit.id+'-0.png' : picked.image;
  return `<button type="button" class="sprite ${context === 'home' ? 'home-sprite' : 'wardrobe-sprite'}" data-sprite="${context}" data-outfit="${outfit.id}" data-avatar="${avatar}" aria-label="${avatar === 'lion' ? '拖动或按方向键旋转瑞昂，点按互动' : picked.name+'，点按互动'}">
    <span class="sprite-mover">${img(file,avatar === 'lion' ? '身穿'+outfit.name+'的醒狮少年瑞昂' : picked.name,'sprite-image')}</span>
  </button>`;
}

function equippedAccessory() {
  const accessory = productById(state.accessory);
  return accessory ? `<span class="equipped-item" title="已穿戴">${itemImage(accessory)}<span>已穿戴 · ${accessory.name}</span></span>` : '';
}

function hero(trainingLink) {
  const outfit = outfitById(state.outfit);
  const greeting = state.avatar === 'lion' ? '今天也要一起运动哦！' : '今天一起去骑行！';
  return `<section class="hero">
    <div class="hero-copy">
      <span class="hero-kicker">醒狮少年</span>
      <h2>我的瑞昂</h2>
      <p id="hero-dialogue" class="speech">${greeting}</p>
      <div class="hero-actions">
        <a class="button button-primary hero-training" href="${trainingLink}">去训练 ${icon('arrow',16)}</a>
        <button class="button button-dark hero-avatar-button" data-action="avatar" aria-label="切换形象">${icon('switch',17)}<span>切换形象</span></button>
      </div>
      ${state.avatar === 'lion' ? equippedAccessory() : ''}
    </div>
    <div class="hero-illustration">
      <span class="stage-shadow" aria-hidden="true"></span>
      ${spriteMarkup(outfit,'home',state.avatar)}
      <span class="sprite-effects" aria-hidden="true"><i>✦</i><i>✧</i><i>♥</i><i>✦</i></span>
    </div>
    ${state.avatar === 'lion' ? `<div class="turn-controls">
      <button class="turn-button" data-action="turn" data-id="home" data-value="-1" aria-label="向左转">${icon('chevronLeft',15)}</button>
      <span>${icon('rotate',14)}拖动旋转 · 点击互动</span>
      <button class="turn-button" data-action="turn" data-id="home" data-value="1" aria-label="向右转">${icon('chevron',15)}</button>
    </div>` : ''}
  </section>`;
}

function shortcutCards() {
  return `<nav class="shortcut-row card" aria-label="瑞昂快捷入口">${SHORTCUTS.map(([id,name,symbol,color]) =>
    `<a class="shortcut" href="#${id}">${namedIcon(symbol,color)}<strong>${name}</strong></a>`
  ).join('')}</nav>`;
}

function courseCard(course, {plan,compact = false} = {}) {
  const title = compact ? 'h3' : 'h2';
  return `<a class="card course-card${compact ? ' compact-course' : ''}" href="${hashFor('course',course.id,{plan:plan?.id})}">
    <div class="course-cover">${img(course.cover)}</div>
    <div class="course-card-copy">
      <div class="course-tags"><span class="text-tag tone-${course.color}">${course.group}</span>
        ${plan ? `<time datetime="${plan.date}T${plan.time}">${plan.time}</time>` : !compact ? `<span>${course.difficulty}</span>` : ''}</div>
      <${title}>${course.name}</${title}>
      <p class="course-meta">${courseMinutes(course)} 分钟 · ${compact ? course.difficulty : course.exercises.length+' 个动作'} · ${course.equipment}</p>
    </div>
    <span class="round-arrow">${icon('arrow',18)}</span>
  </a>`;
}

function homeView() {
  const pending = plansFor(today()).filter(plan => !plan.done);
  const nextPlan = pending[0];
  const trainingLink = nextPlan ? hashFor('course',nextPlan.course,{plan:nextPlan.id}) : '#train';
  const recommended = pending.length ? pending.slice(0,2).map(plan => courseCard(courseById(plan.course),{plan,compact:true})).join('')
    : [COURSES[0],COURSES[1]].map(course => courseCard(course,{compact:true})).join('');
  return `<div class="home-toolbar">
    <div class="home-brand" aria-label="瑞昂运动">${img('app-icon.png','','brand-icon')}
      <span>${img('wordmark.png','瑞昂','brand-wordmark')} <strong>运动</strong></span>
    </div>
    <div class="page-tools">${coinPill()}<button class="icon-button top-message" data-action="notifications" aria-label="消息通知">${icon('bell',20)}</button></div>
  </div>
  ${pageHead('小队员，动起来！',{
    kicker:icon('calendar',16)+friendlyDate(today()),
    className:'home-head',
  })}
  ${hero(trainingLink)}
  ${homeProgress()}
  ${shortcutCards()}
  <section class="home-training">
    <div class="section-heading"><h2>${pending.length ? '今日训练' : '推荐课程'}</h2><a class="text-link" href="#train">全部课程 ${icon('arrow',16)}</a></div>
    <div class="compact-grid">${recommended}</div>
  </section>`;
}

function filterBar(options,current,action,label = '筛选分类') {
  const index = options.indexOf(current);
  return `<div class="filter-bar" role="group" aria-label="${label}" style="--slots:${options.length};--slot:${index}">
    <span class="selection-indicator" data-indicator="${action}" data-index="${index}" aria-hidden="true"></span>
    ${options.map(value =>
    `<button class="filter-chip${value === current ? ' selected' : ''}" aria-pressed="${value === current}" data-action="${action}" data-value="${value}">${value}</button>`
  ).join('')}</div>`;
}

function trainView() {
  const courses = COURSES.filter(course => ui.trainingFilter === '全部' || course.group === ui.trainingFilter);
  const resumed = recentSessions()[0];
  const resumeCourse = courseById(resumed?.course);
  return `${pageHead('训练',{action:coinPill()})}
  ${resumed ? `<a class="resume-banner" href="${hashFor('course',resumed.course,{plan:resumed.plan,session:resumed.id})}">${namedIcon('play','gold')}<span><strong>继续上次训练</strong><small>${resumeCourse.name} · ${checkpointLabel(resumed,resumeCourse)}</small></span>${icon('arrow',20)}</a>` : ''}
  ${filterBar(['全部','居家','拉伸','力量','HIIT'],ui.trainingFilter,'train-filter','课程分类')}
  <div class="course-grid">${courses.map(course => courseCard(course)).join('')}</div>`;
}

function preparationView(course) {
  const chosenPlan = pendingPlan(course.id,route.plan);
  const saved = savedSession(course.id,chosenPlan?.id,route.session);
  const otherSessions = recentSessions(course.id).filter(session => session !== saved);
  const todayPlans = plansFor(today()).filter(plan => plan.course === course.id && !plan.done);
  const related = todayPlans.filter(plan => plan !== chosenPlan && !otherSessions.some(session => session.plan === plan.id));
  const button = saved ? '继续训练' : !chosenPlan && todayPlans.length ? '开始自由训练'
    : chosenPlan?.date > today() ? '提前训练' : chosenPlan?.date < today() ? '开始补练' : '开始训练';
  return `${pageHead('训练准备',{back:chosenPlan ? 'plan/'+chosenPlan.date : 'train',action:coinPill()})}
  <div class="detail-grid">
    <section class="course-overview card">
      <div class="prepare-media">${img(course.cover,course.name+'的写实教练示范')}</div>
      <div class="prepare-copy">
        <span class="text-tag tone-${course.color}">${course.group}</span><h2>${course.name}</h2>
        <p>${course.description}</p>
        <div class="facts"><span>${icon('clock',16)}${courseMinutes(course)} 分钟</span><span>${icon('layers',16)}${course.exercises.length} 个动作</span><span>${icon('dumbbell',16)}${course.equipment}</span><span>${icon('activity',16)}${course.difficulty}</span></div>
        ${saved ? `<p class="inline-note">${icon('clock',19)} 已保存进度 · ${checkpointLabel(saved,course)}</p>` : ''}
        ${chosenPlan ? `<p class="inline-note plain">${icon('calendar',18)} 完成后计入 ${monthDay(chosenPlan.date)} ${chosenPlan.time} 的计划</p>` : ''}
        <button class="button button-primary stretch-button" data-action="start-workout" data-id="${course.id}">${icon('triangle',20)}${button}</button>
        ${related.length || otherSessions.length ? `<div class="course-plan-links" aria-label="其他训练安排">
          ${related.map(plan => `<a href="${hashFor('course',course.id,{plan:plan.id})}">${icon('calendar',16)}<span>按计划训练 · 今天 ${plan.time}</span>${icon('chevron',16)}</a>`).join('')}
          ${otherSessions.map(session => {
            const plan = pendingPlan(course.id,session.plan);
            const context = plan ? monthDay(plan.date)+' '+plan.time : '自由训练';
            return `<a href="${hashFor('course',course.id,{plan:plan?.id,session:session.id})}">${icon('clock',16)}<span>续练 · ${context} <small>${checkpointLabel(session,course)}</small></span>${icon('chevron',16)}</a>`;
          }).join('')}
        </div>` : ''}
      </div>
    </section>
    <section class="card list-card">
      <div class="section-heading"><h2>动作列表</h2><span>${course.exercises.length} 个动作</span></div>
      <ol class="exercise-list">${course.exercises.map((_,index) => {
        const exercise = exerciseFor(course,index);
        const done = saved && (index < saved.step || (index === saved.step && saved.rest));
        const current = saved && !saved.rest && index === saved.step;
        return `<li><span class="exercise-number${done ? ' done' : current ? ' current' : ''}">${done ? icon('check',17) : current ? icon('triangle',17) : index+1}</span><strong>${exercise.title}</strong><small>${icon('clock',15)}${exercise.seconds} 秒</small></li>`;
      }).join('')}</ol>
    </section>
  </div>`;
}

function planView() {
  const start = mondayOf(ui.planDate);
  const days = Array.from({length:7},(_,index) => addDays(start,index));
  const plans = plansFor(ui.planDate);
  const count = weekTrainingDays(ui.planDate);
  const day = today();
  const end = days[6];
  const weekRange = monthDay(start)+'–'+(dateAt(start).getMonth() === dateAt(end).getMonth() ? dateAt(end).getDate()+'日' : monthDay(end));
  const weekPlans = state.plans.filter(plan => plan.date >= start && plan.date <= end);
  return `${pageHead(days.includes(day) ? '本周计划' : '运动计划',{
    action:`<button class="button button-primary" data-action="plan-add">${icon('plus',18)}新建计划</button>`,
  })}
  <div class="plan-grid">
      <section class="card calendar-card" aria-label="周历">
        <div class="line-heading calendar-heading">
          <h2>${weekRange}</h2>
          <div class="week-buttons"><button class="icon-button" data-action="plan-week" data-value="-7" aria-label="上一周">${icon('chevronLeft',19)}</button><button class="button button-text compact" data-action="plan-today">今天</button><button class="icon-button" data-action="plan-week" data-value="7" aria-label="下一周">${icon('chevron',19)}</button></div>
        </div>
        <div class="week-strip">${days.map((date,index) => {
          const scheduled = plansFor(date);
          const complete = scheduled.filter(plan => plan.done).length;
          const description = scheduled.length ? '，'+scheduled.length+' 节课程，已完成 '+complete+' 节' : '，无安排';
          return `<button data-action="plan-day" data-value="${date}" class="week-day${date === ui.planDate ? ' selected' : ''}${date === day ? ' today' : ''}" aria-pressed="${date === ui.planDate}"${date === day ? ' aria-current="date"' : ''} aria-label="${friendlyDate(date)+description}">
            <small>周${'一二三四五六日'[index]}</small><b>${dateAt(date).getDate()}</b><i class="${complete && complete === scheduled.length ? 'all-done' : scheduled.length ? 'has-plan' : ''}"></i>
          </button>`;
        }).join('')}</div>
      </section>
      <section class="card agenda-card">
        <div class="section-heading"><h2>${ui.planDate === day ? '今日安排' : monthDay(ui.planDate)+'安排'}</h2><span>${plans.length} 节课程</span></div>
        ${plans.length ? `<ul class="agenda-list">${plans.map(plan => agendaRow(plan,day)).join('')}</ul>`
          : `<div class="agenda-empty">${namedIcon('calendar','peach')}<p>这一天还没有安排课程</p></div>`}
      </section>
      <section class="card goal-card">
        <div class="line-heading"><h2>${icon('target',19)}每周训练目标</h2><button class="icon-button" data-action="goal" aria-label="设置每周目标">${icon('edit',17)}</button></div>
        <div class="goal-overview">
          <div class="goal-progress"><div class="goal-number"><strong>${count}</strong><span> / ${state.goal} 天</span></div>
            ${progressBar(count/state.goal*100,'red','每周训练目标')}
            <p>${count >= state.goal ? '这一周已达标' : `再训练 ${state.goal-count} 天即可达标`}</p></div>
          <figure class="plan-cover">${img('plan-cover.jpg')}</figure>
        </div>
        <div class="goal-scheduled"><span>计划课程</span><strong>${weekPlans.filter(plan => plan.done).length} / ${weekPlans.length} 节已完成</strong></div>
      </section>
  </div>`;
}

function agendaRow(plan, day) {
  const course = courseById(plan.course);
  const record = plan.done && state.history.find(log => log.id === plan.done);
  const checkpoint = !plan.done && savedSession(plan.course,plan.id);
  const tone = plan.done ? 'mint' : checkpoint ? 'gold' : plan.date < day ? 'rose' : 'neutral';
  const status = plan.done ? record && record.date !== plan.date
    ? (record.date < plan.date ? '提前完成' : '补练完成')+' · '+monthDay(record.date) : '已完成'
    : checkpoint ? '已保存进度' : plan.date < day ? '待补练' : plan.date > day ? '已安排' : '待开始';
  const label = checkpoint ? '继续' : plan.date < day ? '补练' : plan.date > day ? '提前练' : '开始';
  return `<li class="agenda-item tone-${tone}">
    <time datetime="${plan.date}T${plan.time}">${plan.time}</time><span class="timeline-dot" aria-hidden="true"></span>
    <div class="agenda-body"><h3>${course.name}</h3><p>${course.group} · ${courseMinutes(course)} 分钟</p><span class="agenda-state">${status}</span></div>
    <div class="agenda-actions">
      ${plan.done ? record ? `<a class="status-link" href="#result/${record.id}" aria-label="查看${course.name}训练记录">记录 ${icon('chevron',14)}</a>` : ''
        : `<a class="status-link" href="${hashFor('course',course.id,{plan:plan.id})}" aria-label="${label}${course.name}">${label} ${icon('chevron',14)}</a>`}
      <button class="icon-button agenda-edit" data-action="plan-edit" data-id="${plan.id}" aria-label="${plan.done ? '管理' : '编辑'}${course.name}安排">${icon('edit',17)}</button>
    </div>
  </li>`;
}

const PROFILE_GROUPS = [
  { label: '装备与运动', links: [
    ['bag','我的装备','box','blue'], ['badges','成就勋章','award','gold'], ['records','运动记录','activity','rose'],
  ]},
  { label: '偏好与通知', links: [
    ['goal','目标设置','target','mint','sheet'], ['notifications','消息通知','bell','gold','sheet'], ['settings','设置','gear','lilac'],
  ]},
];

function meView() {
  const { level, stage } = levelInfo();
  return `${pageHead('我的',{action:coinPill()})}
  <div class="profile-layout">
    <section class="card profile-card" aria-label="个人资料">
      <div class="profile-header">${img('ruiang-face.png','瑞昂头像','profile-avatar')}
        <div><h2>${esc(state.name)}</h2>
          <a class="profile-growth" href="#growth" aria-label="查看成长阶段"><span class="level-pill">Lv.${level}</span> ${stage.name} ${icon('chevron',14)}</a>
        </div>
      </div>
      <div class="profile-stats"><div><b>${state.history.length}</b><span>累计训练</span></div><div><b>${currentStreak()}</b><span>连续打卡</span></div><div><b>${state.badges.length}</b><span>解锁勋章</span></div></div>
    </section>
    <div class="profile-menus">
      ${PROFILE_GROUPS.map(({label, links}) => `<section class="card profile-menu" aria-label="${label}">
        ${links.map(([id,name,symbol,color,kind]) => {
          const content = `${namedIcon(symbol,color,18)}<strong>${name}</strong>${icon('chevron',16)}`;
          return kind === 'sheet'
            ? `<button type="button" class="profile-link" data-action="${id}">${content}</button>`
            : `<a class="profile-link" href="#${id}">${content}</a>`;
        }).join('')}
      </section>`).join('')}
    </div>
  </div>`;
}

function itemStatus(item) {
  const owned = item.outfit ? state.owned.includes(item.id) : (state.items[item.id] || 0) > 0;
  if (owned && !item.consumable) return 'owned';
  if (item.level && levelInfo().level < item.level) return 'locked';
  return 'available';
}

function itemImage(item) {
  return img(item.outfit ? item.id+'-0.png' : 'prop-'+item.id+'.jpg', '', item.outfit ? 'outfit-image' : 'prop-image');
}

function wardrobeView() {
  const outfit = outfitById(ui.previewOutfit);
  const item = productById(outfit.id);
  const outfitStatus = itemStatus(item);
  const accessible = state.owned.includes(outfit.id);
  const worn = state.outfit === outfit.id;
  const clothes = OUTFITS.filter(entry => ui.wardrobeFilter === '全部' || entry.group === ui.wardrobeFilter);
  return `${pageHead('换装衣橱', {
    back: 'home', subtitle: '选一套今天的运动穿搭。',
    action: `<a class="button button-outline" href="#bag">${icon('box',18)}${state.owned.length} / ${OUTFITS.length} 套</a>`,
  })}
  <div class="wardrobe-grid">
    <section class="wardrobe-stage card tone-${outfit.color}">
      <div class="wardrobe-preview">
        <div class="wardrobe-copy"><span>试穿预览</span><h2>${outfit.name}</h2><p>${outfit.description}</p>${equippedAccessory()}</div>
        <div class="wardrobe-art"><div class="wardrobe-ring"></div><span class="stage-shadow"></span>${spriteMarkup(outfit,'wardrobe')}</div>
      </div>
      <div class="wardrobe-turn">
        <button class="turn-button" data-action="turn" data-id="wardrobe" data-value="-1" aria-label="向左转">${icon('chevronLeft',16)}</button>
        <span>${icon('rotate',15)}拖动旋转</span>
        <button class="turn-button" data-action="turn" data-id="wardrobe" data-value="1" aria-label="向右转">${icon('chevron',16)}</button>
      </div>
      <div class="wardrobe-actions">
        <button class="button button-outline" data-action="wardrobe-reset">收起</button>
        ${accessible ? `<button class="button ${worn ? 'button-done' : 'button-primary'}" data-action="wear" data-id="${outfit.id}"${worn ? ' disabled' : ''}>${worn ? icon('check',16)+'已穿戴' : '穿戴'}</button>`
        : outfitStatus === 'locked' ? `<button class="button button-done" disabled>${icon('lock',16)}Lv.${outfit.level} 解锁</button>`
        : `<button class="button button-primary" data-action="shop-item" data-id="${outfit.id}">${icon('coin',17)}${outfit.price} 币兑换</button>`}
      </div>
    </section>
    <section class="wardrobe-list">
      ${filterBar(['全部','运动','传统','休闲','节日'],ui.wardrobeFilter,'wardrobe-filter','衣橱分类')}
      <div class="outfit-grid" data-filter="${ui.wardrobeFilter}">${clothes.map(entry => {
        const owned = state.owned.includes(entry.id);
        const locked = itemStatus(productById(entry.id)) === 'locked';
        return `<button class="outfit-card card${entry.id === outfit.id ? ' selected' : ''}" data-action="try-on" data-id="${entry.id}" aria-pressed="${entry.id === outfit.id}">
          <div class="outfit-cover tone-${entry.color}">${img(entry.id+'-0.png')}${entry.id === state.outfit ? `<span class="mini-worn">${icon('check',13)}</span>` : ''}</div>
          <strong>${entry.name}</strong><small>${entry.id === state.outfit ? '已穿戴' : owned ? '已拥有' : locked ? 'Lv.'+entry.level+' 解锁' : entry.price+' 币兑换'}</small>
        </button>`;
      }).join('')}</div>
    </section>
  </div>`;
}

function shopView() {
  const entries = CATALOG.filter(item => ui.shopFilter === '全部' || item.group === ui.shopFilter);
  const cart = cartItems();
  const amount = cart.reduce((sum,item) => sum+item.price,0);
  const missing = amount-state.coins;
  const recent = !cart.length && ui.exchangeReceipt;
  const newOutfit = recent?.length === 1 && recent[0].outfit ? recent[0] : null;
  const equipment = `<a class="icon-button shop-equipment" href="#bag" aria-label="我的装备">${icon('box',20)}</a>`;
  return `${pageHead('道具商城',{back:'home',action:coinPill()+equipment})}
  ${filterBar(['全部','服装','配饰','道具','礼盒'],ui.shopFilter,'shop-filter','商城分类')}
  <div class="shop-grid">${entries.map(item => {
    const status = itemStatus(item);
    const active = ui.cart.has(item.id) && status === 'available';
    return `<button class="product-card card${active ? ' selected' : ''}" data-action="cart" data-id="${item.id}" aria-pressed="${active}"${status !== 'available' ? ' disabled' : ''}>
      <div class="product-image tone-${item.color}">${itemImage(item)}${status === 'available' ? `<span class="product-pick">${icon(active ? 'check' : 'plus',17)}</span>` : ''}</div>
      <div class="product-copy"><h2>${item.name}</h2><p>${item.description}</p>
        <span class="product-status ${status}">${status === 'owned' ? icon('check',15)+' 已拥有' : status === 'locked' ? icon('lock',15)+' Lv.'+item.level+' 解锁' : icon('coin',17)+' '+item.price+' 币'}</span>
      </div>
    </button>`;
  }).join('')}</div>
  <aside class="checkout-bar card" aria-label="兑换结算">
    ${recent ? `<div class="cart-summary">${namedIcon('check','mint',19)}<div><strong>兑换成功</strong><small>${recent.length === 1 ? recent[0].name+'已放入装备' : recent.length+' 件物品已放入装备'}</small></div></div>
      ${newOutfit ? `<button class="button button-primary" data-action="wardrobe-item" data-id="${newOutfit.id}">去穿戴 ${icon('arrow',17)}</button>`
        : `<a class="button button-primary" href="#bag">查看装备 ${icon('arrow',17)}</a>`}`
      : `<div class="cart-summary">${cart.length ? `<div class="cart-pictures">${cart.slice(0,3).map(item => `<span class="tone-${item.color}">${itemImage(item)}</span>`).join('')}</div>` : namedIcon('bag','peach',19)}
        <div><strong>${cart.length ? '已选 '+cart.length+' 件' : '请选择商品'}</strong><small>合计 ${formatNumber(amount)} 训练币</small>${missing > 0 ? `<small class="balance-shortfall">还差 ${formatNumber(missing)} 训练币</small>` : ''}</div></div>
        <button class="button ${missing > 0 ? 'button-outline' : 'button-primary'}" data-action="checkout"${cart.length ? '' : ' disabled'}>${missing > 0 ? '查看已选' : '兑换'} ${icon('arrow',17)}</button>`}
  </aside>`;
}

function bagView() {
  const items = PROPS.filter(item => state.items[item.id] > 0);
  return `${pageHead('我的装备',{back:'me',subtitle:'查看已解锁的穿搭、配饰和补给。',action:`<a class="button button-outline" href="#shop">${icon('bag',18)}逛商城</a>`})}
  <div class="section-heading"><h2>服装</h2><a class="text-link" href="#wardrobe">打开衣橱 ${icon('arrow',17)}</a></div>
  <div class="equipment-outfits">${state.owned.map(id => {
    const outfit = outfitById(id);
    return `<button class="outfit-card card" data-action="wardrobe-item" data-id="${id}"><div class="outfit-cover tone-${outfit.color}">${img(id+'-0.png')}</div><strong>${outfit.name}</strong><small>${state.outfit === id ? '已穿戴' : '去试穿'}</small></button>`;
  }).join('')}</div>
  <div class="section-heading block-heading"><h2>配饰与道具</h2></div>
  ${items.length ? `<div class="equipment-grid">${items.map(item => `<article class="equipment-card card">
    <div class="equipment-picture tone-${item.color}">${itemImage(item)}</div>
    <div><h3>${item.name} <small>×${state.items[item.id]}</small></h3><p>${item.description}</p>
      ${item.consumable ? `<button class="button button-outline compact" data-action="use-item" data-id="${item.id}">${item.id === 'gift' ? '打开礼盒' : '使用'}</button>`
       : item.wearable ? `<button class="button button-outline compact" data-action="wear-accessory" data-id="${item.id}">${state.accessory === item.id ? '取下' : '穿戴'}</button>` : ''}
    </div>
  </article>`).join('')}</div>` : emptyState('ruiang-shop.png','背包里还没有道具','到道具商城看看','shop','去商城')}`;
}

function emblem(badge, unlocked) {
  const symbol = badge.id === 'lion' || badge.id === 'warrior' ? img('ruiang-face.png') : icon(badge.icon,34);
  return `<span class="emblem ${unlocked ? 'tone-'+badge.color : 'locked'}"><span>${symbol}</span></span>`;
}

function badgesView() {
  return `${pageHead('成就勋章',{back:'me',action:`<span class="count-pill">${icon('award',19)}<b>${state.badges.length}</b> / ${BADGES.length}</span>`})}
  <section class="badge-summary card"><div>${namedIcon('spark','gold')}<span>成长等级<strong>Lv.${levelInfo().level}</strong></span></div><div>${namedIcon('flame','peach')}<span>连续打卡<strong>${currentStreak()} 天</strong></span></div></section>
  <div class="badge-grid">${BADGES.map(badge => {
    const unlocked = state.badges.includes(badge.id);
    return `<button class="badge-card card" data-action="badge" data-id="${badge.id}">${emblem(badge,unlocked)}<h2>${badge.name}</h2><span class="text-tag ${unlocked ? 'tone-gold' : 'tone-neutral'}">${unlocked ? '已获得' : '未解锁'}</span></button>`;
  }).join('')}</div>`;
}

function growthView() {
  const { level, stage:current } = levelInfo();
  const preview = STAGES.find(stage => stage.level === ui.growthStage) || current;
  const reached = STAGES.indexOf(current);
  const slot = STAGES.indexOf(preview);
  const next = STAGES[reached+1];
  const locked = preview.level > level;
  const fruit = productById('fruit');
  const fruitCount = state.items.fruit || 0;
  const milestone = preview === current
    ? next ? `<span>下一阶段</span><strong>${next.name} · Lv.${next.level}</strong>` : '<strong>已解锁全部成长阶段</strong>'
    : locked ? `<span>达到 Lv.${preview.level} 解锁</span><strong>还差 ${formatNumber(LEVELS[preview.level-1]-state.xp)} 经验</strong>`
    : `<span>Lv.${preview.level} 达成</span><strong>当前为${current.name}</strong>`;
  return `${pageHead('成长旅程',{
    back:'me',
    action:`<a class="button button-primary" href="#train">去训练 ${icon('arrow',17)}</a>`,
  })}
  <section class="card growth-path" aria-labelledby="path-title">
    <div class="section-heading"><h2 id="path-title">成长阶段</h2><span>已解锁 <b>${reached+1} / ${STAGES.length}</b></span></div>
    <div class="stage-steps" role="tablist" aria-label="预览成长阶段" style="--slots:${STAGES.length};--slot:${slot};--reached:${reached/(STAGES.length-1)*100}%">
      <span class="stage-track" aria-hidden="true"></span>
      <span class="selection-indicator" data-indicator="stages" data-index="${slot}" aria-hidden="true"></span>
      ${STAGES.map(stage => {
        const active = stage === preview;
        const isCurrent = stage === current;
        const hasReached = stage.level <= level;
        return `<button id="stage-tab-${stage.level}" class="stage-step tone-${stage.color}${hasReached ? ' reached' : ''}${isCurrent ? ' current' : ''}" type="button" role="tab" aria-selected="${active}" aria-controls="stage-preview" tabindex="${active ? 0 : -1}" data-action="growth-stage" data-id="${stage.level}">
          <span class="stage-medallion">${icon(stage.icon,22)}</span><strong>${stage.name}</strong><small>${isCurrent ? '当前阶段' : hasReached ? '已达成' : 'Lv.'+stage.level}</small>
        </button>`;
      }).join('')}
    </div>
  </section>
  <div class="growth-layout">
    <section id="stage-preview" class="growth-preview tone-${preview.color}" role="tabpanel" aria-labelledby="stage-tab-${preview.level}" tabindex="0" data-stage="${preview.level}">
      <div class="growth-art">${img('sport-0.png','身穿原始红白运动套装的醒狮少年瑞昂','growth-portrait')}<span class="growth-art-badge" aria-hidden="true">${icon(preview.icon,29)}</span></div>
      <div class="growth-copy">
        <span class="growth-state">${icon(preview === current ? 'spark' : locked ? 'lock' : 'check',15)}${preview === current ? '当前阶段 · Lv.'+level : locked ? '阶段预览' : '已解锁'}</span>
        <h2>${preview.name}</h2>
        <div class="growth-milestone">${milestone}</div>
      </div>
    </section>
    <aside class="growth-side">
      ${levelCard()}
      <section class="card growth-boost">
        ${itemImage(fruit)}
        <div><h2>能量果 <small>×${fruitCount}</small></h2><p>每颗 +40 经验</p></div>
        ${fruitCount ? '<button class="button button-outline compact" data-action="use-item" data-id="fruit">使用</button>' : '<a class="button button-outline compact" href="#shop">去商城</a>'}
      </section>
    </aside>
  </div>`;
}

function emptyState(art,title,copy,page,action) {
  return `<section class="empty-state card">${img(art)}<div><h2>${title}</h2><p>${copy}</p><a class="button button-primary" href="#${page}">${action} ${icon('arrow',17)}</a></div></section>`;
}

function recordsView() {
  const history = [...state.history].reverse();
  const minutes = Math.round(history.reduce((sum,log) => sum+log.seconds,0)/60);
  return `${pageHead('运动记录',{back:'me',subtitle:'回顾每一次完成的训练。'})}
    ${!history.length ? emptyState('ruiang-rest.png','还没有运动记录','去完成第一次训练吧。','train','去训练') : `
      <div class="record-summary">
        <div class="card">${namedIcon('activity','rose')}<span>累计训练</span><strong>${history.length}<small> 次</small></strong></div>
        <div class="card">${namedIcon('clock','gold')}<span>训练时长</span><strong>${minutes}<small> 分钟</small></strong></div>
        <div class="card">${namedIcon('flame','peach')}<span>最长连续打卡</span><strong>${longestStreak()}<small> 天</small></strong></div>
      </div>
      <div class="card record-list">${history.map(log => {
        const course = courseById(log.course);
        return `<a class="record-row" href="#result/${log.id}">${namedIcon(course.icon,course.color)}<span><strong>${course.name}</strong><small>${friendlyDate(log.date)} · ${formatDuration(log.seconds)}</small></span>${icon('chevron',18)}</a>`;
      }).join('')}</div>`}`;
}

function settingsView() {
  return `${pageHead('设置',{back:'me'})}
  <form class="card settings-card" data-form="settings">
    <label class="field"><span>昵称</span><input name="name" maxlength="16" autocomplete="off" value="${esc(state.name)}" required></label>
    <label class="setting-toggle"><span><strong>语音提示</strong><small>在训练换组时播报动作名称</small></span><input type="checkbox" name="voice" role="switch"${state.voice ? ' checked' : ''}></label>
    <label class="setting-toggle"><span><strong>应用内训练提醒</strong><small>在消息通知中显示今天的待练课程</small></span><input type="checkbox" name="reminders" role="switch"${state.reminders ? ' checked' : ''}></label>
    <button class="button button-primary" type="submit">保存设置</button>
  </form>
  <button class="card profile-link settings-help" data-action="guide">${namedIcon('help','gold')}<strong>使用引导</strong>${icon('chevron',18)}</button>`;
}

function workoutView(course, session) {
  const exercise = exerciseFor(course,session.step);
  const pace = ui.pace;
  const completed = session.step + (session.rest ? 1 : (1 - session.remaining/exercise.seconds));
  const back = `<a class="back-link" href="${hashFor('course',course.id,{plan:session.plan,session:session.id})}">${icon('arrowLeft',18)}<span>保存并返回</span></a>`;
  if (session.rest) {
    const next = exerciseFor(course,session.step+1);
    return `<header class="training-top">${back}<strong>${course.name}</strong><span>${session.step+1} / ${course.exercises.length} 已完成</span></header>
      <section class="rest-card">
        <div class="rest-decoration" aria-hidden="true">${icon('drop',128)}</div>
        ${namedIcon('drop','mint',27)}
        <h1>组间休息</h1><p>喝口水，准备下一个动作。</p>
        <div class="rest-timer" id="workout-timer">${formatClock(session.remaining)}</div>
        ${progressBar(session.remaining/REST_SECONDS*100,'mint','休息倒计时')}
        <p class="rest-next">接下来 · <strong>${next.title}</strong></p>
        <div class="rest-actions"><button class="button button-outline" data-action="play-workout">${icon(ui.playing ? 'pause' : 'triangle',18)}${ui.playing ? '暂停' : '继续计时'}</button><button class="button button-primary" data-action="skip-rest">跳过休息 ${icon('arrow',17)}</button></div>
      </section>`;
  }
  const frames = workoutFrames(exercise);
  const position = frameIndex(session,exercise);
  const activePhoto = frames[Math.min(position,frames.length-1)];
  const currentAngle = ui.angle === 'side' ? Boolean(exercise.side) : !exercise.front;
  const coach = COACH_NAMES[exercise.coach];
  const finalMove = session.step+1 === course.exercises.length;
  return `<header class="training-top">${back}<strong>${course.name}</strong><span>第 ${session.step+1} / ${course.exercises.length} 个动作</span></header>
  ${progressBar(completed/course.exercises.length*100,'red','课程进度')}
  <div class="workout-grid">
    <section class="coach-card card">
      <div class="coach-stage${ui.mirror ? ' mirrored' : ''}">
        <div class="coach-backdrop"></div>
        <img id="coach-frame" src="${ASSETS}coach-${activePhoto}.jpg" alt="${coach}的${exercise.name}示范">
        <span class="coach-label">${icon('camera',15)}${coach} · ${currentAngle ? '侧面' : '正面'}</span>
        <button class="camera-tile${ui.camera ? ' camera-live' : ''}" data-action="camera" aria-label="${ui.camera ? '关闭摄像头' : '开启摄像头'}">
          <video id="camera-video" muted autoplay playsinline></video>
          <span>${icon('camera',20)}<small>${ui.camera ? '关闭镜头' : ui.cameraPending ? '正在开启' : '镜头对照'}</small></span>
        </button>
      </div>
      <div class="workout-tools">
        <button class="tool-button${ui.breakdown ? ' selected' : ''}" data-action="breakdown" aria-pressed="${ui.breakdown}">${icon('step',19)}${ui.breakdown ? '退出拆解' : '分步拆解'}</button>
        <button class="tool-button" data-action="view-angle"${exercise.front && exercise.side ? '' : ' disabled'}>${icon('rotate',19)}视角切换</button>
        <button class="tool-button${ui.mirror ? ' selected' : ''}" data-action="mirror" aria-pressed="${ui.mirror}">${icon('mirror',19)}镜像</button>
        <button class="tool-button speed-button" data-action="speed" aria-label="切换示范倍速，当前 ${pace} 倍"><b>${pace}×</b>倍速</button>
      </div>
    </section>
    <section class="card workout-panel">
      <div class="workout-clock-row">
        <div><span class="text-tag tone-${course.color}">${course.group} · 第 ${session.step+1} 组</span><h1>${exercise.title}</h1></div>
        <div class="workout-timer" id="workout-timer">${formatClock(session.remaining)}</div>
      </div>
      <div class="player-buttons">
        <button class="icon-button" data-action="prev-move" aria-label="上一个动作"${session.step ? '' : ' disabled'}>${icon('chevronLeft',23)}</button>
        <button class="play-button" data-action="play-workout" aria-label="${ui.playing ? '暂停计时' : '继续计时'}">${icon(ui.playing ? 'pause' : 'triangle',27)}</button>
        <button class="button button-outline next-motion" data-action="next-move">${finalMove ? '完成训练' : '下一个动作'} ${icon(finalMove ? 'check' : 'arrow',18)}</button>
      </div>
      ${ui.breakdown ? '<p class="breakdown-note">计时已暂停，点选动作要点查看分步示范。</p>' : ''}
      <div class="line-heading workout-points-heading"><h2>动作要点</h2><div class="mini-controls">
        <button class="icon-button${ui.metronome ? ' soft-red' : ''}" data-action="metronome" aria-pressed="${ui.metronome}" aria-label="节拍器" title="节拍器">${icon('metronome',18)}</button>
        <button class="icon-button${state.voice ? ' soft-red' : ''}" data-action="voice" aria-pressed="${state.voice}" aria-label="语音提示" title="语音提示">${icon(state.voice ? 'sound' : 'mute',18)}</button>
      </div></div>
      <ol class="motion-points">${exercise.steps.map((line,index) => `<li class="${ui.breakdown && position === index ? 'current' : ''}">${ui.breakdown ? `<button data-action="frame" data-value="${index}" aria-pressed="${position === index}"><b>${index+1}</b><span>${line}</span></button>` : `<b>${index+1}</b><span>${line}</span>`}</li>`).join('')}</ol>
    </section>
  </div>`;
}

function resultView(log) {
  const course = courseById(log.course);
  return `${pageHead('训练结果',{back:'train'})}
  <section class="result-card card">
    <div class="result-hero"><div><span class="hero-kicker">${icon('spark',16)}${course.name}</span>
      <h2>训练完成！</h2><p>瑞昂为你的坚持喝彩。</p></div>${img('ruiang-celebrate.png','欢庆的醒狮少年瑞昂')}</div>
    <div class="result-body">
      <div class="result-stats"><div><span>本次时长</span><strong>${formatDuration(log.seconds)}</strong></div><div><span>估算消耗</span><strong>${log.calories} <small>千卡</small></strong></div></div>
      <ul class="reward-list">
        <li>${namedIcon('spark','gold',18)}<span>成长经验</span><b>+${log.xp}</b></li>
        <li>${namedIcon('coin','gold',18)}<span>训练币</span><b>+${log.coins}</b></li>
        <li>${namedIcon('flame','peach',18)}<span>连续打卡</span><b>${log.streak} 天</b></li>
      </ul>
      ${log.levelUp ? `<a class="result-growth" href="#growth">${namedIcon('spark','gold',18)}<span><strong>升级至 Lv.${log.levelUp}</strong>${log.stageUnlocked ? `<small>解锁${esc(log.stageUnlocked)}</small>` : ''}</span>${icon('chevron',17)}</a>` : ''}
      <div class="result-actions"><a class="button button-outline" href="${hashFor('plan',log.plannedDate || log.date)}">查看计划</a><a class="button button-primary" href="#home">完成 ${icon('check',18)}</a></div>
    </div>
  </section>`;
}

