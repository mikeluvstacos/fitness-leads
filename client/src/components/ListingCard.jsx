import './ListingCard.css';

const PLATFORM_CONFIG = {
  Craigslist: { color: '#7c3aed', bg: '#f3f0ff', icon: '📋' },
  Reddit:     { color: '#dc2626', bg: '#fff1f0', icon: '💬' },
  Web:        { color: '#2563eb', bg: '#eff6ff', icon: '🌐' },
  OfferUp:    { color: '#d97706', bg: '#fffbeb', icon: '🏷️' },
};

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date)) return null;
  const diff = Date.now() - date.getTime();
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min < 60)  return `${min}m ago`;
  if (hr < 24)   return `${hr}h ago`;
  if (day < 30)  return `${day}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ListingCard({ listing }) {
  const cfg = PLATFORM_CONFIG[listing.platform] || PLATFORM_CONFIG.Web;
  const posted  = timeAgo(listing.posted_at);
  const found   = timeAgo(listing.found_at);

  return (
    <div className={`card ${listing.is_new ? 'card-new' : ''}`}>
      <div className="card-header">
        <span
          className="badge"
          style={{ color: cfg.color, background: cfg.bg }}
        >
          {cfg.icon} {listing.platform}
        </span>
        {listing.is_new && <span className="new-badge">NEW</span>}
        <div className="card-time">
          {posted ? <span title="Posted">📅 {posted}</span> : null}
        </div>
      </div>

      <h3 className="card-title">{listing.title}</h3>

      {listing.snippet && (
        <p className="card-snippet">{listing.snippet}</p>
      )}

      <div className="card-footer">
        <span className="found-time">Found {found}</span>
        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          className="view-btn"
          style={{ background: cfg.color }}
        >
          View Post →
        </a>
      </div>
    </div>
  );
}
