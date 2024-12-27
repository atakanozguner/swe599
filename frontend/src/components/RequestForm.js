import React, { useState, useEffect } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for missing marker icons
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const RequestForm = () => {
  const [formData, setFormData] = useState({
    type: "",
    subtype: "",
    latitude: 41.0082, // Default latitude for Istanbul
    longitude: 28.9784, // Default longitude for Istanbul
    tckn: "",
    notes: "",
  });

  const [subOptions, setSubOptions] = useState([]);
  const [medicineOptions, setMedicineOptions] = useState([]);

  // Fetch medicines.json from the backend
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await axios.get("http://localhost:8000/static/medicines.json");
        setMedicineOptions(response.data.medicines);
      } catch (error) {
        console.error("Error fetching medicines:", error);
      }
    };
    fetchMedicines();
  }, []);

  // Update subtype options based on type
  useEffect(() => {
    const updateSubOptions = () => {
      switch (formData.type) {
        case "food":
          setSubOptions(["Warm Food"]);
          break;
        case "water":
          setSubOptions(["Water"]);
          break;
        case "shelter":
          setSubOptions(["Tent", "Container", "Temporary Housing"]);
          break;
        case "medical":
          setSubOptions(medicineOptions);
          break;
        default:
          setSubOptions([]);
      }
    };
    updateSubOptions();
  }, [formData.type, medicineOptions]);

  // Custom hook to handle map clicks
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setFormData({
          ...formData,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      },
    });
    return formData.latitude && formData.longitude ? (
      <Marker position={[formData.latitude, formData.longitude]} />
    ) : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tcknRegex = /^[0-9]{11}$/;
    if (!tcknRegex.test(formData.tckn)) {
      alert("TCKN must be 11 digits long and contain only numbers.");
      return;
    }

    const payload = {
      type: formData.type,
      subtype: formData.subtype,
      latitude: formData.latitude,
      longitude: formData.longitude,
      tckn: formData.tckn,
      notes: formData.notes,
    };
    try {
      await axios.post("http://localhost:8000/submit-request", payload);
      alert("Request submitted successfully!");
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request.");
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Request Form</h1>
      <form onSubmit={handleSubmit} className="shadow p-4 rounded">
        {/* Need Type Dropdown */}
        <div className="mb-3">
          <label className="form-label">Need Type:</label>
          <select
            className="form-select"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value, subtype: "" })
            }
          >
            <option value="">-- Select --</option>
            <option value="shelter">Shelter</option>
            <option value="food">Food</option>
            <option value="water">Water</option>
            <option value="medical">Medical</option>
          </select>
        </div>

        {/* Subtype Dropdown */}
        {formData.type && (
          <div className="mb-3">
            <label className="form-label">Subtype:</label>
            <select
              className="form-select"
              value={formData.subtype}
              onChange={(e) =>
                setFormData({ ...formData, subtype: e.target.value })
              }
            >
              <option value="">-- Select --</option>
              {subOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* TCKN Text Box */}
        <div className="mb-3">
          <label className="form-label">TCKN:</label>
          <textarea
            className="form-control"
            value={formData.tckn}
            onChange={(e) =>
              setFormData({ ...formData, tckn: e.target.value })
            }
            placeholder="Enter your TCKN (Turkish ID Number, 11 digits)"
          />
        </div>

        {/* Notes Text Box */}
        <div className="mb-3">
          <label className="form-label">Notes:</label>
          <textarea
            className="form-control"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Add any additional details about your request"
          />
        </div>

        {/* Map for Location */}
        <div className="mb-3">
          <label className="form-label">Select Location:</label>
          <MapContainer
            center={[41.0082, 28.9784]} // Istanbul, Turkey
            zoom={13}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker />
          </MapContainer>
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default RequestForm;
