import assert from 'node:assert/strict';
import { test } from 'node:test';
import axios from 'axios';

// Exercise the real API helpers through Axios without contacting the live school API.
process.env.NEXT_PUBLIC_BACKENDURL = 'https://results.test';
globalThis.localStorage = { getItem: () => 'test-session' };
const api = await import('../app/_lib/results.js');
let calls = [];
let responseData = {};
let failure = null;
axios.defaults.adapter = async (config) => {
  calls.push(config);
  if (failure) throw failure;
  return { config, status: 200, statusText: 'OK', headers: {}, data: responseData };
};
const reset = () => { calls = []; responseData = {}; failure = null; };

test('template download requests a binary XLSX for the selected class and term', async () => {
  reset(); responseData = new Blob(['template']);
  assert.equal(await api.downloadClassResultTemplate('class/1', 'term-2'), responseData);
  assert.equal(calls[0].url, 'https://results.test/api/v1/results/template/class/class%2F1');
  assert.deepEqual(calls[0].params, { term_id: 'term-2', format: 'xlsx' });
  assert.equal(calls[0].responseType, 'blob');
  assert.equal(calls[0].headers.Authorization, 'Bearer test-session');
});
test('whole-class upload sends term and file as multipart, with the principal reason', async () => {
  reset();
  const file = new File(['student,score'], 'class.csv', { type: 'text/csv' });
  await api.uploadClassResults('class-1', 'term-2', file, '  Teacher is absent  ');
  assert.equal(calls[0].url, 'https://results.test/api/v1/results/upload/class/class-1');
  assert.equal(calls[0].data.get('term_id'), 'term-2');
  assert.equal(calls[0].data.get('file').name, 'class.csv');
  assert.equal(calls[0].data.get('reason'), 'Teacher is absent');
  assert.equal(calls[0].data.has('subject_id'), false);
  reset(); await api.uploadClassResults('class-1', 'term-2', file);
  assert.equal(calls[0].data.has('reason'), false);
});
test('draft submit, approve and reject use class submission routes and query term', async () => {
  reset();
  await api.submitClassResults('class-1', 'term-2');
  await api.approveClassResults('class-1', 'term-2');
  await api.rejectClassResults('class-1', 'term-2', '  Check exam scores  ');
  assert.deepEqual(calls.map((c) => c.url.split('/').pop()), ['submit', 'approve', 'reject']);
  for (const call of calls) {
    assert.equal(call.method, 'post');
    assert.deepEqual(call.params, { term_id: 'term-2' });
    assert.ok(call.url.includes('/submissions/class/class-1/'));
  }
  assert.deepEqual(JSON.parse(calls[2].data), { reason: 'Check exam scores' });
});
test('only a missing submission becomes an empty state; permission failures remain errors', async () => {
  reset(); failure = { response: { status: 404, data: { detail: 'No submission' } } };
  assert.equal(await api.getClassSubmission('class-1', 'term-2'), null);
  failure = { response: { status: 403, data: { detail: 'Not your class' } } };
  await assert.rejects(api.getClassSubmission('class-1', 'term-2'), (error) => error.status === 403 && error.message === 'Not your class');
});
test('unlock requires its documented JSON reason and validation errors stay readable', async () => {
  reset(); await api.unlockTerm('term-2', '  Correct approved score  ');
  assert.deepEqual(JSON.parse(calls[0].data), { unlock_reason: 'Correct approved score' });
  failure = { response: { status: 422, data: { detail: [{ msg: 'Invalid score' }, { msg: 'Missing student' }] } } };
  await assert.rejects(api.uploadClassResults('class-1', 'term-2', new File([''], 'class.csv')), /Invalid score, Missing student/);
});
test('binary download errors preserve the backend message', async () => {
  reset(); failure = { response: { status: 403, data: new Blob([JSON.stringify({ detail: 'Fee requirements not met' })]) } };
  await assert.rejects(api.downloadMyResultsAsPdf('term-2'), /Fee requirements not met/);
});
test('missing login fails before any request instead of reporting false success', async () => {
  reset(); globalThis.localStorage = { getItem: () => null };
  await assert.rejects(api.submitClassResults('class-1', 'term-2'), /sign in again/);
  assert.equal(calls.length, 0);
  globalThis.localStorage = { getItem: () => 'test-session' };
});
