// Multi-day events (JEE Main 2027 Session 1: 20-24 and 28 January). Run: node tests/multiDayEvents.test.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { eventDays, nextDay, selectDeadlines, selectAllDeadlines } from '../lib/events.js';

const events = JSON.parse(fs.readFileSync(new URL('../public/data/engineeringEvents.json', import.meta.url), 'utf8'));
const exam = events.find(e => e.title === 'JEE Main 2027 Session 1 — Examination');
assert.deepEqual(eventDays(exam), ['2027-01-20', '2027-01-21', '2027-01-22', '2027-01-23', '2027-01-24', '2027-01-28']);
for (const d of ['2027-01-25', '2027-01-26', '2027-01-27']) assert.ok(!eventDays(exam).includes(d), d + ' is not an exam day');
assert.equal(exam.date, '2027-01-28');                       // pages that only read `date` still see the last day

const at = (s) => new Date(s + 'T10:00:00');
assert.equal(nextDay(exam, at('2026-11-26')), '2027-01-20');
assert.equal(nextDay(exam, at('2027-01-22')), '2027-01-22');
assert.equal(nextDay(exam, at('2027-01-25')), '2027-01-28');  // between the two blocks
assert.equal(nextDay(exam, at('2027-01-29')), '2027-01-28');  // all passed: last day

// Events without `dates` come out exactly as before.
const plain = { title: 'X', date: '2030-01-01', tag: 'NOTICE' };
assert.deepEqual(eventDays(plain), ['2030-01-01']);

const rules = { keepPastResults: false, useExpiryDate: false, requireTrackMatch: false, extraFields: true };
const ctx = { streamId: 'engineering', studentTracks: [], allTracks: [], rules };
const all = selectAllDeadlines(events, ctx).find(e => e.title === exam.title);
assert.deepEqual(all.dates, eventDays(exam));
const sel = selectDeadlines([exam, plain].map(e => ({ stream: 'engineering', ...e })), ctx).find(e => e.title === exam.title);
assert.ok(sel, 'exam is listed as upcoming');
assert.ok(sel.date >= '2027-01-20' && sel.dates.length === 6);
const p = selectAllDeadlines([{ stream: 'engineering', ...plain }], ctx)[0];
assert.ok(!('dates' in p));
console.log('multiDayEvents: all checks passed');
