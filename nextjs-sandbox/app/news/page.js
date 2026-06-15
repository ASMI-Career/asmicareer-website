'use client';
import { useState, useEffect } from 'react';
import './news.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

function isExpired(event) {
  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

export default function NewsPage() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'deadlines' | 'exams' | 'seminars'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/events.json')
      .then(r => r.json())
      .then(data => {
        const active = data.filter(e => !isExpired(e));
        // Sort by date ascending — soonest first
        active.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(active);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // FILTER OPTIONS — matching actual events.json values
  const filterEvents = () => {
    if (filter === 'all') return events;
    if (filter === 'deadlines') return events.filter(e => e.type === 'deadline' || e.tag === 'URGENT');
    if (filter === 'exams') return events.filter(e => e.type === 'exam' || e.tag === 'EXAM DATE' || e.tag === 'ADMIT CARD');
    if (filter === 'seminars') return events.filter(e => e.type === 'asmi' || e.tag === 'ASMI SEMINAR');
    return events;
  };

  const filtered = filterEvents();

  // Group by month for section headers
  const grouped = {};
  filtered.forEach(e => {
    const d = new Date(e.date);
    const key = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  const tagColor = (tag) => {
    if (tag === 'URGENT') return 'news-tag-urgent';
    if (tag === 'EXAM DATE' || tag === 'ADMIT CARD') return 'news-tag-exam';
    if (tag === 'ASMI SEMINAR') return 'news-tag-seminar';
    return 'news-tag-default';
  };

  return (
    <div className="news-page">
      <Nav />

      <section className="news-hero">
        <div className="news-hero-inner">
          <span className="news-eyebrow">NEWS & UPDATES</span>
          <h1 className="news-headline">Every Deadline. Every Notice. In One Place.</h1>
          <p className="news-sub">
            Stay updated on exam dates, application deadlines, and ASMI seminars —
            updated live as new notices are released.
          </p>
        </div>
      </section>

      <section className="news-content">
        <div className="news-content-inner">

          {/* FILTER TABS */}
          <div className="news-filters">
            <button
              className={`news-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Updates
            </button>
            <button
              className={`news-filter-btn ${filter === 'deadlines' ? 'active' : ''}`}
              onClick={() => setFilter('deadlines')}
            >
              Deadlines
            </button>
            <button
              className={`news-filter-btn ${filter === 'exams' ? 'active' : ''}`}
              onClick={() => setFilter('exams')}
            >
              Exam Dates
            </button>
            <button
              className={`news-filter-btn ${filter === 'seminars' ? 'active' : ''}`}
              onClick={() => setFilter('seminars')}
            >
              ASMI Seminars
            </button>
          </div>

          {loading && <div className="news-loading">Loading updates...</div>}

          {!loading && filtered.length === 0 && (
            <div className="news-empty">
              No updates in this category right now. Check back soon.
            </div>
          )}

          {/* GROUPED BY MONTH */}
          {!loading && Object.entries(grouped).map(([month, monthEvents]) => (
            <div className="news-month-group" key={month}>
              <h2 className="news-month-header">{month}</h2>
              <div className="news-list">
                {monthEvents.map((e, i) => (
                  <div className="news-card" key={i}>
                    <div className="news-card-date">
                      <span className="news-date-day">
                        {new Date(e.date).getDate()}
                      </span>
                      <span className="news-date-month">
                        {new Date(e.date).toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                    </div>
                    <div className="news-card-body">
                      <span className={`news-tag ${tagColor(e.tag)}`}>{e.tag}</span>
                      <h3 className="news-card-title">{e.title}</h3>
                      <div className="news-card-actions">
                        {e.link && (
                          <a href={e.link} className="news-action-primary"
                            target="_blank" rel="noopener noreferrer">
                            {e.cta || 'Apply Now'} →
                          </a>
                        )}
                        {e.pdf && (
                          <a href={e.pdf} className="news-action-secondary"
                            target="_blank" rel="noopener noreferrer">
                            View Notice
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
      </section>

      <Footer />
    </div>
  );
}
