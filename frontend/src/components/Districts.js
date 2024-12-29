import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const Districts = () => {
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/districts");
        setDistricts(response.data);
      } catch (err) {
        console.error("Error fetching districts:", err);
        setError("Failed to load districts. Please try again later.");
      }
    };
    fetchDistricts();
  }, []);

  const handleDistrictClick = (districtId) => {
    navigate(`/districts/${districtId}`);
  };

  const getColorForCount = (count) => {
    const maxCount = 20; // Define the maximum count for full red
    const ratio = Math.min(count / maxCount, 1); // Normalize between 0 and 1
    const red = Math.floor(255 * ratio); // Increase red intensity with count
    const blue = Math.floor(255 * (1 - ratio)); // Decrease blue intensity with count
    return `rgb(${red}, 0, ${blue})`; // Return RGB color
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-end mb-3">
        <button
          className="btn btn-primary"
          onClick={() => navigate('/transfer-inventory')}
        >
          Transfer Inventory Page
        </button>
      </div>
      <h1 className="text-center mb-4">Districts</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {districts.length === 0 ? (
        <p className="text-center">No districts found.</p>
      ) : (
        <>
          {/* Districts List */}
          <table className="table table-striped table-hover">
            <thead className="table-dark">
                <tr>
                <th>Name</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Requests</th> {/* Updated Header */}
                </tr>
            </thead>
            <tbody>
                {districts.map((district) => (
                <tr
                    key={district.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleDistrictClick(district.id)}
                >
                    <td>{district.name}</td>
                    <td>{district.latitude}</td>
                    <td>{district.longitude}</td>
                    <td>
                        <span
                        style={{
                            fontWeight: "bold",
                            color: getColorForCount(district.request_count || 0),
                        }}
                        >
                        {district.request_count || 0}
                        </span>
                    </td>                
                </tr>
                ))}
            </tbody>
          </table>


          {/* Map Display */}
          <MapContainer
            center={[41.0082, 28.9784]} // Default to Istanbul
            zoom={10}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {districts.map((district) => (
              <Marker
                key={district.id}
                position={[district.latitude, district.longitude]}
              >
                <Popup>
                  <strong>{district.name}</strong>
                  <br />
                  Latitude: {district.latitude}
                  <br />
                  Longitude: {district.longitude}
                  <br />
                  Requests: {district.request_count}
                  <br />
                  <button
                    className="btn btn-primary btn-sm mt-2"
                    onClick={() => handleDistrictClick(district.id)}
                  >
                    View Details
                  </button>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </>
      )}
    </div>
  );
};

export default Districts;
