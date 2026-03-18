import './StatsBar.css';

const PLATFORM_COLORS = {
  Craigslist: '#9333ea',
  Reddit:     '#ef4444',
  Web:        '#3b82f6',
  OfferUp:    '#f59e0b',
};

export default function StatsBar({ stats }) {
  if (!stats) return null;

  const lastRun = stats.lastRun
    ? new Date(stats.lastRun.ran_at).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      })
    : 'Never';

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <div className="stat-value">{stats.total.toLocaleString()}</div>
        <div className="stat-label">Total Leads</div>
      </div>

      <div className="stat-card highlight">
        <div className="stat-value">{stats.newToday}</div>
        <div className="stat-label">New Today</div>
      </div>

      <div className="stat-card">
        <div className="stat-label" style={{ marginBottom: 8 }}>By Platform</div>
        <div className="platform-pills">
          {stats.byPlatform.length === 0 ? (
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>None yet</span>
          ) : stats.byPlatform.map(p => (
            <span
              key={p.platform}
              className="platform-pill"
              style={{ background: PLATFORM_COLORS[p.platform] || '#64748b' }}
            >
              {p.platform} {p.count}
            </span>
          ))}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-value last-run">{lastRun}</div>
        <div className="stat-label">Last Scan</div>
        {stats.lastRun?.found_count !== undefined && (
          <div className="stat-sub">+{stats.lastRun.found_count} new leads</div>
        )}
      </div>
    </div>
  );
}
