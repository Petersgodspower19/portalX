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
let failPending = false;
let failRejection = false;
let pendingStudents = [
 { id: 'student-1', name: 'Ada Okafor', username: 'ada.okafor', gender: 'female', date_of_birth: '2013-05-12', guardian_name: 'Grace Okafor', guardian_phone: '08012345678', guardian_email: 'grace@example.com', school_file_number: 'SF-101', created_at: '2026-10-22T12:08:55Z' },
 { id: 'student-2', name: 'Tunde Bello', username: 'tunde.bello', gender: 'male', guardian_name: 'Sade Bello', guardian_phone: '08022222222', school_file_number: 'SF-102', created_at: '2026-10-22T12:09:55Z' },
];
let approvedStudents = [];

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
  if (message.method === 'Runtime.exceptionThrown' && message.params.exceptionDetails.url !== 'about:blank') exceptions.push(JSON.stringify(message.params.exceptionDetails));
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
    else if (path === '/classes/my-class/pending-students') {
      if (failPending) { code = 500; response = { detail: 'Unable to load pending students' }; }
      else response = pendingStudents;
    }
    else if (/\/classes\/my-class\/students\/[^/]+\/approve$/.test(path)) {
      const studentId = path.split('/').at(-2);
      const student = pendingStudents.find(s => s.id === studentId);
      approvedStudents.push({ ...student, first_name: student.name.split(' ')[0], last_name: student.name.split(' ')[1], reg_number: 'TM/2026/001', is_active: true });
      pendingStudents = pendingStudents.filter(s => s.id !== studentId);
      response = { message: 'Approved', reg_number: 'TM/2026/001', status: 'ACTIVE' };
    }
    else if (/\/classes\/my-class\/students\/[^/]+\/reject$/.test(path)) {
      if (failRejection) { code = 500; response = { detail: 'Please retry this rejection' }; }
      else {
        const studentId = path.split('/').at(-2);
        pendingStudents = pendingStudents.filter(s => s.id !== studentId);
        response = { message: 'Rejected', status: 'REJECTED', reason: JSON.parse(request.postData).reason };
      }
    }
    else if (path === '/classes/class-1/registration-code') response = { id: 'code-1', code: 'CQ5-6M9', is_active: true, uses_count: 0, expires_at: '2099-10-29T12:08:55Z' };
    else if (path === '/classes/class-1/subjects') response = [];
    else if (path === '/students') response = approvedStudents;
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
  await send('Page.navigate', { url: 'http://localhost:3000/my-class' });
  await waitFor(`document.body.innerText.includes('Times used:') && document.body.innerText.includes('CQ5-6M9')`);
}
await send('Page.enable'); await send('Runtime.enable');
await send('Fetch.enable', { patterns: [{ urlPattern: '*api/v1/*', requestStage: 'Request' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `if (location.origin === 'http://localhost:3000') { localStorage.setItem('token', 'test-session'); localStorage.removeItem('refresh_token'); }` });
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });

try {
  await navigate();
  assert.ok(await evaluate(`document.body.innerText.includes('Times used: 0')`));
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(b => b.textContent.includes('Create class code'))`), false);
  await waitFor(`[...document.querySelectorAll('button')].some(b => b.textContent.includes('Pending students') && b.textContent.includes('2'))`);
  const readsBeforeNavigation = requests.filter(r => r.path === '/classes/my-class/pending-students' || r.path === '/classes/class-1/registration-code').length;
  await evaluate(`document.querySelector('a[href="/results"]').click()`);
  await waitFor(`document.body.innerText.includes('Your class results')`);
  await evaluate(`document.querySelector('a[href="/my-class"]').click()`);
  await waitFor(`document.body.innerText.includes('Times used: 0') && document.body.innerText.includes('Pending students')`);
  assert.equal(requests.filter(r => r.path === '/classes/my-class/pending-students' || r.path === '/classes/class-1/registration-code').length, readsBeforeNavigation);
  console.log('PASS page navigation reuses cached class code and pending students without new API requests');

  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Pending students')).click()`);
  await waitFor(`document.body.innerText.includes('ada.okafor') && document.body.innerText.includes('SF-102')`);
  assert.ok(requests.find(r => r.path === '/classes/my-class/pending-students' && r.query.class_id === 'class-1'));
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile(resolve('../pending-students-preview.png'), Buffer.from(screenshot.data, 'base64'));
  await evaluate(`[...document.querySelectorAll('tr')].find(r => r.textContent.includes('Ada Okafor')).querySelector('button').click()`);
  await waitFor(`!document.body.innerText.includes('Ada Okafor') && document.body.innerText.includes('1 registration awaiting review')`);
  assert.equal(approvedStudents.length, 1);
  await click('Students'); await waitFor(`document.body.innerText.includes('Ada') && document.body.innerText.includes('TM/2026/001')`);
  console.log('PASS code usage count, pending badge and details, approval refreshes pending list and roster');
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Pending students')).click()`);
  await click('Reject');
  await waitFor(`!!document.querySelector('[role=dialog] textarea')`);
  assert.equal(await evaluate('document.activeElement.tagName'), 'TEXTAREA');
  await input('[role=dialog] textarea', 'no');
  assert.ok(await evaluate(`[...document.querySelectorAll('[role=dialog] button')].at(-1).disabled`));
  await click('Cancel'); assert.equal(requests.some(r => r.path.endsWith('/reject')), false);
  await click('Reject'); await input('[role=dialog] textarea', '  School file number is incorrect.  ');
  failRejection = true; await click('Reject registration');
  await waitFor(`document.body.innerText.includes('Please retry this rejection')`);
  assert.ok(await evaluate(`!!document.querySelector('[role=dialog]')`));
  assert.equal(pendingStudents.length, 1);
  failRejection = false; await click('Reject registration');
  await waitFor(`document.body.innerText.includes('All registrations reviewed')`);
  assert.deepEqual(JSON.parse(requests.findLast(r => r.path.endsWith('/reject')).body), { reason: 'School file number is incorrect.' });
  assert.equal(pendingStudents.length, 0);
  console.log('PASS rejection modal, minimum reason, cancel without mutation, failure preserves dialog, retry and empty state');
  failPending = true; await click('Refresh');
  await waitFor(`document.body.innerText.includes('Could not load pending students')`);
  assert.equal(await evaluate(`document.body.innerText.includes('All registrations reviewed')`), false);
  console.log('PASS failed reads display errors instead of a false empty state');
  failPending = false;
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate();
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Pending students')).click()`);
  await waitFor(`document.body.innerText.includes('All registrations reviewed')`);
  assert.ok(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`));
  assert.equal(exceptions.length, 0, exceptions.join('\n'));
  console.log('PASS mobile page overflow check and no runtime exceptions');
} finally { await send('Page.navigate', { url: 'about:blank' }).catch(() => {}); ws.close(); }
