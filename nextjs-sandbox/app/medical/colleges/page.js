'use client';

import { useState, useEffect } from 'react';
import './colleges.css';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

export default function CollegesDirectory() {
  const [allColleges, setAllColleges] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [isMedical, setIsMedical] = useState(true);
  const [stateSearch, setStateSearch] = useState('');
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedTabType, setSelectedTabType] = useState('All');
  const [maxFees, setMaxFees] = useState(3000000);
  const [sortBy, setSortBy] = useState('Recommended');
  const [savedColleges, setSavedColleges] = useState([]);

  // Fetch data
  useEffect(() => {
    fetch('/data/colleges.json')
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

  // Filter and Sort Effect
  useEffect(() => {
    let result = [...allColleges];

    // Filter by Tab Type (Pill tabs)
    if (selectedTabType !== 'All') {
      result = result.filter(
        (c) => c.type && c.type.toLowerCase() === selectedTabType.toLowerCase()
      );
    }

    // Filter by Dropdown Type
    if (selectedType !== 'All') {
      result = result.filter(
        (c) => c.type && c.type.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Filter by Course
    if (selectedCourse !== 'All') {
      result = result.filter(
        (c) => c.course && c.course.toLowerCase() === selectedCourse.toLowerCase()
      );
    }

    // Filter by States (Multi-select)
    if (selectedStates.length > 0) {
      result = result.filter((c) => selectedStates.includes(c.state));
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
  }, [allColleges, selectedTabType, selectedType, selectedCourse, selectedStates, maxFees, sortBy]);

  // Extract unique states for sidebar list
  const uniqueStates = Array.from(
    new Set(allColleges.map((c) => c.state).filter(Boolean))
  ).sort();

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
    setMaxFees(3000000);
    setSortBy('Recommended');
    setStateSearch('');
  };

  return (
    <div className="colleges-page">
      <Nav />
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
                checked={isMedical}
                onChange={() => {}}
                className="col-checkbox"
              />
              <span className="col-checkbox-text">Medical</span>
            </label>
            <label className="col-checkbox-label disabled">
              <input
                type="checkbox"
                checked={false}
                disabled
                className="col-checkbox"
              />
              <span className="col-checkbox-text">Engineering <small style={{ opacity: 0.6 }}>(Soon)</small></span>
            </label>
          </div>

          {/* State Filter */}
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
                    checked={selectedStates.includes(state)}
                    onChange={() => handleStateToggle(state)}
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

          {/* University Type Filter */}
          <div className="col-filter-section">
            <span className="col-filter-label">University Type</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="col-select"
            >
              <option value="All">All Colleges</option>
              <option value="AIIMS">AIIMS</option>
              <option value="Government">Government</option>
              <option value="Private">Private</option>
              <option value="Deemed">Deemed</option>
              <option value="JIPMER">JIPMER</option>
              <option value="Central">Central</option>
              <option value="AFMC">AFMC</option>
              <option value="Govt. Society">Govt. Society</option>
            </select>
          </div>

          {/* Course Filter */}
          <div className="col-filter-section">
            <span className="col-filter-label">Course</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="col-select"
            >
              <option value="All">All Courses</option>
              <option value="MBBS">MBBS</option>
              <option value="BDS">BDS</option>
              <option value="BPTH">BPTH</option>
              <option value="BAMS">BAMS</option>
              <option value="BHMS">BHMS</option>
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
          
          {/* Pill Tabs */}
          <div className="col-tabs">
            {[
              { label: 'All Colleges', value: 'All' },
              { label: 'Private', value: 'Private' },
              { label: 'Government', value: 'Government' },
              { label: 'Deemed', value: 'Deemed' },
              { label: 'AIIMS', value: 'AIIMS' },
              { label: 'JIPMER', value: 'JIPMER' },
              { label: 'Central', value: 'Central' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedTabType(tab.value)}
                className={`col-tab${selectedTabType === tab.value ? ' active' : ''}`}
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
              filteredColleges.map((college) => {
                const isSaved = savedColleges.includes(college.slug);
                return (
                  <a href={`/medical/colleges/${college.slug}`} className="col-card" key={college.slug}>
                    <div
                      className="col-card-img"
                      style={
                        college.photo !== null
                          ? { backgroundImage: `url(/images/colleges/${college.slug}.jpg)` }
                          : { background: college.photo_placeholder_color || '#1a0040' }
                      }
                    >
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
                        <div className="col-card-seats">{college.seats} MBBS seats</div>
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
        </main>

      </div>
      <Footer />
    </div>
  );
}
