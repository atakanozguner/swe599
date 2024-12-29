import React, { useState, useEffect } from "react";
import axios from "axios";

const TransferInventory = () => {
  const [districts, setDistricts] = useState([]);
  const [fromDistrict, setFromDistrict] = useState("");
  const [toDistrict, setToDistrict] = useState("");
  const [fromInventory, setFromInventory] = useState({});
  const [toInventory, setToInventory] = useState({});
  const [inventoryItem, setInventoryItem] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [message, setMessage] = useState("");

  // Fetch districts on load
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await axios.get("http://44.203.160.46:8000/districts");
        setDistricts(response.data);
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    fetchDistricts();
  }, []);

  // Fetch inventory for "from" district
  useEffect(() => {
    if (fromDistrict) {
      const fetchFromInventory = async () => {
        try {
          const response = await axios.get(
            `http://44.203.160.46:8000/districts/${fromDistrict}`
          );
          setFromInventory(response.data.inventory);
        } catch (error) {
          console.error("Error fetching 'from' inventory:", error);
          setFromInventory({});
        }
      };
      fetchFromInventory();
    } else {
      setFromInventory({});
    }
  }, [fromDistrict]);

  // Fetch inventory for "to" district
  useEffect(() => {
    if (toDistrict) {
      const fetchToInventory = async () => {
        try {
          const response = await axios.get(
            `http://44.203.160.46:8000/districts/${toDistrict}`
          );
          setToInventory(response.data.inventory);
        } catch (error) {
          console.error("Error fetching 'to' inventory:", error);
          setToInventory({});
        }
      };
      fetchToInventory();
    } else {
      setToInventory({});
    }
  }, [toDistrict]);

const handleTransfer = async () => {
    if (!fromDistrict || !toDistrict || !inventoryItem || quantity <= 0) {
        setMessage("Please fill in all fields correctly.");
        return;
    }
    if (fromDistrict === toDistrict) {
        setMessage("Source and target districts cannot be the same.");
        return;
    }

    try {
        const payload = {
            [inventoryItem]: parseInt(quantity, 10) // Ensure quantity is an integer
        };
        const response = await axios.post(
            `http://44.203.160.46:8000/districts/${fromDistrict}/transfer/${toDistrict}`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        setMessage(response.data.message);
        setFromInventory(response.data.source_inventory);
        setToInventory(response.data.target_inventory);
    } catch (error) {
        console.error("Error transferring inventory:", error);
        setMessage("Failed to transfer inventory.");
    }
};

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Transfer Inventory</h1>
      {message && <div className="alert alert-info">{message}</div>}

      <div className="row">
        {/* Source District Selection */}
        <div className="col-md-6">
          <label className="form-label">From District:</label>
          <select
            className="form-select"
            value={fromDistrict}
            onChange={(e) => setFromDistrict(e.target.value)}
          >
            <option value="">-- Select From District --</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
          <h5 className="mt-3">From District Inventory:</h5>
          {Object.keys(fromInventory).length === 0 ? (
            <p>No inventory available.</p>
          ) : (
            <ul>
              {Object.entries(fromInventory).map(([item, qty]) => (
                <li key={item}>
                  {item}: {qty}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Target District Selection */}
        <div className="col-md-6">
          <label className="form-label">To District:</label>
          <select
            className="form-select"
            value={toDistrict}
            onChange={(e) => setToDistrict(e.target.value)}
          >
            <option value="">-- Select To District --</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
          <h5 className="mt-3">To District Inventory:</h5>
          {Object.keys(toInventory).length === 0 ? (
            <p>No inventory available.</p>
          ) : (
            <ul>
              {Object.entries(toInventory).map(([item, qty]) => (
                <li key={item}>
                  {item}: {qty}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Inventory Transfer Form */}
      <div className="mt-4">
        <label className="form-label">Item to Transfer:</label>
        <input
          type="text"
          className="form-control"
          value={inventoryItem}
          onChange={(e) => setInventoryItem(e.target.value)}
          placeholder="Enter inventory item (e.g., Water - Water)"
        />
        <label className="form-label mt-3">Quantity:</label>
        <input
          type="number"
          className="form-control"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
          placeholder="Enter quantity"
        />
        <button
          className="btn btn-primary mt-3 w-100"
          onClick={handleTransfer}
        >
          Transfer Inventory
        </button>
      </div>
    </div>
  );
};

export default TransferInventory;
