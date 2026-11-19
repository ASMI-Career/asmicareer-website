import { useState, useEffect, useMemo } from 'react';
import { selectAllDeadlines } from '../../../lib/events';
import { MONTHS, WEEKDAYS, parseLocalDate, startOfToday, dayKey, sameDay, formatLongDate, deadlineState, runningSpan } from '../lib/dates';

// Engineering "Deadlines" tab: every engineering event, as a month calendar or a grouped list, with a detail panel.
// Data: the same events the dashboard card reads (config.catalog.events), through selectAllDeadlines so past events are kept.
const STATE_LABEL = { open: 'Open now', upcoming: 'Upcoming', closed: 'Closed' };
const STATE_TAG = { open: 'tag-green', upcoming: 'tag-blue', closed: 'dl-tag-closed' };
const RUN_COLORS = ['#00A896', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e', '#22c55e', '#0ea5e9', '#ec4899'];
const keyOf = (ev) => `${ev.date}|${ev.title}`;
const shortDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;

// Apply (the event's own link, labelled by its cta) and View notice (its PDF). No Apply button once the event is closed, none without
// a link, and when the link and the PDF are the same address only one button is shown.
function Actions({ ev, noticeLabel = 'View notice', cls = 'dl-mini-btn' }) {
  const showLink = ev.link && ev.state !== 'closed';
  const showPdf = ev.pdf && !(ev.link && ev.link === ev.pdf && showLink);
  if (!showLink && !showPdf) return null;
  return (
    <span className="dl-actions">
      {showLink && <a className={`${cls} ${cls}-primary`} href={ev.link} target="_blank" rel="noopener noreferrer">{ev.cta || 'Apply Now'}</a>}
      {showPdf && <a className={cls} href={ev.pdf} target="_blank" rel="noopener noreferrer">{noticeLabel}</a>}
    </span>
  );
}

export default function Deadlines(props) {
  const { config, events, studentTracks, setActiveTab } = props;
  const today = useMemo(() => startOfToday(), []);
  const [view, setView] = useState('calendar');
  const [exam, setExam] = useState('All');
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(null);        // { day: 'YYYY-MM-DD', key: event key | null }

  // List by default on a phone, calendar on a bigger screen.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches) setView('list');
  }, []);

  const all = useMemo(() => selectAllDeadlines(events || [], {
    streamId: config.id, studentTracks, allTracks: (config.tracks || []).map(t => t.id), rules: config.deadlines,
  }).filter(ev => parseLocalDate(ev.date)), [events, config, studentTracks]);

  const exams = useMemo(() => [...new Set(all.map(e => e.exam).filter(Boolean))].sort(), [all]);
  const shown = useMemo(() => all
    .filter(e => exam === 'All' || e.exam === exam)
    .map(e => ({ ...e, state: deadlineState(e, today), key: keyOf(e) }))
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date)), [all, exam, today]);

  // Applications that are going on: each gets a colour and the days it runs (from its start, or today, to its last date).
  const running = useMemo(() => shown.map(e => ({ ev: e, span: runningSpan(e, today) })).filter(r => r.span)
    .map((r, i) => ({ ...r, color: RUN_COLORS[i % RUN_COLORS.length] })), [shown, today]);
  const runningOn = (d) => running.filter(r => d >= r.span.start && d <= r.span.end);

  const byDay = useMemo(() => { const m = {}; shown.forEach(e => { (m[e.date] = m[e.date] || []).push(e); }); return m; }, [shown]);
  const monthEvents = shown.filter(e => { const d = parseLocalDate(e.date); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(); });
  const monthRunning = running.filter(r => r.span.start <= new Date(month.getFullYear(), month.getMonth() + 1, 0) && r.span.end >= new Date(month.getFullYear(), month.getMonth(), 1));
  const nextAfterMonth = shown.find(e => parseLocalDate(e.date) >= new Date(month.getFullYear(), month.getMonth() + 1, 1));

  const panelEvents = !selected ? [] : (selected.key ? shown.filter(e => e.key === selected.key) : (byDay[selected.day] || []));
  const panelRunning = (!selected || selected.key) ? [] : runningOn(parseLocalDate(selected.day)).filter(r => !panelEvents.some(e => e.key === r.ev.key));
  const selectDay = (d, key = null) => setSelected({ day: dayKey(d), key });
  const shiftMonth = (n) => { setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)); setSelected(null); };
  const jumpTo = (ev) => { const d = parseLocalDate(ev.date); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(null); };

  const watchHowTo = (ev) => {
    try { const u = new URL(window.location.href); u.searchParams.set('video', ev.tutorial_id); window.history.replaceState(null, '', u.toString()); } catch (e) { /* the tab still opens */ }
    setActiveTab('tutorials');
  };

  // ── calendar grid (Sunday first), always 6 rows so the grid does not jump between months
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));

  const detailPanel = (panelEvents.length > 0 || panelRunning.length > 0) && (
    <div className="dl-panel" role="region" aria-label="Deadline details">
      <div className="dl-panel-head">
        <span>{selected.key ? 'Details' : formatLongDate(parseLocalDate(selected.day))}</span>
        <button className="dl-x" onClick={() => setSelected(null)} aria-label="Close details">✕</button>
      </div>
      {panelEvents.map(ev => (
        <div className="dl-detail" key={ev.key}>
          <div className="dl-detail-title">{ev.title}</div>
          <div className="dl-detail-tags">
            <span className="tag tag-gold">{ev.tag}</span>
            <span className={`tag ${STATE_TAG[ev.state]}`}>{STATE_LABEL[ev.state]}</span>
            {config.deadlines.showTentative && ev.status === 'tentative' && <span className="tag tag-gold">TENTATIVE</span>}
            {ev.exam && <span className="tag tag-blue">{ev.exam}</span>}
          </div>
          <div className="dl-detail-date">📅 {ev.display_date || formatLongDate(parseLocalDate(ev.date))}</div>
          <div className="dl-detail-actions">
            {ev.link && ev.state !== 'closed' && <a className="dl-btn dl-btn-primary" href={ev.link} target="_blank" rel="noopener noreferrer">{ev.cta || 'Apply Now'}</a>}
            {ev.pdf && !(ev.link && ev.link === ev.pdf && ev.state !== 'closed') && <a className="dl-btn" href={ev.pdf} target="_blank" rel="noopener noreferrer">View notice (PDF)</a>}
            {ev.tutorial_id && config.modules.includes('tutorials') && <button className="dl-btn" onClick={() => watchHowTo(ev)}>▶ Watch how to apply</button>}
          </div>
        </div>
      ))}
      {panelRunning.length > 0 && (
        <div className="dl-panel-running">
          <div className="dl-panel-sub">Applications open on this day</div>
          {panelRunning.map(r => (
            <div className="dl-run-item" key={r.ev.key}>
              <span className="dl-swatch" style={{ background: r.color }} />
              <span className="dl-run-main"><span className="dl-run-title">{r.ev.title}</span><span className="dl-run-until">till {shortDate(r.span.end)}</span></span>
              <Actions ev={r.ev} />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const row = (ev) => (
    <div key={ev.key} className={`dl-row dl-${ev.state}${selected && selected.key === ev.key ? ' is-selected' : ''}`}>
      <button className="dl-row-main" onClick={() => selectDay(parseLocalDate(ev.date), ev.key)}>
        <span className="dl-row-date"><b>{parseLocalDate(ev.date).getDate()}</b><i>{MONTHS[parseLocalDate(ev.date).getMonth()].slice(0, 3)}</i></span>
        <span className="dl-row-body">
          <span className="dl-row-title">{ev.title}</span>
          <span className="dl-row-meta"><span className="tag tag-gold">{ev.tag}</span>{ev.exam && <span className="dl-row-exam">{ev.exam}</span>}</span>
        </span>
      </button>
      <Actions ev={ev} />
    </div>
  );

  const groups = [['open', 'Open now'], ['upcoming', 'Upcoming'], ['closed', 'Closed']]
    .map(([k, label]) => [k, label, shown.filter(e => e.state === k)])
    .map(([k, label, list]) => [k, label, k === 'closed' ? [...list].reverse() : list])
    .filter(([, , list]) => list.length > 0);

  return (
    <div className="tool-card dl-wrap">
      <div className="dl-top">
        <div>
          <h2 className="section-title">Deadlines</h2>
          <p className="section-sub">Application, correction and exam dates for the engineering entrance exams.</p>
        </div>
        <div className="dl-toggle" role="group" aria-label="View">
          <button className={`chip${view === 'calendar' ? ' active' : ''}`} onClick={() => setView('calendar')}>Calendar</button>
          <button className={`chip${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}>List</button>
        </div>
      </div>

      {all.length > 0 && (
        <div className="dl-chips" role="group" aria-label="Filter by exam">
          {['All', ...exams].map(x => <button key={x} className={`chip${exam === x ? ' active' : ''}`} onClick={() => { setExam(x); setSelected(null); }}>{x}</button>)}
        </div>
      )}

      {all.length === 0 && <div className="empty-state">No deadlines have been added yet.</div>}
      {all.length > 0 && shown.length === 0 && <div className="empty-state">No deadlines for {exam} yet.</div>}

      {shown.length > 0 && view === 'calendar' && (
        <>
          {running.length > 0 && (
            <div className="dl-run-strip" aria-label="Applications going on">
              <div className="dl-panel-sub">Applications going on</div>
              {running.map(r => (
                <div className="dl-run-item" key={r.ev.key}>
                  <span className="dl-swatch" style={{ background: r.color }} />
                  <span className="dl-run-main"><span className="dl-run-title">{r.ev.title}</span><span className="dl-run-until">till {shortDate(r.span.end)}</span></span>
                  <Actions ev={r.ev} />
                </div>
              ))}
            </div>
          )}
          <div className="dl-layout">
            <div className="dl-cal">
              <div className="dl-cal-head">
                <button className="dl-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
                <div className="dl-cal-title">{MONTHS[month.getMonth()]} {month.getFullYear()}</div>
                <button className="dl-nav" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
              </div>
              <div className="dl-grid dl-weekdays">{WEEKDAYS.map(w => <div key={w}>{w}</div>)}</div>
              <div className="dl-grid">
                {cells.map(d => {
                  const k = dayKey(d), evs = byDay[k] || [], runs = runningOn(d), other = d.getMonth() !== month.getMonth();
                  return (
                    <button key={k} data-day={k} className={`dl-cell${other ? ' is-other' : ''}${sameDay(d, today) ? ' is-today' : ''}${selected && selected.day === k ? ' is-selected' : ''}`}
                      onClick={() => selectDay(d)} aria-label={`${formatLongDate(d)}${evs.length ? `, ${evs.length} deadline${evs.length > 1 ? 's' : ''}` : ''}${runs.length ? `, ${runs.length} application${runs.length > 1 ? 's' : ''} open` : ''}`}>
                      <span className="dl-cell-num">{d.getDate()}</span>
                      {evs.slice(0, 2).map(ev => (
                        <span key={ev.key} className={`dl-chip dl-${ev.state}`} onClick={(e) => { e.stopPropagation(); selectDay(d, ev.key); }}>{ev.title}</span>
                      ))}
                      {evs.length > 2 && <span className="dl-more">+{evs.length - 2} more</span>}
                      {runs.length > 0 && (
                        <span className="dl-bars">{runs.map(r => <span key={r.ev.key} className="dl-bar" style={{ background: r.color }} title={`${r.ev.title} (till ${shortDate(r.span.end)})`} />)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {monthEvents.length === 0 && monthRunning.length === 0 && (
                <div className="empty-state dl-month-empty">
                  No deadlines in {MONTHS[month.getMonth()]} {month.getFullYear()}.
                  {nextAfterMonth && <> <button className="dl-link" onClick={() => jumpTo(nextAfterMonth)}>Jump to the next one ({MONTHS[parseLocalDate(nextAfterMonth.date).getMonth()]} {parseLocalDate(nextAfterMonth.date).getFullYear()})</button></>}
                </div>
              )}
            </div>
            {detailPanel}
          </div>
        </>
      )}

      {shown.length > 0 && view === 'list' && (
        <div className="dl-layout">
          <div className="dl-list">
            {groups.map(([k, label, list]) => (
              <section key={k} className={`dl-group dl-${k}`}>
                <h3 className="dl-group-title">{label} <span>{list.length}</span></h3>
                {list.map(row)}
              </section>
            ))}
          </div>
          {detailPanel}
        </div>
      )}
    </div>
  );
}
