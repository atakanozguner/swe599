import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const InventoryManager = () => {
  const { districtId } = useParams(); // Get district ID from URL
  const [inventory, setInventory] = useState({});
  const [formData, setFormData] = useState({
    type: "",
    subtype: "",
    size: "",
    quantity: 0,
  });
  const [subOptions, setSubOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [specificItemOptions, setSpecificItemOptions] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hygieneMapping = {
    "Feminine Hygiene": ["Tampons", "Sanitary Pads", "Panty Liners"],
    "General Hygiene": [
      "Soap",
      "Shampoo",
      "Toothpaste",
      "Toothbrush",
      "Deodorant",
      "Razor/Shaving Kit",
      "Face Masks",
    ],
    "Cleaning Supplies": [
      "Wet Wipes",
      "Disinfectant Spray",
      "Hand Sanitizer",
      "Laundry Detergent",
      "Towels",
      "Tissue Paper",
    ],
    "Baby/Child Hygiene": [
      "Baby Diapers",
      "Baby Wipes",
      "Baby Shampoo",
      "Baby Lotion",
      "Pacifiers",
    ],
    "Other Hygiene Items": [
      "Nail Clippers",
      "Cotton Buds",
      "Comb/Brush",
      "Disposable Gloves",
      "Face Towels",
    ],
  };

  // Fetch current inventory
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/districts/${districtId}`
        );
        setInventory(response.data.inventory);
      } catch (err) {
        console.error("Error fetching inventory:", err);
        setError("Failed to load inventory. Please try again.");
      }
    };
    fetchInventory();
  }, [districtId]);

const handleUpdateInventory = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.type || !formData.subtype || formData.quantity === 0) {
        setError("Please provide valid type, subtype, and quantity.");
        return;
    }

    // Construct the payload key
    const inventoryKey = formData.size
        ? `${formData.type} - ${formData.subtype} ${formData.size}`
        : `${formData.type} - ${formData.subtype}`;

    const payload = { [inventoryKey]: formData.quantity }; // Correctly structured payload

    console.log("Payload to be sent:", payload); // Log the payload

    try {
        const response = await axios.post(
            `http://localhost:8000/districts/${districtId}/inventory`,
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Payload sent:", payload);
        console.log("Response from server:", response.data);

        setSuccess("Inventory updated successfully!");
        setInventory(response.data.inventory); // Update local inventory with the server's response
        setFormData({ type: "", subtype: "", size: "", quantity: 0 }); // Reset form
    } catch (err) {
        console.error("Error updating inventory:", err);
        setError("Failed to update inventory. Please try again.");
    }
};

  // Update subtype options based on type
  useEffect(() => {
    const updateSubOptions = async () => {
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
          try {
            const response = await axios.get(
              "http://localhost:8000/static/medicines.json"
            );
            setSubOptions(response.data.medicines);
          } catch (error) {
            console.error("Error fetching medicines:", error);
            setSubOptions([]);
          }
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
        case "hygiene":
          setSubOptions(Object.keys(hygieneMapping));
          setSizeOptions([]);
          setSpecificItemOptions([]);
          break;
        default:
          setSubOptions([]);
          setSizeOptions([]);
      }
    };
    updateSubOptions();
  }, [formData.type]);

  // Update size options for clothes
  useEffect(() => {
    if (["Coat", "T-Shirt", "Pants", "Hoodie", "Jacket", "Gloves"].includes(formData.subtype)) {
      setSizeOptions(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]);
    } else if (["Boots", "Shoes", "Socks"].includes(formData.subtype)) {
      setSizeOptions(Array.from({ length: 16 }, (_, i) => (30 + i).toString()));
    } else {
      setSizeOptions([]);
    }
  }, [formData.subtype]);

  // Update specific item options for hygiene
  useEffect(() => {
    if (hygieneMapping[formData.subtype]) {
      setSpecificItemOptions(hygieneMapping[formData.subtype]);
    } else {
      setSpecificItemOptions([]);
    }
  }, [formData.subtype]);

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Manage Inventory</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Inventory Display */}
      <h3>Current Inventory</h3>
      {Object.keys(inventory).length === 0 ? (
        <p>No inventory available.</p>
      ) : (
        <ul>
          {Object.entries(inventory).map(([item, quantity]) => (
            <li key={item}>
              {item}: {quantity}
            </li>
          ))}
        </ul>
      )}

      {/* Inventory Update Form */}
      <form onSubmit={handleUpdateInventory} className="shadow p-4 rounded">
        {/* Type Dropdown */}
        <div className="mb-3">
          <label className="form-label">Type:</label>
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
            <option value="hygiene">Hygiene</option>
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
              {subOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Size Dropdown for Clothes */}
        {/* Size Dropdown for Clothes */}
        {sizeOptions.length > 0 && formData.type === "clothes" && (
            <div className="mb-3">
                <label className="form-label">Size:</label>
                <select
                    className="form-select"
                    value={formData.size}
                    onChange={(e) => {
                        const selectedSize = e.target.value;
                        setFormData((prevFormData) => ({
                            ...prevFormData,
                            size: selectedSize,
                        }));
                    }}
                >
                    <option value="">-- Select --</option>
                    {sizeOptions.map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </div>
        )}

        {/* Specific Item Dropdown for Hygiene */}
        {/* Specific Item Dropdown for Hygiene */}
        {specificItemOptions.length > 0 && formData.type === "hygiene" && (
            <div className="mb-3">
                <label className="form-label">Specific Item:</label>
                <select
                className="form-select"
                value={formData.subtype}
                onChange={(e) => {
                    const selectedSpecificItem = e.target.value;
                    setFormData((prevFormData) => ({
                    ...prevFormData,
                    subtype: selectedSpecificItem,
                    }));
                }}
                >
                <option value="">-- Select --</option>
                {specificItemOptions.map((item) => (
                    <option key={item} value={item}>
                    {item}
                    </option>
                ))}
                </select>
            </div>
        )}

        {/* Quantity Input */}
        <div className="mb-3">
          <label className="form-label">Quantity:</label>
          <input
            type="number"
            className="form-control"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: parseInt(e.target.value, 10) })
            }
            placeholder="Enter quantity (positive to add, negative to remove)"
          />
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Update Inventory
        </button>
      </form>
    </div>
  );
};

export default InventoryManager;
