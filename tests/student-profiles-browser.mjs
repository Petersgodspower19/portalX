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
let role = 'student';
let failStudent = false;
let denyResults = false;
let failTransfer = false;
const student = { id: 'student-1', first_name: 'Ada', last_name: 'Okafor', full_name: 'Ada Okafor', username: 'ada.okafor', reg_number: 'TM/2026/001', school_file_number: 'SF-0021', gender: 'female', date_of_birth: '2013-05-12', guardian_name: 'Grace Okafor', guardian_phone: '08012345678', guardian_email: 'guardian.contact.with.long.email@example.com', is_active: true, registration_status: 'active', class_id: 'class-1', class_info: { id: 'class-1', name: 'JSS 1', arm: 'A', level: 'JSS', full_name: 'JSS 1 A' } };
const classes = [{id:'class-1',full_name:'JSS 1 A'}, {id:'class-2',full_name:'JSS 1 B'}];
const invoices = [{id:'invoice-1',fee_type_name:'Tuition fee',amount:150000,status:'paid',paid_at:'2026-10-12T10:00:00Z'}, {id:'invoice-2',fee_type_name:'Activity fee',amount:20000,status:'unpaid'}];
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
    requests.push({path,method:request.method,query:Object.fromEntries(url.searchParams),body:request.postData});
    if (path === '/auth/me') response = {id:'user-1',role,first_name:'Ada',last_name:'Okafor',must_change_password:false};
    else if (path === '/school/terms/current') response = {id:'term-1',name:'First term',is_locked:false};
    else if (path === '/students/me' || path === '/students/student-1') {
      if(failStudent) {code=500;response={detail:'Unable to load student record'};} else response=student;
    }
    else if (path === '/classes') response=classes;
    else if (path === '/fees/invoices/me') response=invoices;
    else if (path === '/fees/status/student-1') response={status:'partial',total_owed:170000,total_paid:150000,invoices};
    else if (path === '/results/me') {
      if(denyResults){code=403;response={detail:'Fee requirements not met. Contact the school bursar.'};}
      else response={subjects:[{subject_id:'math',subject_name:'Mathematics',ca1_score:18,ca2_score:17,exam_score:54,total_score:89,grade:'A'},{subject_id:'eng',subject_name:'English language',ca1_score:16,ca2_score:18,exam_score:49,total_score:83,grade:'A'}]};
    }
    else if(path === '/students/student-1/transfer') {
      if(failTransfer){code=500;response={detail:'Transfer could not be saved'};}
      else {const body=JSON.parse(request.postData);student.class_id=body.new_class_id;student.class_info={id:'class-2',name:'JSS 1',arm:'B',level:'JSS',full_name:'JSS 1 B'};response={message:'Transferred'};}
    }
    else if(path === '/students/student-1/deactivate') {student.is_active=false;response={message:'Deactivated'};}
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
async function navigate(path, expected='Ada Okafor') {
 await send('Page.navigate',{url:'http://localhost:3000'+path});
 await waitFor(`document.body.innerText.includes(${JSON.stringify(expected)})`);
}
async function screenshot(name){const capture=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(resolve('../'+name),Buffer.from(capture.data,'base64'));}
await send('Page.enable'); await send('Runtime.enable');
await send('Fetch.enable', { patterns: [{ urlPattern: '*api/v1/*', requestStage: 'Request' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('token', 'test-session'); localStorage.removeItem('refresh_token');` });
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });

try {
 await navigate('/student-profile');
 await waitFor(`document.body.innerText.includes('Guardian information') && document.body.innerText.includes('School file number')`);
 assert.ok(await evaluate(`document.querySelector('h1').textContent === 'Ada Okafor'`));
 await screenshot('student-profile-desktop.png');
 await click('Academic results');await waitFor(`document.body.innerText.includes('Mathematics')`);
 assert.ok(await evaluate(`document.body.innerText.includes('86')`));
 await click('Fees and payments');await waitFor(`document.body.innerText.includes('Tuition fee') && document.body.innerText.includes('Activity fee')`);
 assert.ok(await evaluate(`document.body.innerText.includes('170,000') && document.body.innerText.includes('150,000') && document.body.innerText.includes('20,000')`));
 console.log('PASS student: identity, overview, guardian information, academic results and fee totals');
 denyResults=true;await navigate('/student-profile');await click('Academic results');
 await waitFor(`document.body.innerText.includes('Fee requirements not met')`);
 assert.equal(await evaluate(`document.body.innerText.includes('No published results')`),false);
 console.log('PASS results errors preserve fee-gate feedback rather than showing a false empty state');
 denyResults=false;
 role='principal';await navigate('/students/student-1');
 await waitFor(`document.body.innerText.includes('Fee description')`);
 await screenshot('student-record-desktop.png');
 await click('Transfer class');await waitFor(`!!document.querySelector('[role=dialog] select')`);
 assert.equal(await evaluate(`!!document.querySelector('[role=dialog] option[value="class-1"]')`),false);
 await input('[role=dialog] select','class-2');await input('[role=dialog] textarea','Move to the parallel class.');
 failTransfer=true;await click('Confirm transfer');await waitFor(`document.body.innerText.includes('Transfer could not be saved')`);
 assert.ok(await evaluate(`!!document.querySelector('[role=dialog]')`));
 failTransfer=false;await click('Confirm transfer');await waitFor(`!document.querySelector('[role=dialog]') && document.body.innerText.includes('JSS 1 B')`);
 assert.deepEqual(JSON.parse(requests.findLast(r=>r.path.endsWith('/transfer')).body),{new_class_id:'class-2',transfer_reason:'Move to the parallel class.'});
 await click('Deactivate');await waitFor(`!!document.querySelector('[role=dialog]')`);
 await input('[role=dialog] textarea','Student has left the school.');await click('Deactivate student',`document.querySelector('[role=dialog]')`);
 await waitFor(`!document.querySelector('[role=dialog]') && document.body.innerText.includes('Inactive')`);
 console.log('PASS staff: fee summary, class transfer with failure/retry, deactivation dialog and record refresh');
 role='form_teacher';const feeReads=requests.filter(r=>r.path.startsWith('/fees/status/')).length;
 await navigate('/my-class/student-1');await waitFor(`document.body.innerText.includes('Guardian information')`);
 assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(b=>['Transfer class','Deactivate'].includes(b.textContent.trim()))`),false);
 assert.equal(requests.filter(r=>r.path.startsWith('/fees/status/')).length,feeReads);
 assert.equal(await evaluate(`document.querySelector('a[href="/my-class"]').textContent.trim()`),'My Class');
 console.log('PASS teacher: shared student record with no management actions or restricted fee calls');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await navigate('/my-class/student-1');
 await waitFor(`document.body.innerText.includes('Guardian information')`);
 assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
 await screenshot('class-student-mobile.png');
 role='student';await navigate('/student-profile');await click('Fees and payments');await waitFor(`document.body.innerText.includes('Tuition fee')`);
 assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
 await screenshot('student-profile-fees-mobile.png');
 await click('Profile overview');await screenshot('student-profile-mobile.png');
 console.log('PASS mobile: long contact details and results/fee layouts stay inside the viewport');
 role='principal';failStudent=true;await navigate('/students/student-1','Student record unavailable');
 assert.equal(await evaluate(`!!document.querySelector('h1')`),false);
 assert.equal(exceptions.length,0,exceptions.join('\n'));
 console.log('PASS failed record reads show explicit errors; no runtime exceptions');
} finally {await send('Page.navigate',{url:'about:blank'}).catch(()=>{});ws.close();}
