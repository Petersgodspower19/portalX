import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Run against a local dev server and a disposable headless Edge debugging session.
// All /api/v1 requests are intercepted. No live records or credentials are used.
const tabs = await (await fetch('http://localhost:9333/json/list')).json();
const target = tabs.find((tab) => tab.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
const requests = [];
const exceptions = [];
let role = 'form_teacher';
let status = null;
let locked = false;
let failSubmission = false;
const classInfo = { id: 'class-1', name: 'JSS 1', arm: 'A', full_name: 'JSS 1 A' };
const resultRows = [
  { id: 'r1', student_id: 's1', student_name: 'Ada Okafor', reg_number: 'TM/2026/001', subject_id: 'math', subject_name: 'Mathematics', ca1_score: 18, ca2_score: 17, exam_score: 54, total_score: 89, grade: 'A' },
  { id: 'r2', student_id: 's1', student_name: 'Ada Okafor', reg_number: 'TM/2026/001', subject_id: 'eng', subject_name: 'English', ca1_score: 16, ca2_score: 18, exam_score: 49, total_score: 83, grade: 'A' },
];
function send(method, params = {}) {
  const key = ++id;
  return new Promise((resolve, reject) => {
    pending.set(key, { resolve, reject });
    ws.send(JSON.stringify({ id: key, method, params }));
  });
}
ws.onmessage = async ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const task = pending.get(message.id); pending.delete(message.id);
    if (message.error) task.reject(new Error(JSON.stringify(message.error))); else task.resolve(message.result);
  }
  if (message.method === 'Runtime.exceptionThrown' && message.params.exceptionDetails.url !== 'about:blank') exceptions.push(message.params.exceptionDetails.text);
  if (message.method !== 'Fetch.requestPaused') return;
  const { requestId, request } = message.params;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/v1', '');
  const headers = [
    { name: 'Content-Type', value: 'application/json' },
    { name: 'Access-Control-Allow-Origin', value: '*' },
    { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type' },
    { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
  ];
  let response = {}, code = 200;
  if (request.method === 'OPTIONS') code = 204;
  else {
    requests.push({ path, method: request.method, query: Object.fromEntries(url.searchParams), body: request.postData });
    if (path === '/auth/me') response = { id: 'user-1', role, first_name: 'Alex', last_name: 'Morgan', must_change_password: false };
    else if (path === '/school/terms/current') response = { id: 'term-1', name: 'First term', is_locked: locked };
    else if (path === '/classes/my-class') response = classInfo;
    else if (path === '/classes') response = [classInfo];
    else if (path === '/results/pending') response = status === 'submitted' ? [{ class_id: 'class-1', class_name: 'JSS 1 A', term_id: 'term-1', subject_id: 'math' }, { class_id: 'class-1', class_name: 'JSS 1 A', term_id: 'term-1', subject_id: 'eng' }] : [];
    else if (path === '/results/class') response = resultRows;
    else if (path === '/results/upload/class/class-1') { status = 'draft'; response = { submission_id: 'sub-1', class_id: 'class-1', term_id: 'term-1', version: 1, status: 'DRAFT', rows_saved: 2 }; }
    else if (path === '/results/submissions/class/class-1') {
      if (failSubmission) { code = 500; response = { detail: 'Could not load this submission' }; }
      else if (!status) { code = 404; response = { detail: 'No submission yet' }; }
      else response = { submission_id: 'sub-1', class_id: 'class-1', term_id: 'term-1', version: 1, status: status.toUpperCase(), student_count: 1, subject_count: 2, result_count: 2, rejection_reason: status === 'rejected' ? 'Check the exam marks.' : null };
    }
    else if (path.endsWith('/submit')) { status = 'submitted'; response = { message: 'Submitted' }; }
    else if (path.endsWith('/approve')) { status = 'approved'; response = { message: 'Approved' }; }
    else if (path.endsWith('/reject')) { status = 'rejected'; response = { message: 'Rejected' }; }
    else if (path.endsWith('/unlock')) { locked = false; response = { message: 'Unlocked' }; }
    else if (path.endsWith('/lock')) { locked = true; response = { message: 'Locked' }; }
  }
  await send('Fetch.fulfillRequest', { requestId, responseCode: code, responseHeaders: headers, body: Buffer.from(code === 204 ? '' : JSON.stringify(response)).toString('base64') });
};
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(expression) {
  const end = Date.now() + 30000;
  while (Date.now() < end) { try { if (await evaluate(`document.body && (${expression})`)) return; } catch { /* Navigation can briefly replace the execution context. */ } await delay(150); }
  throw new Error(`Timed out: ${expression}\n${await evaluate('document.body.innerText')}`);
}
async function click(text, scope = 'document') {
  const found = await evaluate(`(() => {const button = [...${scope}.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}); if (!button || button.disabled) return false; button.click(); return true;})()`);
  assert.ok(found, `Enabled button: ${text}`);
}
async function input(selector, value) {
  await evaluate(`(() => {const el = document.querySelector(${JSON.stringify(selector)}); const type = el.tagName === 'SELECT' ? HTMLSelectElement : HTMLTextAreaElement; Object.getOwnPropertyDescriptor(type.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true}));})()`);
}
async function openClass() {
  await click('Class workspace'); await input('#results-class', 'class-1');
  await waitFor(`document.body.innerText.includes('Review class results') || document.body.innerText.includes('Start with your class template') || document.body.innerText.includes('Could not load this submission')`);
}
async function navigate() {
  await send('Page.navigate', { url: 'http://localhost:3000/results' });
  await waitFor(`document.body.innerText.includes(${JSON.stringify(role === 'form_teacher' ? 'Your class results' : 'Results workspace')}) && !document.body.innerText.includes('Loading your results workspace')`);
}
await send('Page.enable'); await send('Runtime.enable');
await send('Fetch.enable', { patterns: [{ urlPattern: '*api/v1/*', requestStage: 'Request' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('token', 'test-session'); localStorage.removeItem('refresh_token');` });
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
await mkdir(new URL('./fixtures/', import.meta.url), { recursive: true });
const fixture = resolve('tests/fixtures/class-results.csv');
await writeFile(fixture, 'reg_number,subject,ca1,ca2,exam\nTM/2026/001,Mathematics,18,17,54\n');
async function chooseFile() {
  const { root } = await send('DOM.getDocument');
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: '#class-results-file' });
  await send('DOM.setFileInputFiles', { nodeId, files: [fixture] });
}
try {
  await navigate();
  await waitFor(`!!document.querySelector('#class-results-file')`);
  await chooseFile(); await click('Save class draft');
  await waitFor(`document.body.innerText.includes('Review class results')`);
  assert.equal(await evaluate(`document.querySelector('button').textContent === 'Approve class results'`), false);
  await waitFor(`document.body.innerText.includes('Mathematics') && document.body.innerText.includes('English')`);
  await evaluate(`document.querySelector('input[type=checkbox]').click()`);
  await click('Submit for review');
  await waitFor(`!!document.querySelector('[role=dialog]')`);
  await click('Submit for review', `document.querySelector('[role=dialog]')`);
  await waitFor(`document.body.innerText.includes('Submitted for review')`);
  assert.equal(status, 'submitted');
  assert.equal(await evaluate(`!!document.querySelector('#class-results-file')`), false);
  console.log('PASS teacher: upload draft, inspect subjects and scores, review and submit separately');

  role = 'principal'; await navigate();
  await waitFor(`document.body.innerText.includes('Review class')`);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Review class').length`), 1);
  await click('Review class'); await waitFor(`document.body.innerText.includes('Approve class results')`);
  await click('Approve class results'); await click('Approve results', `document.querySelector('[role=dialog]')`);
  await waitFor(`document.body.innerText.includes('Results approved')`);
  console.log('PASS principal: deduplicated queue and class-wide approval');
  const desktop = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile(resolve('../results-desktop-preview.png'), Buffer.from(desktop.data, 'base64'));

  role = 'vice_principal'; status = 'submitted'; await navigate();
  await click('Review class'); await waitFor(`document.body.innerText.includes('Return for correction')`);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(b => b.textContent.includes('Approve class results'))`), false);
  assert.equal(await evaluate(`!!document.querySelector('#class-results-file')`), false);
  await click('Return for correction');
  assert.ok(await evaluate(`document.querySelector('[role=dialog] button[type=submit]')?.disabled ?? [...document.querySelectorAll('[role=dialog] button')].at(-1).disabled`));
  await input('[role=dialog] textarea', 'Check the exam marks.');
  await click('Return for correction', `document.querySelector('[role=dialog]')`);
  await waitFor(`document.body.innerText.includes('Changes requested')`);
  console.log('PASS vice principal: review access, required rejection reason, no approval or upload');
  role = 'form_teacher'; await navigate();
  await waitFor(`document.body.innerText.includes('Changes requested')`);
  await click('Upload corrected file'); await chooseFile(); await click('Save class draft');
  await waitFor(`document.body.innerText.includes('Mathematics') && !!document.querySelector('input[type=checkbox]')`);
  await evaluate(`document.querySelector('input[type=checkbox]').click()`);
  await click('Submit for review');
  await click('Submit for review', `document.querySelector('[role=dialog]')`);
  await waitFor(`document.body.innerText.includes('Submitted for review')`);
  console.log('PASS corrections: teacher replaces a rejected file, reviews the new draft and resubmits');


  role = 'principal'; status = null; await navigate(); await openClass();
  await waitFor(`!!document.querySelector('#class-results-file')`); await chooseFile();
  assert.ok(await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Save class draft')).disabled`));
  await input('textarea', 'Uploading because the teacher is absent.'); await click('Save class draft');
  await waitFor(`document.body.innerText.includes('Review class results')`);
  console.log('PASS principal: upload requires an on-behalf reason');
  await click('Lock term'); await click('Lock term', `document.querySelector('[role=dialog]')`);
  await waitFor(`document.body.innerText.includes('This term is locked')`);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Submit for review')`), false);
  await click('Unlock term'); await input('[role=dialog] textarea', 'Correct a score entry.');
  await click('Unlock term', `document.querySelector('[role=dialog]')`);
  await waitFor(`document.body.innerText.includes('Open for results')`);
  assert.deepEqual(JSON.parse(requests.findLast(r => r.path.endsWith('/unlock')).body), { unlock_reason: 'Correct a score entry.' });
  console.log('PASS term controls: lock disables changes and unlock sends required reason');

  failSubmission = true; await navigate(); await openClass();
  await waitFor(`document.body.innerText.includes('Could not load this submission')`);
  assert.ok(await evaluate(`[...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Download template' && !b.disabled)`), 'Template download stays available when submission status fails');
  assert.equal(await evaluate(`!!document.querySelector('#class-results-file')`), false);
  assert.equal(await evaluate(`document.body.innerText.includes('No submission yet')`), false);
  console.log('PASS failed reads: error shown instead of false empty state or upload action');
  failSubmission = false; role = 'form_teacher'; status = 'draft';
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate(); await waitFor(`document.body.innerText.includes('Review class results')`);
  assert.ok(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), 'No page-level horizontal overflow on mobile');
  const mobile = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile(resolve('../results-mobile-preview.png'), Buffer.from(mobile.data, 'base64'));
  assert.equal(requests.some(r => r.path === '/results/upload' || r.path === '/results/confirm' || r.path === '/results/approve' || r.path === '/results/reject'), false);
  assert.equal(exceptions.length, 0, exceptions.join('\n'));
  console.log('PASS mobile: responsive layout, no old single-subject calls, no runtime exceptions');
} finally { await send('Page.navigate', { url: 'about:blank' }).catch(() => {}); ws.close(); }
