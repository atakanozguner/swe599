import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const DistrictDetails = () => {
  const { districtId } = useParams();
  const [district, setDistrict] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDistrictDetails = async () => {
      try {
        const districtResponse = await axios.get(`http://localhost:8000/districts`);
        const foundDistrict = districtResponse.data.find(
          (d) => d.id === parseInt(districtId)
        );
        setDistrict(foundDistrict || null);

        const requestsResponse = await axios.get(
          `http://localhost:8000/districts/${districtId}/requests`
        );
        setRequests(requestsResponse.data);
      } catch (err) {
        console.error("Error fetching district details:", err);
        setError("Failed to load district details. Please try again later.");
      }
    };
    fetchDistrictDetails();
  }, [districtId]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!district) return <p>Loading district details...</p>;

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">{district.name} Details</h1>
      <h3>Inventory</h3>
      <ul>
        {Object.entries(district.inventory).map(([item, count]) => (
          <li key={item}>
            {item}: {count}
          </li>
        ))}
      </ul>

      <h3>Requests</h3>
      {requests.length === 0 ? (
        <p>No requests for this district.</p>
      ) : (
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Type</th>
              <th>Subtype</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.type}</td>
                <td>{req.subtype}</td>
                <td>{req.priority}</td>
                <td>{req.status}</td>
                <td>{req.notes || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DistrictDetails;
