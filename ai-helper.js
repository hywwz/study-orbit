/* Study Orbit: optional ChatGPT handoff. No API keys, calls, or note uploads. */
(() => {
  'use strict';
  if (document.getElementById('so-ai-dock')) return;
  const home = document.createElement('div');
  home.id = 'so-ai-dock';
  home.innerHTML = `
    <button type="button" class="so-ai-fab" id="so-ai-open" aria-controls="so-ai-panel" aria-expanded="false">✦ 问 AI</button>
    <div class="so-ai-dim" id="so-ai-dim" hidden></div>
    <aside class="so-ai-panel" id="so-ai-panel" aria-label="学习 AI 助教入口" aria-hidden="true">
      <div class="so-ai-header">
        <div><span class="so-ai-eyebrow">STUDY COMPANION</span><h2>随时问 AI 助教</h2></div>
        <button type="button" id="so-ai-close" aria-label="关闭助教侧栏" class="so-ai-close">×</button>
      </div>
      <div class="so-ai-main">
        <div class="so-ai-note">已帮你整理当前课程的上下文。这里是<strong>提问助手</strong>，不是站内直接聊天；复制后可在 ChatGPT 粘贴提问。</div>
        <div class="so-ai-context">
          <span>正在学习</span>
          <strong id="so-ai-context-title">当前课程</strong>
          <p id="so-ai-context-step"></p>
        </div>
        <div class="so-ai-chips">
          <button type="button" data-so-ai-preset="explain">完全看不懂，先解释</button>
          <button type="button" data-so-ai-preset="next">下一步点哪里？</button>
          <button type="button" data-so-ai-preset="error">帮我定位报错</button>
        </div>
        <label class="so-ai-label" for="so-ai-question">你现在卡在哪里？</label>
        <textarea id="so-ai-question" rows="6" placeholder="例如：我不知道什么是 base_commit，也不知道 GitHub 上该点哪里。请先教我第一步。"></textarea>
        <button type="button" class="so-ai-primary" id="so-ai-copy">① 复制带课程上下文的问题</button>
        <a class="so-ai-link" id="so-ai-chatgpt" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">② 打开 ChatGPT，粘贴后发送 ↗</a>
        <p class="so-ai-feedback" id="so-ai-feedback" aria-live="polite"></p>
        <details class="so-ai-preview"><summary>查看即将复制的完整问题</summary><pre id="so-ai-preview-text"></pre></details>
        <p class="so-ai-privacy">不会自动读取你的学习笔记，也不会自动发送数据。请勿粘贴密码、API Key 或私人信息。你可以在原课程中继续浏览步骤。</p>
      </div>
    </aside>`;
  document.body.appendChild(home);
  const get = id => document.getElementById(id);
  const panel = get('so-ai-panel');
  const trigger = get('so-ai-open');
  const dim = get('so-ai-dim');
  const question = get('so-ai-question');
  const preview = get('so-ai-preview-text');
  const status = get('so-ai-feedback');
  let context = {};
  function describeLesson() {
    const sprintContext=window.Sprint?.context();
    if(sprintContext)return sprintContext;
    const guideTitle = document.querySelector('.guide-hero h1');
    const isGuide = !!guideTitle;
    const title = (guideTitle || document.querySelector('.section-header h1') || document.querySelector('.page-title'))?.textContent?.trim() || '星轨今日学习';
    if (isGuide) {
      const intro = document.querySelector('.guide-hero > p')?.textContent?.trim() || '';
      const unchecked = [...document.querySelectorAll('.guide-step-check input[type="checkbox"]')].find(el => !el.checked);
      const item = unchecked?.closest('.guide-step') || document.querySelector('.guide-step');
      const step = item?.querySelector('.guide-step-title')?.textContent?.trim() || '';
      const action = item?.querySelector('.guide-step-do')?.textContent?.trim() || '';
      const verify = item?.querySelector('.guide-verify p')?.textContent?.trim() || '';
      const project = document.querySelector('.guide-header .pill')?.textContent?.trim() || '';
      return {title, project, intro, step, action, verify};
    }
    const mainTask = document.querySelector('.task-details');
    if (mainTask) {
      const card = mainTask.closest('.panel');
      return {
        title: card?.querySelector('h2')?.textContent?.trim() || title,
        project: card?.querySelector('.pill')?.textContent?.trim() || '',
        intro: mainTask.textContent.trim(),
        step: '今天的项目任务',
        action: card?.querySelector('.highlight-line')?.textContent?.trim() || '',
        verify: [...card.querySelectorAll('.highlight-line')].at(-1)?.textContent?.trim() || ''
      };
    }
    return {title, project: '星轨学习网站', intro: '', step: '', action: '', verify: ''};
  }
  function makePrompt() {
    const q = question.value.trim() || '我看不懂当前这一步，请从最基础的概念开始教我操作。';
    return [
      '我正在用「星轨 Study Orbit」准备 AI 应用 / AI Agent 开发实习，希望你作为我的手把手编程助教。',
      '我目前需要从零逐步完成项目，请不要假设我已经懂 GitHub、Python 项目结构或相关术语。',
      '【当前课程】' + context.title,
      context.project ? '【项目】' + context.project : '',
      context.intro ? '【课程背景】' + context.intro : '',
      context.step ? '【当前小步骤】' + context.step : '',
      context.action ? '【需要做的事】' + context.action : '',
      context.verify ? '【验收要求】' + context.verify : '',
      '【我卡住的问题】' + q,
      '【教学要求】先用简单语言解释必要术语，再给出当前最小的一个操作，具体到打开哪里、点击哪里、文件放哪、命令怎么运行；我完成后再继续下一步。核心代码优先让我自己动手，错误先排查原因。请不要直接给我一大篇无法执行的任务清单。'
    ].filter(Boolean).join('\n\n');
  }
  function refresh() {
    context = describeLesson();
    get('so-ai-context-title').textContent = context.title;
    get('so-ai-context-step').textContent = [context.project,context.step].filter(Boolean).join(' · ') || '打开课程后可自动带上具体任务';
    preview.textContent = makePrompt();
  }
  function open() {
    refresh();
    panel.classList.add('so-ai-visible');
    panel.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    dim.hidden = false;
    status.textContent = '';
    question.focus({preventScroll:true});
  }
  function close() {
    panel.classList.remove('so-ai-visible');
    panel.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    dim.hidden = true;
    trigger.focus({preventScroll:true});
  }
  trigger.addEventListener('click', () => panel.classList.contains('so-ai-visible') ? close() : open());
  get('so-ai-close').addEventListener('click', close);
  dim.addEventListener('click', close);
  document.addEventListener('keydown', event => { if(event.key === 'Escape' && panel.classList.contains('so-ai-visible')) close(); });
  question.addEventListener('input', () => { preview.textContent = makePrompt(); });
  document.querySelectorAll('[data-so-ai-preset]').forEach(button => button.addEventListener('click', () => {
    const presets = {
      explain: '我完全看不懂这一步。请先解释其中的技术名词，举一个最简单的真实例子，然后只教我第一小步。',
      next: '我准备动手，请结合这节课的内容，告诉我下一步具体打开哪个网站、点击哪里、在哪个文件里写什么。一次只讲一步。',
      error: '我在执行当前步骤时出错了。请先告诉我需要复制哪些报错、命令和文件内容，按排查顺序定位原因，不要猜。'
    };
    question.value = presets[button.dataset.soAiPreset] || '';
    refresh();
    question.focus();
  }));
  get('so-ai-copy').addEventListener('click', async () => {
    refresh();
    const prompt = makePrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      status.textContent = '已复制。现在点下方“打开 ChatGPT”，粘贴并发送即可。';
    } catch {
      status.textContent = '浏览器不允许自动复制。请长按下面预览中的文本，手动复制后在 ChatGPT 粘贴。';
      document.querySelector('.so-ai-preview').open = true;
    }
  });
  window.addEventListener('hashchange', () => { if (panel.classList.contains('so-ai-visible')) refresh(); });
})();
