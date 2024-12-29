import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const DistrictDetails = () => {
  const { districtId } = useParams();
  const [districtDetails, setDistrictDetails] = useState(null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchDistrictData = async () => {
      try {
        // Fetch district metadata
        const districtResponse = await axios.get(`http://localhost:8000/districts/${districtId}`);
        setDistrictDetails(districtResponse.data);

        // Fetch requests for this district
        const requestsResponse = await axios.get(`http://localhost:8000/districts/${districtId}/requests`);
        setRequests(requestsResponse.data);
      } catch (error) {
        console.error("Error fetching district details:", error);
      }
    };

    fetchDistrictData();
  }, [districtId]);

  if (!districtDetails) return <div>Loading...</div>;

  return (
    <div className="district-details container mt-4">
      <h2>
        {districtDetails.name} - District ID: {districtDetails.id}
      </h2>
      <p>Latitude: {districtDetails.latitude}</p>
      <p>Longitude: {districtDetails.longitude}</p>
      <p>Requests Count: {districtDetails.request_count}</p>
      <h3>Requests</h3>
      {requests.length === 0 ? (
        <p>No requests for this district.</p>
      ) : (
        <ul className="list-group">
          {requests.map((req) => (
            <li key={req.id} className="list-group-item">
              <strong>Type:</strong> {req.type} - <strong>Subtype:</strong> {req.subtype} -{" "}
              <strong>Status:</strong> {req.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DistrictDetails;
