import { useState, useEffect, useCallback } from 'react';
import StatsBar from './components/StatsBar';
import FilterBar from './components/FilterBar';
import ListingCard from './components/ListingCard';
import './App.css';

const API = '/api';

export default function App() {
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ platform: 'all', search: '' });
  const [runMsg, setRunMsg] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter.platform !== 'all') params.set('platform', filter.platform);
      if (filter.search) params.set('search', filter.search);

      const [listRes, statsRes, statusRes] = await Promise.all([
        fetch(`${API}/listings?${params}`),
        fetch(`${API}/stats`),
        fetch(`${API}/status`),
      ]);

      setListings(await listRes.json());
      setStats(await statsRes.json());
      const { running } = await statusRes.json();
      setIsRunning(running);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Initial load + auto-refresh every 30 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRunNow = async () => {
    if (isRunning) return;
    setRunMsg('Scraper started — results will appear shortly...');
    await fetch(`${API}/run`, { method: 'POST' });
    setIsRunning(true);
    setTimeout(() => {
      setRunMsg('');
      fetchData();
    }, 8000);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">🏋️</span>
            <div>
              <h1>Fitness Lead Finder</h1>
              <span className="location">Houston, TX</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          {runMsg && <span className="run-msg">{runMsg}</span>}
          <button
            className={`run-btn ${isRunning ? 'running' : ''}`}
            onClick={handleRunNow}
            disabled={isRunning}
          >
            {isRunning ? (
              <><span className="spinner" /> Searching...</>
            ) : (
              <><span>▶</span> Run Now</>
            )}
          </button>
        </div>
      </header>

      <main className="main">
        <StatsBar stats={stats} />
        <FilterBar filter={filter} onChange={setFilter} stats={stats} />

        {loading ? (
          <div className="empty-state">
            <div className="spinner large" />
            <p>Loading leads...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3>No leads found yet</h3>
            <p>Click <strong>Run Now</strong> to start searching, or wait for the automatic scan.</p>
          </div>
        ) : (
          <div className="grid">
            {listings.map(l => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        Auto-refreshes every 30s · Scheduled scan every 6 hours · {listings.length} results shown
      </footer>
    </div>
  );
}
