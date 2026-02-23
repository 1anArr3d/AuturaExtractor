import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [vehicles, setVehicles] = useState([]);
  const [auctionId, setAuctionId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingVin, setLoadingVin] = useState(null);

  const fetchVehicles = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/vehicles");
      const data = await res.json();
      setVehicles(data);
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (path, method = 'POST') => {
    try {
      await fetch(`http://127.0.0.1:8000${path}`, { method });
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  const filteredVehicles = vehicles.filter(car =>
    Object.values(car).some(val =>
      String(val || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="app-wrapper">
      <header className="main-header">
        <div className="header-info">
          <h1>Auction Inventory</h1>
          <div className="vehicle-count">{vehicles.length} Units</div>
        </div>
        
        <div className="controls">
          <input 
            placeholder="Auction ID" 
            value={auctionId} 
            onChange={e => setAuctionId(e.target.value)} 
            className="input-auction"
          />
          <button onClick={() => handleAction(`/scrape/${auctionId}`)} className="btn-start">
            Scrape Auction
          </button>
          <button onClick={() => { if(window.confirm("Clear all?")) handleAction('/vehicles', 'DELETE') }} className="btn-clear">
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
              {["Year", "Make", "Model", "Color", "Keys", "Cat", "Status", "Engine", "Trans", "VIN", "Inspection History", "Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map(car => (
              <tr key={car.vin}>
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
                    onClick={() => {
                        setLoadingVin(car.vin);
                        handleAction(`/inspectionscrape/${car.vin}`).then(() => {
                            setTimeout(() => setLoadingVin(null), 5000);
                        });
                    }}
                    disabled={loadingVin === car.vin}
                    className="btn-inspect"
                  >
                    {loadingVin === car.vin ? "Scraping..." : "Inspect Vin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;