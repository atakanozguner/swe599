import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const Map = ({ requests }) => {
  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: "500px" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {requests.map((req) => (
        <Marker key={req.id} position={[req.location.lat, req.location.lng]}>
          <Popup>
            {req.type} - {req.priority}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
