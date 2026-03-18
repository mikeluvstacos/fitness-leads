import { useRef } from 'react';
import './FilterBar.css';

const PLATFORMS = ['all', 'Craigslist', 'Reddit', 'Web'];

export default function FilterBar({ filter, onChange }) {
  const searchRef = useRef(null);
  let debounce = null;

  const handleSearch = (e) => {
    clearTimeout(debounce);
    const val = e.target.value;
    debounce = setTimeout(() => onChange(f => ({ ...f, search: val })), 300);
  };

  return (
    <div className="filter-bar">
      <div className="platform-tabs">
        {PLATFORMS.map(p => (
          <button
            key={p}
            className={`tab ${filter.platform === p ? 'active' : ''}`}
            onClick={() => onChange(f => ({ ...f, platform: p }))}
          >
            {p === 'all' ? 'All Platforms' : p}
          </button>
        ))}
      </div>

      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search by keyword..."
          defaultValue={filter.search}
          onChange={handleSearch}
        />
        {filter.search && (
          <button
            className="clear-btn"
            onClick={() => {
              onChange(f => ({ ...f, search: '' }));
              if (searchRef.current) searchRef.current.value = '';
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
