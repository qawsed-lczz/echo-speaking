import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9223;
const APP_URL = 'http://127.0.0.1:8099';
const OUT = path.resolve('shots');
const PROFILE = path.resolve('.edge-profile');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(OUT, { recursive: true });

const edge = spawn(
  EDGE,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--window-size=390,844',
    'about:blank',
  ],
  { stdio: 'ignore', detached: false }
);

const waitForTarget = async () => {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch {}
    await sleep(400);
  }
  throw new Error('Edge CDP did not start');
};

const page = await waitForTarget();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let nextId = 1;
const pending = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, (msg) => {
      if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
      else resolve(msg.result);
    });
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return result.result?.value;
};

const clickText = async (text) => {
  const value = await evaluate(`(() => {
    const wanted = ${JSON.stringify(text)};
    const nodes = [...document.querySelectorAll('div,span,button,a')];
    const exact = nodes.find((el) => el.textContent?.trim() === wanted && el.children.length === 0);
    const loose = nodes.find((el) => el.textContent?.includes(wanted));
    const el = exact || loose;
    if (!el) return 'missing';
    const target = el.closest('[role="button"],[role="tab"],button,a') || el;
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    return 'ok';
  })()`);
  if (value !== 'ok') throw new Error(`clickText failed: ${text} (${value})`);
  await sleep(650);
};

const shot = async (name) => {
  const { data } = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const file = path.join(OUT, `${name}.png`);
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  console.log('saved', file);
};

const scroll = async (y) => {
  await evaluate(`(() => {
    const nodes = [...document.querySelectorAll('div')];
    const el = nodes.find((d) => d.scrollHeight > d.clientHeight + 80 && ['auto','scroll'].includes(getComputedStyle(d).overflowY));
    if (el) el.scrollTop = ${y};
    return el ? 'ok' : 'none';
  })()`);
  await sleep(500);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await send('Page.navigate', { url: APP_URL });
await sleep(3500);
await evaluate('document.fonts.ready.then(() => true)');

await shot('01-onboarding');
await clickText('开始定位 · 约 1 分钟');
await shot('02-level');
await clickText('继续');
await shot('03-quiz');
await clickText('变成轻快的闪音，听起来像 d');
await shot('04-quiz-answered');
await clickText('下一题');
await clickText('在 n 前只做口型、不爆破');
await clickText('下一题');
await clickText('/kʊdʒə/');
await clickText('下一题');
await clickText('前两项升，最后一项降');
await clickText('下一题');
await clickText('going to');
await clickText('生成我的计划');
await shot('05-plan');
await clickText('进入今天');
await sleep(900);
await shot('06-home');
await evaluate(`document.querySelector('[aria-label^="练习 "]')?.click()`);
await sleep(900);
await shot('07-lesson');
await scroll(520);
await shot('08-lesson-lower');
for (let i = 0; i < 5; i += 1) {
  await evaluate(`document.querySelector('[aria-label="自评：很顺"]')?.click()`);
  await sleep(650);
}
await shot('09-finished');
await clickText('回到今天');
await sleep(800);
await shot('09b-home-done');
await clickText('句库');
await shot('10-library');
await evaluate(`document.querySelector('[aria-label="打开 连读 章节"]')?.click()`);
await sleep(700);
await shot('11-module');
await evaluate(`document.querySelector('[aria-label="返回"]')?.click()`);
await sleep(700);
await clickText('进度');
await shot('12-progress');
await evaluate(`document.querySelector('[aria-label="打开设置"]')?.click()`);
await sleep(700);
await shot('13-settings');

console.log('done');
ws.close();
edge.kill();
process.exit(0);
