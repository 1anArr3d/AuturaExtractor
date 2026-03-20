import React, { useState, useEffect } from 'react';
import './App.css';

const FilterSection = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="filter-section">
      <button className="filter-section-title" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span className={`filter-arrow ${open ? 'open' : ''}`}>›</span>
      </button>
      {open && <div className="filter-section-body">{children}</div>}
    </div>
  );
};

const ChecklistFilter = ({ options, selected, onChange }) => {
  const toggle = (val) => {
    const next = new Set(selected);
    next.has(val) ? next.delete(val) : next.add(val);
    onChange(next);
  };
  return (
    <div className="checklist">
      {options.map(opt => (
        <label key={opt} className="checklist-item">
          <input type="checkbox" checked={selected.has(opt)} onChange={() => toggle(opt)} />
          <span>{opt || '—'}</span>
        </label>
      ))}
    </div>
  );
};

const ImageCycler = ({ images }) => {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return <div className="no-img">No Photos</div>;
  const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); };
  const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); };
  return (
    <div className="img-cycler">
      <img src={images[idx]} alt="vehicle" className="cycler-img" />
      {images.length > 1 && (
        <div className="cycler-controls">
          <button onClick={prev}>‹</button>
          <span>{idx + 1}/{images.length}</span>
          <button onClick={next}>›</button>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [vehicles, setVehicles] = useState([]);
  const [auctionId, setAuctionId] = useState("");
  const [scrapeStatus, setScrapeStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingVins, setLoadingVins] = useState(new Set());

  const [yearRange, setYearRange] = useState([null, null]);
  const [filters, setFilters] = useState({
    make: new Set(), model: new Set(), start_status: new Set(),
    engine_type: new Set(), transmission: new Set(),
  });

  const fetchVehicles = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/vehicles");
      const data = await res.json();
      setVehicles(data);
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };

  const handleAction = async (path, method = 'POST') => {
    const res = await fetch(`http://127.0.0.1:8000${path}`, { method });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Request failed: ${res.status}`);
    }
    return res.json();
  };

  const handleScrapeAuction = async () => {
    if (!auctionId) return;
    try {
      setScrapeStatus('running');
      await handleAction(`/scrape/${auctionId}`);
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/scrape/${auctionId}/status`);
          const data = await res.json();
          setScrapeStatus(data.status);
          if (data.status !== 'running') clearInterval(poll);
        } catch { clearInterval(poll); setScrapeStatus('failed'); }
      }, 2000);
    } catch (err) {
      setScrapeStatus('failed');
      alert(`Scrape failed: ${err.message}`);
    }
  };

  const handleInspectVin = async (vin) => {
    setLoadingVins(prev => new Set(prev).add(vin));
    try {
      await handleAction(`/inspectionscrape/${vin}`);
    } catch (err) {
      alert(`Inspection failed for ${vin}: ${err.message}`);
    } finally {
      setLoadingVins(prev => { const s = new Set(prev); s.delete(vin); return s; });
    }
  };

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 2000);
    return () => clearInterval(interval);
  }, []);

  const years = [...new Set(vehicles.map(c => c.year).filter(Boolean))].sort();
  const minYear = years[0] ? parseInt(years[0]) : 2000;
  const maxYear = years[years.length - 1] ? parseInt(years[years.length - 1]) : new Date().getFullYear();
  const yearMin = yearRange[0] ?? minYear;
  const yearMax = yearRange[1] ?? maxYear;

  const uniqueOpts = (key) => [...new Set(vehicles.map(c => c[key]).filter(Boolean))].sort();

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  const hasActiveFilters = Object.values(filters).some(s => s.size > 0) ||
    yearRange[0] !== null || yearRange[1] !== null;

  const clearAll = () => {
    setFilters({ make: new Set(), model: new Set(), start_status: new Set(), engine_type: new Set(), transmission: new Set() });
    setYearRange([null, null]);
  };

  const filteredVehicles = vehicles.filter(car => {
    const y = parseInt(car.year);
    if (!isNaN(y) && (y < yearMin || y > yearMax)) return false;
    for (const [key, sel] of Object.entries(filters)) {
      if (sel.size > 0 && !sel.has(car[key])) return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!Object.values(car).some(v => String(v || "").toLowerCase().includes(term))) return false;
    }
    return true;
  });

  return (
    <div className="app-wrapper">

      <aside className="sidebar">
        <div className="sidebar-header">
          <span>Filters</span>
          {hasActiveFilters && <button className="clear-all-btn" onClick={clearAll}>Clear All</button>}
        </div>

        <FilterSection title="Year" defaultOpen={true}>
          <div className="year-range-labels">
            <span>{yearMin}</span><span>{yearMax}</span>
          </div>
          <input type="range" min={minYear} max={maxYear} value={yearMin}
            onChange={e => setYearRange([parseInt(e.target.value), yearRange[1]])}
            className="slider" />
          <input type="range" min={minYear} max={maxYear} value={yearMax}
            onChange={e => setYearRange([yearRange[0], parseInt(e.target.value)])}
            className="slider" />
        </FilterSection>

        <FilterSection title="Make">
          <ChecklistFilter options={uniqueOpts('make')} selected={filters.make} onChange={v => setFilter('make', v)} />
        </FilterSection>

        <FilterSection title="Model">
          <ChecklistFilter options={uniqueOpts('model')} selected={filters.model} onChange={v => setFilter('model', v)} />
        </FilterSection>

        <FilterSection title="Status">
          <ChecklistFilter options={uniqueOpts('start_status')} selected={filters.start_status} onChange={v => setFilter('start_status', v)} />
        </FilterSection>

        <FilterSection title="Engine">
          <ChecklistFilter options={uniqueOpts('engine_type')} selected={filters.engine_type} onChange={v => setFilter('engine_type', v)} />
        </FilterSection>

        <FilterSection title="Transmission">
          <ChecklistFilter options={uniqueOpts('transmission')} selected={filters.transmission} onChange={v => setFilter('transmission', v)} />
        </FilterSection>
      </aside>

      <div className="main-content">
        <header className="main-header">
          <div className="header-info">
            <h1>Auction Inventory</h1>
            <div className="vehicle-count">{filteredVehicles.length} / {vehicles.length} Units</div>
          </div>
          <div className="controls">
            <input
              placeholder="Auction ID"
              value={auctionId}
              onChange={e => setAuctionId(e.target.value)}
              className="input-auction"
            />
            <button onClick={handleScrapeAuction} className={`btn-start ${scrapeStatus === 'running' ? 'btn-running' : ''}`} disabled={scrapeStatus === 'running'}>
              {scrapeStatus === 'running' ? 'Scraping...' : scrapeStatus === 'done' ? 'Done ✓' : scrapeStatus === 'failed' ? 'Failed ✗' : 'Scrape Auction'}
            </button>
            <button onClick={() => { if (window.confirm("Clear all?")) handleAction('/vehicles', 'DELETE').catch(err => alert(err.message)); }} className="btn-clear">
              Clear DB
            </button>
            <input
              placeholder="Search..."
              className="input-search"
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="table-container">
          <table className="vehicle-table">
            <thead>
              <tr>
                {["Photos", "Year", "Make", "Model", "Color", "Keys", "Cat", "Status", "Engine", "Trans", "VIN", "Inspection History", "Actions"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((car, idx) => (
                <tr key={car.vin} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                  <td><ImageCycler images={car.images ? JSON.parse(car.images) : []} /></td>
                  <td>{car.year}</td>
                  <td>{car.make}</td>
                  <td>{car.model}</td>
                  <td>{car.color}</td>
                  <td>{car.key_status}</td>
                  <td className={car.catalytic_converter === 'Present' ? 'cat-present' : 'cat-missing'}>
                    {car.catalytic_converter}
                  </td>
                  <td>{car.start_status}</td>
                  <td>{car.engine_type}</td>
                  <td>{car.transmission}</td>
                  <td className="vin-text">{car.vin}</td>
                  <td className="odo-text">{car.last_recorded_odo || '--'}</td>
                  <td>
                    <button
                      onClick={() => handleInspectVin(car.vin)}
                      disabled={loadingVins.has(car.vin)}
                      className={`btn-inspect ${loadingVins.has(car.vin) ? 'loading' : ''}`}
                    >
                      {loadingVins.has(car.vin) ? 'Scraping...' : 'Inspect VIN'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
