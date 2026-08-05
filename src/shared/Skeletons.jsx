// Content-shaped placeholders shown while data loads — steadier than a spinner.

// A grid of event-card skeletons matching EventCard's layout.
export function EventGridSkeleton({ count = 8 }) {
  return (
    <div className="grid" style={{ paddingBottom: 20 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div className="card" key={i} aria-hidden="true">
          <div className="skeleton" style={{ height: 190, borderRadius: 0 }} />
          <div style={{ padding: '18px 20px 22px' }}>
            <div className="skeleton" style={{ height: 18, width: '85%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 13, width: '55%', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 13, width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Stacked row skeletons for the bookings list.
export function ListSkeleton({ count = 3 }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div className="card booking-card" key={i} aria-hidden="true">
          <div className="skeleton booking-thumb" style={{ borderRadius: 0 }} />
          <div style={{ padding: 18, flex: 1 }}>
            <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 13, width: '40%', marginBottom: 18 }} />
            <div className="skeleton" style={{ height: 13, width: '30%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
