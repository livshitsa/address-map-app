import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

function App() {
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [route, setRoute] = useState(null);
  const [directions, setDirections] = useState([]);

  const handleFromAddressChange = (e) => {
    setFromAddress(e.target.value);
  };

  const handleToAddressChange = (e) => {
    setToAddress(e.target.value);
  };

  const handleGetDirections = async () => {
    try {
      const fromResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fromAddress)}`);
      const toResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(toAddress)}`);
      const fromData = await fromResponse.json();
      const toData = await toResponse.json();

      if (fromData.length > 0 && toData.length > 0) {
        const fromCoords = [parseFloat(fromData[0].lon), parseFloat(fromData[0].lat)];
        const toCoords = [parseFloat(toData[0].lon), parseFloat(toData[0].lat)];

        const directionsResponse = await fetch(`https://router.project-osrm.org/route/v1/driving/${fromCoords.join(',')};${toCoords.join(',')}?overview=full&geometries=geojson&steps=true`);
        const directionsData = await directionsResponse.json();

        if (directionsData.code === "Ok" && directionsData.routes.length > 0) {
          const coordinates = directionsData.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRoute(coordinates);

          const steps = directionsData.routes[0].legs[0].steps.map(step => {
            const instruction = step.maneuver.type;
            const name = step.name ? ` onto ${step.name}` : '';
            return `${instruction}${name}`;
          });
          setDirections(steps);
        } else {
          alert('No route found');
        }
      } else {
        alert('One or both addresses not found');
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      alert('Failed to fetch directions. Please check your network connection.');
    }
  };

  const RoutePolyline = ({ positions }) => {
    const map = useMap();
    useEffect(() => {
      if (positions && positions.length > 0) {
        map.fitBounds(positions);
      }
    }, [positions, map]);
    return <Polyline positions={positions} color="blue" />;
  };

  return (
    <div className="App">
      <div className="App-header">
        <h1>Address Map App</h1>
        <input
          type="text"
          value={fromAddress}
          onChange={handleFromAddressChange}
          placeholder="From address"
        />
        <input
          type="text"
          value={toAddress}
          onChange={handleToAddressChange}
          placeholder="To address"
        />
        <button onClick={handleGetDirections}>Get Directions</button>
        <div className="directions">
          <h2>Driving Directions</h2>
          <ul>
            {directions.map((instruction, index) => (
              <li key={index}>{instruction || 'No instruction available'}</li>
            ))}
          </ul>
        </div>
      </div>
      <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: "100vh", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {route && <RoutePolyline positions={route} />}
      </MapContainer>
    </div>
  );
}

export default App;
