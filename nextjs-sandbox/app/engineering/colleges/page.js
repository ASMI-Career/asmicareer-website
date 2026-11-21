'use client';

import { useState, useEffect } from 'react';
import './colleges.css';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import engConfig from '../../student/config/engineering.provisional.json';

const engineeringNavLinks = [
  { label: 'Colleges', href: '/engineering/colleges' },
  { label: 'Counselling', href: '/engineering/counselling' },
  { label: 'Packages', href: '/engineering#packages' },
  { label: 'Services', href: '/engineering/services' },
  { label: 'Events', href: '/engineering/events' },
  { label: 'News', href: '/engineering/news' },
  { label: 'About Us', href: '/engineering/about' },
  { label: 'Contact Us', href: '/engineering/contact' },
];

export default function EngineeringCollegesDirectory() {
  const [allColleges, setAllColleges] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [isEngineering, setIsEngineering] = useState(true);
  const [stateSearch, setStateSearch] = useState('');
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedTabType, setSelectedTabType] = useState('All');
  const [maxFees, setMaxFees] = useState(3000000);
  const [sortBy, setSortBy] = useState('Recommended');
  const [savedColleges, setSavedColleges] = useState([]);
  const [exam, setExam] = useState('all');          // entrance exam the colleges are shown for ('all' = every college)
  const [limit, setLimit] = useState(48);           // "Show more" count

  // Fetch data
  useEffect(() => {
    fetch('/data/engineering-colleges.json')
      .then((r) => r.json())
      .then((data) => {
        setAllColleges(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load colleges data:', err);
        setIsLoading(false);
      });
  }, []);

  // Filters follow the selected exam: only the states and college types that exist under it are offered, and a selection that
  // no longer applies is ignored (e.g. under MHT-CET the only state is Maharashtra).
  const lc = (x) => (x || '').toLowerCase();
  const inView = (c) => exam === 'all' || (c.groups || []).includes(exam);
  const viewList = allColleges.filter(inView);
  const typesInView = new Set(viewList.map((c) => lc(c.type)));
  const statesInView = new Set(viewList.map((c) => c.state).filter(Boolean));
  const tabT = selectedTabType !== 'All' && !typesInView.has(lc(selectedTabType)) ? 'All' : selectedTabType;
  const typeT = selectedType !== 'All' && !typesInView.has(lc(selectedType)) ? 'All' : selectedType;
  const selStates = selectedStates.filter((st) => statesInView.has(st));
  const selKey = selStates.join('|');
  const TYPE_TABS = [
    { label: 'All Colleges', value: 'All' }, { label: 'IITs', value: 'IIT' }, { label: 'NITs', value: 'NIT' },
    { label: 'IIITs', value: 'IIIT' }, { label: 'GFTIs', value: 'GFTI' }, { label: 'Private', value: 'Private' },
    { label: 'Government', value: 'Government' }, { label: 'Deemed', value: 'Deemed' },
  ];

  // Filter and Sort Effect
  useEffect(() => {
    let result = allColleges.filter((c) => exam === 'all' || (c.groups || []).includes(exam));

    // Filter by Tab Type (Pill tabs)
    if (tabT !== 'All') {
      result = result.filter(
        (c) => c.type && c.type.toLowerCase() === tabT.toLowerCase()
      );
    }

    // Filter by Dropdown Type
    if (typeT !== 'All') {
      result = result.filter(
        (c) => c.type && c.type.toLowerCase() === typeT.toLowerCase()
      );
    }

    // Filter by Course
    if (selectedCourse !== 'All') {
      result = result.filter(
        (c) => c.course && c.course.toLowerCase() === selectedCourse.toLowerCase()
      );
    }

    // Filter by States (Multi-select)
    if (selStates.length > 0) {
      result = result.filter((c) => selStates.includes(c.state));
    }

    // Filter by Fees (Only filters if annual_fees is populated)
    result = result.filter((c) => {
      if (c.annual_fees === null || c.annual_fees === undefined) {
        return true;
      }
      return c.annual_fees <= maxFees;
    });

    // Sort Results
    if (sortBy === 'Recommended') {
      result.sort((a, b) => {
        const aRec = a.asmi_recommended ? 1 : 0;
        const bRec = b.asmi_recommended ? 1 : 0;
        return bRec - aRec;
      });
    } else if (sortBy === 'Name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'Seats') {
      result.sort((a, b) => (b.seats || 0) - (a.seats || 0));
    }

    setFilteredColleges(result);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allColleges, exam, tabT, typeT, selectedCourse, selKey, maxFees, sortBy]);

  useEffect(() => { setLimit(48); }, [exam, tabT, typeT, selectedCourse, selKey, maxFees, sortBy]);

  // Extract unique states for sidebar list
  const stateScope = viewList.filter((c) => (tabT === 'All' || lc(c.type) === lc(tabT)) && (typeT === 'All' || lc(c.type) === lc(typeT)));
  const uniqueStates = Array.from(
    new Set(stateScope.map((c) => c.state).filter(Boolean))
  ).sort();
  const oneState = statesInView.size === 1 ? [...statesInView][0] : null;
  const typeScope = selStates.length ? viewList.filter((c) => selStates.includes(c.state)) : viewList;
  const typesAvail = new Set(typeScope.map((c) => lc(c.type)));

  // Filter unique states by search text
  const filteredStatesList = uniqueStates.filter((state) =>
    state.toLowerCase().includes(stateSearch.toLowerCase())
  );

  // Toggle state selection
  const handleStateToggle = (stateName) => {
    setSelectedStates((prev) =>
      prev.includes(stateName)
        ? prev.filter((s) => s !== stateName)
        : [...prev, stateName]
    );
  };

  // Toggle saved colleges list
  const handleSaveToggle = (slug, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedColleges((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedStates([]);
    setSelectedType('All');
    setSelectedCourse('All');
    setSelectedTabType('All');
    setExam('all');
    setMaxFees(3000000);
    setSortBy('Recommended');
    setStateSearch('');
  };

  return (
    <div className="colleges-page" style={{ paddingTop: 64 }}>  {/* clears the fixed 64px site nav (the first 32px of the page were hidden behind it) */}
      <Nav links={engineeringNavLinks} ctaHref="/engineering/inquiry" homeHref="/engineering" />
      <div className="colleges-layout">
        
        {/* Left Filter Sidebar */}
        <aside className="col-sidebar">
          <div className="col-filter-title">
            <span>Filters</span>
            <button className="col-reset" onClick={handleResetFilters}>
              Reset all
            </button>
          </div>

          {/* Stream Filter */}
          <div className="col-filter-section">
            <span className="col-filter-label">Stream</span>
            <label className="col-checkbox-label">
              <input
                type="checkbox"
                checked={isEngineering}
                onChange={() => {}}
                className="col-checkbox"
              />
              <span className="col-checkbox-text">Engineering</span>
            </label>
          </div>

          {/* State Filter */}
          {oneState ? (
            <div className="col-filter-section">
              <span className="col-filter-label">State</span>
              <div className="col-checkbox-text">{oneState} only</div>
            </div>
          ) : (
          <div className="col-filter-section">
            <span className="col-filter-label">State</span>
            <input
              type="text"
              placeholder="Search state..."
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              className="col-search-input"
            />
            <div className="col-states-list">
              {filteredStatesList.map((state) => (
                <label className="col-checkbox-label" key={state}>
                  <input
                    type="checkbox"
                    checked={selStates.includes(state)}
                    onChange={() => setSelectedStates(selStates.includes(state) ? selStates.filter((x) => x !== state) : [...selStates, state])}
                    className="col-checkbox"
                  />
                  <span className="col-checkbox-text">{state}</span>
                </label>
              ))}
              {filteredStatesList.length === 0 && (
                <div className="col-empty-msg">No states match search</div>
              )}
            </div>
          </div>
          )}

          {/* University Type Filter (only the types that exist for the chosen exam) */}
          {TYPE_TABS.filter((t) => t.value === 'All' || typesAvail.has(lc(t.value)) || lc(t.value) === lc(typeT)).length > 2 && (
          <div className="col-filter-section">
            <span className="col-filter-label">University Type</span>
            <select
              value={typeT}
              onChange={(e) => setSelectedType(e.target.value)}
              className="col-select"
            >
              {TYPE_TABS.filter((t) => t.value === 'All' || typesAvail.has(lc(t.value)) || lc(t.value) === lc(typeT)).map((t) => (
                <option key={t.value} value={t.value}>{t.value === 'All' ? 'All Colleges' : t.value === 'Government' ? 'State Government' : t.label.replace(/s$/, '')}</option>
              ))}
            </select>
          </div>
          )}

          {/* Course Filter */}
          <div className="col-filter-section">
            <span className="col-filter-label">Course</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="col-select"
            >
              <option value="All">All Courses</option>
              <option value="BTech">B.Tech / B.E.</option>
              <option value="BArch">B.Arch</option>
              <option value="BPlan">B.Planning</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="col-filter-section">
            <span className="col-filter-label">Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="col-select"
            >
              <option value="Recommended">ASMI Recommended</option>
              <option value="Name">Name A–Z</option>
              <option value="Seats">Seats (High to Low)</option>
            </select>
          </div>

          {/* Annual Fees Range Slider */}
          <div className="col-filter-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <span className="col-filter-label">Annual Fees Range</span>
            <input
              type="range"
              min="0"
              max="3000000"
              step="50000"
              value={maxFees}
              onChange={(e) => setMaxFees(Number(e.target.value))}
              className="col-slider"
            />
            <div className="col-slider-value">
              Up to {maxFees === 3000000 ? 'No Limit' : `₹${maxFees.toLocaleString('en-IN')}`}
            </div>
          </div>
        </aside>

        {/* Right Section */}
        <main className="col-main">
          
          {/* Entrance exam: which exam you can apply through */}
          <div className="col-tabs" role="group" aria-label="Entrance exam">
            {[{ id: 'all', label: 'All exams' }, ...engConfig.instituteExams].map((e) => (
              <button
                key={e.id}
                onClick={() => setExam(e.id)}
                className={`col-tab${exam === e.id ? ' active' : ''}`}
              >
                {e.label} <span style={{ opacity: 0.7, fontWeight: 600 }}>{allColleges.filter((c) => e.id === 'all' || (c.groups || []).includes(e.id)).length}</span>
              </button>
            ))}
          </div>

          {/* Pill Tabs (college type; only types that exist for the chosen exam) */}
          <div className="col-tabs">
            {TYPE_TABS.filter((t) => t.value === 'All' || typesInView.has(lc(t.value))).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedTabType(tab.value)}
                className={`col-tab${tabT === tab.value ? ' active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Count Header */}
          <div className="col-count-header">
            {!isLoading && (
              <p className="col-count-text">
                Showing <strong>{filteredColleges.length}</strong> college{filteredColleges.length !== 1 ? 's' : ''} matching your criteria.
              </p>
            )}
          </div>

          {/* College Cards Grid */}
          <div className="col-grid">
            {isLoading ? (
              // 9 Skeleton cards
              Array.from({ length: 9 }).map((_, i) => (
                <div className="col-card skeleton-card" key={i} style={{ pointerEvents: 'none' }}>
                  <div className="col-skeleton-img" />
                  <div className="col-card-body">
                    <div className="col-skeleton-line" style={{ width: '40%' }} />
                    <div className="col-skeleton-line" style={{ width: '90%' }} />
                    <div className="col-skeleton-line" style={{ width: '60%' }} />
                  </div>
                </div>
              ))
            ) : filteredColleges.length > 0 ? (
              filteredColleges.slice(0, limit).map((college) => {
                const isSaved = savedColleges.includes(college.slug);
                return (
                  <a href={`/engineering/colleges/${college.slug}`} className="col-card" key={college.slug}>
                    <div
                      className="col-card-img"
                      style={
                        college.photo
                          ? { backgroundImage: `url(${college.photo})` }
                          : { background: college.photo_placeholder_color || 'linear-gradient(135deg, #0a1628, #00A896)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
                      }
                    >
                      {!college.photo && (
                        <span style={{ color: 'rgba(255,255,255,0.85)', font: "800 28px 'Montserrat', sans-serif" }} aria-hidden="true">
                          {String(college.name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                        </span>
                      )}
                      {college.asmi_recommended && (
                        <span className="col-asmi-badge">★ ASMI RECOMMENDS</span>
                      )}
                      {college.asmi_pulse_score && (
                        <span className="col-rating">★ {college.asmi_pulse_score}/5</span>
                      )}
                      <button
                        className="col-heart"
                        onClick={(e) => handleSaveToggle(college.slug, e)}
                        aria-label={`Save ${college.name}`}
                      >
                        {isSaved ? '♥' : '♡'}
                      </button>
                    </div>
                    <div className="col-card-body">
                      <div className="col-card-meta">
                        {college.city && <span>📍 {college.city}</span>}
                        <span>🎓 {college.type}</span>
                      </div>
                      <div className="col-card-name">{college.name}</div>
                      {college.seats && (
                        <div className="col-card-seats">{college.seats} B.Tech seats</div>
                      )}
                    </div>
                  </a>
                );
              })
            ) : (
              // Empty State
              <div className="col-empty-container">
                <p className="col-empty-text">No colleges found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
          {filteredColleges.length > limit && (
            <div style={{ textAlign: 'center', margin: '24px 0' }}>
              <button className="col-tab" onClick={() => setLimit(limit + 48)}>Show more ({filteredColleges.length - limit} left)</button>
            </div>
          )}
        </main>

      </div>
      <Footer isEngineering={true} />
    </div>
  );
}
