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
    size: "",
  });

  const [subOptions, setSubOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);

  // Update subtype options based on type
  useEffect(() => {
    const updateSubOptions = () => {
      switch (formData.type) {
        case "food":
          setSubOptions(["Warm Food"]);
          setSizeOptions([]);
          break;
        case "water":
          setSubOptions(["Water"]);
          setSizeOptions([]);
          break;
        case "shelter":
          setSubOptions(["Tent", "Container", "Temporary Housing"]);
          setSizeOptions([]);
          break;
        case "medical":
          axios
            .get("http://localhost:8000/static/medicines.json")
            .then((response) => setSubOptions(response.data.medicines))
            .catch((error) => console.error("Error fetching medicines:", error));
          setSizeOptions([]);
          break;
        case "clothes":
          setSubOptions([
            "Coat",
            "Jacket",
            "T-Shirt",
            "Pants",
            "Hoodie",
            "Boots",
            "Shoes",
            "Socks",
            "Gloves",
          ]);
          break;
        default:
          setSubOptions([]);
          setSizeOptions([]);
      }
    };
    updateSubOptions();
  }, [formData.type]);

  // Update size options based on subtype
  useEffect(() => {
    if (["Coat", "T-Shirt", "Pants", "Hoodie", "Gloves"].includes(formData.subtype)) {
      setSizeOptions(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]);
    } else if (["Boots", "Shoes", "Socks"].includes(formData.subtype)) {
      setSizeOptions(Array.from({ length: 16 }, (_, i) => (30 + i).toString()));
    } else {
      setSizeOptions([]);
    }
  }, [formData.subtype]);

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
    if (formData.tckn && !tcknRegex.test(formData.tckn)) {
      alert("TCKN must be 11 digits long and contain only numbers.");
      return;
    }

    const payload = {
      type: formData.type,
      subtype: formData.size
        ? `${formData.subtype} ${formData.size}`
        : formData.subtype,
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
              setFormData({ ...formData, type: e.target.value, subtype: "", size: "" })
            }
          >
            <option value="">-- Select --</option>
            <option value="shelter">Shelter</option>
            <option value="food">Food</option>
            <option value="water">Water</option>
            <option value="medical">Medical</option>
            <option value="clothes">Clothes</option>
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
                setFormData({ ...formData, subtype: e.target.value, size: "" })
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

        {/* Size Dropdown */}
        {sizeOptions.length > 0 && (
          <div className="mb-3">
            <label className="form-label">Size:</label>
            <select
              className="form-select"
              value={formData.size}
              onChange={(e) =>
                setFormData({ ...formData, size: e.target.value })
              }
            >
              <option value="">-- Select --</option>
              {sizeOptions.map((option, index) => (
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
