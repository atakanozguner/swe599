import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const Dashboard = () => {
  const [requests, setRequests] = useState([]);
  const userRole = localStorage.getItem('role');
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get("http://localhost:8000/requests");
        setRequests(response.data);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };
    fetchRequests();
  }, []);

  if (!isLoggedIn || !['administrator', 'relief-worker'].includes(userRole)) {
    return <p>You do not have permission to view this page.</p>;
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Requests Dashboard</h1>
      {requests.length === 0 ? (
        <p className="text-center">No requests found.</p>
      ) : (
        <>
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Subtype</th>
                <th>Priority</th>
                <th>Location</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{req.type}</td>
                  <td>{req.subtype}</td>
                  <td>{req.priority}</td>
                  <td>
                    <a
                      href={`https://www.google.com/maps?q=${req.latitude},${req.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}
                    </a>
                  </td>
                  <td>{req.notes}</td>
                  <td>{req.status}</td>
                  <td>{new Date(req.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="text-center mt-5">All Requests on Map</h2>
          <MapContainer
            center={[41.0082, 28.9784]} // Default center: Istanbul
            zoom={10}
            style={{ height: "500px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {requests.map((req) => (
              <Marker
                key={req.id}
                position={[req.latitude, req.longitude]}
              >
                <Popup>
                  <strong>{req.type}</strong> - {req.subtype}
                  <br />
                  Priority: {req.priority}
                  <br />
                  Notes: {req.notes}
                  <br />
                  Status: {req.status}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </>
      )}
    </div>
  );
};

export default Dashboard;
