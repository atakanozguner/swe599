import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DistrictDetails = () => {
  const { districtId } = useParams();
  const [districtDetails, setDistrictDetails] = useState(null);
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState({});

  const navigate = useNavigate();

  // Fetch district metadata and requests
  const fetchDistrictData = async () => {
    try {
      const districtResponse = await axios.get(
        `http://localhost:8000/districts/${districtId}`
      );
      setDistrictDetails(districtResponse.data);

      const requestsResponse = await axios.get(
        `http://localhost:8000/districts/${districtId}/requests`
      );
      setRequests(requestsResponse.data);
    } catch (error) {
      console.error("Error fetching district details:", error);
    }
  };

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      const inventoryResponse = await axios.get(
        `http://localhost:8000/districts/${districtId}`
      );
      setInventory(inventoryResponse.data.inventory || {});
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  // Resolve a request
  const resolveRequest = async (requestId, subtype, quantity) => {
    try {
      const response = await axios.post(
        `http://localhost:8000/requests/${requestId}/resolve`
      );
      alert(response.data.message);
      fetchDistrictData(); // Refresh requests and district details
      fetchInventory(); // Refresh the inventory
    } catch (error) {
      console.error("Error resolving request:", error);
      alert("Failed to resolve request. Ensure sufficient inventory.");
    }
  };

  useEffect(() => {
    fetchDistrictData();
    fetchInventory();
  }, [districtId]);

  if (!districtDetails) return <div>Loading...</div>;

  return (
    <div className="district-details container mt-4">
      <h2>
        {districtDetails.name} - District ID: {districtDetails.id}
      </h2>
      <button
        className="btn btn-secondary mt-3"
        onClick={() => navigate(`/districts/${districtId}/inventory`)}
      >
        Manage District Inventory
      </button>
      <p>Latitude: {districtDetails.latitude}</p>
      <p>Longitude: {districtDetails.longitude}</p>
      <p>Requests Count: {districtDetails.request_count}</p>
      <h3>Requests</h3>
      {requests.length === 0 ? (
        <p>No requests for this district.</p>
      ) : (
        <ul className="list-group">
          {requests.map((req) => (
            <li key={req.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>Type:</strong> {req.type} - <strong>Subtype:</strong> {req.subtype} - <strong>Quantity:</strong> {req.quantity} - <strong>Timestamp:</strong> {req.timestamp} - <strong>Status:</strong> {req.status}
              </div>
              {req.status !== "resolved" && (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => resolveRequest(req.id, req.subtype, req.quantity)}
                >
                  Resolve
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DistrictDetails;
