import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import API from "../../../api/axiosConfig";

// Default coordinates dictionary for common cities, regions, and international supplier countries
const KNOWN_COORDINATES = {
    // Bangladesh Hubs
    "dhaka": [23.8103, 90.4125],
    "gulshan": [23.7925, 90.4078],
    "banani": [23.7937, 90.4066],
    "uttara": [23.8759, 90.3795],
    "motijheel": [23.7330, 90.4172],
    "mirpur": [23.8223, 90.3654],
    "dhanmondi": [23.7461, 90.3742],
    "gazipur": [23.9999, 90.4203],
    "narayanganj": [23.6238, 90.5000],
    "savar": [23.8583, 90.2667],
    "chittagong": [22.3569, 91.7832],
    "chattogram": [22.3569, 91.7832],
    "sylhet": [24.8949, 91.8687],
    "khulna": [22.8456, 89.5403],
    "rajshahi": [24.3745, 88.6042],
    "barisal": [22.7010, 90.3535],
    "rangpur": [25.7439, 89.2752],
    "comilla": [23.4682, 91.1788],
    "cumilla": [23.4682, 91.1788],
    "cox's bazar": [21.4272, 92.0058],
    "bogura": [24.8465, 89.3777],
    "bogra": [24.8465, 89.3777],
    "mymensingh": [24.7471, 90.4203],

    // International Countries & Ports
    "china": [35.8617, 104.1954],
    "shanghai": [31.2304, 121.4737],
    "shenzhen": [22.5431, 114.0579],
    "singapore": [1.3521, 103.8198],
    "germany": [51.1657, 10.4515],
    "frankfurt": [50.1109, 8.6821],
    "usa": [37.0902, -95.7129],
    "united states": [37.0902, -95.7129],
    "india": [20.5937, 78.9629],
    "mumbai": [19.0760, 72.8777],
    "delhi": [28.7041, 77.1025],
    "kolkata": [22.5726, 88.3639],
    "united kingdom": [55.3781, -3.4360],
    "uk": [55.3781, -3.4360],
    "london": [51.5074, -0.1278],
    "japan": [36.2048, 138.2529],
    "tokyo": [35.6762, 139.6503],
    "uae": [23.4241, 53.8478],
    "dubai": [25.2048, 55.2708],
    "malaysia": [4.2105, 101.9758],
    "vietnam": [14.0583, 108.2772],
    "thailand": [15.8700, 100.9925],
    "south korea": [35.9078, 127.7669]
};

// Geocoding helper that detects direct lat/lng or matches known keywords
function resolveCoordinates(locationStr, defaultOffset = 0) {
    if (!locationStr || typeof locationStr !== "string") {
        return [23.8103 + (defaultOffset * 0.01), 90.4125 + (defaultOffset * 0.01)];
    }

    // Check if locationStr is in "lat, lng" format
    const coordMatch = locationStr.match(/(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
    if (coordMatch) {
        return [parseFloat(coordMatch[1]), parseFloat(coordMatch[3])];
    }

    const clean = locationStr.toLowerCase();
    for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
        if (clean.includes(key)) {
            const jitter = (defaultOffset % 7) * 0.008;
            return [coords[0] + jitter, coords[1] + jitter];
        }
    }

    return [23.8103 + ((defaultOffset % 10) * 0.012), 90.4125 + ((defaultOffset % 10) * 0.012)];
}

// Custom Leaflet DivIcons for rich aesthetics
function createPinIcon(type) {
    const iconColors = {
        project: { bg: "#2563eb", text: "🏗️", border: "#1d4ed8" },
        client: { bg: "#059669", text: "🏢", border: "#047857" },
        supplier: { bg: "#d97706", text: "🚢", border: "#b45309" }
    };
    const c = iconColors[type] || iconColors.project;

    return L.divIcon({
        className: "custom-map-marker",
        html: `
            <div style="
                background: ${c.bg};
                border: 2px solid white;
                border-radius: 50%;
                width: 34px;
                height: 34px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-size: 16px;
                color: white;
                transform: translate(-50%, -50%);
                cursor: pointer;
                transition: transform 0.2s ease;
            ">
                ${c.text}
            </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18]
    });
}

export default function BusinessLocationsMap({ onSelectProject }) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);

    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("all"); // "all" | "project" | "client" | "supplier"
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLocation, setSelectedLocation] = useState(null);

    // Fetch data
    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        Promise.all([
            API.get("/projects").catch(() => ({ data: [] })),
            API.get("/clients").catch(() => ({ data: [] })),
            API.get("/suppliers").catch(() => ({ data: [] }))
        ]).then(([projRes, clientRes, supRes]) => {
            if (isMounted) {
                setProjects(projRes.data || []);
                setClients(clientRes.data || []);
                setSuppliers(supRes.data || []);
                setLoading(false);
            }
        });

        return () => { isMounted = false; };
    }, []);

    // Prepare unified location markers list
    const allLocations = useMemo(() => {
        const list = [];
        let index = 0;

        // Project Site Locations
        const seenProjKeys = new Set();
        projects.forEach((p) => {
            const nameKey = `${(p.projectName || "").trim().toLowerCase()}_${(p.clientName || "").trim().toLowerCase()}`;
            if (seenProjKeys.has(nameKey)) return;
            seenProjKeys.add(nameKey);

            const locText = p.projectLocation || p.location || "Dhaka, Bangladesh";
            const [lat, lng] = resolveCoordinates(locText, index++);
            list.push({
                id: `proj-${p._id}`,
                type: "project",
                title: p.projectName,
                subtitle: `Client: ${p.clientName}`,
                locationStr: locText,
                lat,
                lng,
                status: p.status || "Pending",
                details: {
                    client: p.clientName,
                    budget: p.budget ? `BDT ${Number(p.budget).toLocaleString()}` : "N/A",
                    deadline: p.deadline ? new Date(p.deadline).toLocaleDateString() : "N/A",
                    assignedEmployee: p.assignedEmployee || "Unassigned",
                    description: p.description || ""
                },
                raw: p
            });
        });

        // Client Locations
        clients.forEach((c) => {
            const locText = c.address || "Dhaka, Bangladesh";
            const [lat, lng] = resolveCoordinates(locText, index++);
            list.push({
                id: `client-${c._id}`,
                type: "client",
                title: c.companyName || c.company || "Client Company",
                subtitle: `Contact: ${c.contactPerson || c.name || "—"}`,
                locationStr: locText,
                lat,
                lng,
                status: c.status || "Active",
                details: {
                    contactPerson: c.contactPerson || c.name || "—",
                    email: c.email || "—",
                    phone: c.phone || "—",
                    clientType: c.clientType || "Company"
                },
                raw: c
            });
        });

        // Supplier Locations
        suppliers.forEach((s) => {
            const locText = `${s.address || ""}, ${s.country || ""}`.trim() || s.country || "International";
            const [lat, lng] = resolveCoordinates(locText, index++);
            list.push({
                id: `sup-${s._id}`,
                type: "supplier",
                title: s.supplierName || "Supplier",
                subtitle: `Category: ${s.productCategory || "Goods"} (${s.country || "Global"})`,
                locationStr: locText,
                lat,
                lng,
                status: s.status || "Active",
                details: {
                    country: s.country || "—",
                    category: s.productCategory || "—",
                    contactPerson: s.contactPerson || "—",
                    email: s.email || "—",
                    phone: s.phone || "—"
                },
                raw: s
            });
        });

        return list;
    }, [projects, clients, suppliers]);

    // Filtered locations
    const filteredLocations = useMemo(() => {
        return allLocations.filter((item) => {
            const matchesType = filterType === "all" || item.type === filterType;
            const matchesSearch = !searchQuery.trim() ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.locationStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [allLocations, filterType, searchQuery]);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [23.8103, 90.4125],
                zoom: 7,
                scrollWheelZoom: true
            });

            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
                maxZoom: 19
            }).addTo(map);

            const markersLayer = L.layerGroup().addTo(map);
            mapInstanceRef.current = map;
            markersLayerRef.current = markersLayer;
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update map markers when filtered list changes
    useEffect(() => {
        if (!mapInstanceRef.current || !markersLayerRef.current) return;

        const layer = markersLayerRef.current;
        layer.clearLayers();

        const bounds = L.latLngBounds();

        filteredLocations.forEach((item) => {
            const marker = L.marker([item.lat, item.lng], {
                icon: createPinIcon(item.type)
            });

            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.locationStr || item.title)}`;

            marker.bindPopup(`
                <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 200px;">
                    <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px; color: #1e293b;">
                        ${item.title}
                    </div>
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: ${item.type === 'project' ? '#2563eb' : item.type === 'client' ? '#059669' : '#d97706'}; margin-bottom: 6px;">
                        ${item.type === 'project' ? '🏗️ Project Site' : item.type === 'client' ? '🏢 Client' : '🚢 Supplier'} • ${item.status}
                    </div>
                    <div style="color: #475569; margin-bottom: 4px;">
                        📍 <strong>Location:</strong> ${item.locationStr}
                    </div>
                    <div style="color: #64748b; font-size: 12px; margin-bottom: 8px;">
                        ${item.subtitle}
                    </div>
                    <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="
                        display: inline-block;
                        padding: 6px 10px;
                        background: #2563eb;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 600;
                        font-size: 11px;
                        text-align: center;
                    ">
                        Open in Google Maps ↗
                    </a>
                </div>
            `);

            marker.on("click", () => {
                setSelectedLocation(item);
            });

            layer.addLayer(marker);
            bounds.extend([item.lat, item.lng]);
        });

        if (filteredLocations.length > 0 && bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        }
    }, [filteredLocations]);

    const handleFocusLocation = (loc) => {
        setSelectedLocation(loc);
        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([loc.lat, loc.lng], 13, { duration: 1.2 });
        }
    };

    const countProjects = allLocations.filter((i) => i.type === "project").length;
    const countClients = allLocations.filter((i) => i.type === "client").length;
    const countSuppliers = allLocations.filter((i) => i.type === "supplier").length;

    return (
        <section className="business-map-container" style={{
            background: "white",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            margin: "20px 0"
        }}>
            {/* Map Header & Controls */}
            <div style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                background: "#f8fafc"
            }}>
                <div>
                    <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "#2563eb" }}>
                        Google Maps Location Support
                    </span>
                    <h2 style={{ fontSize: "1.35rem", margin: "4px 0 2px 0", color: "#0f172a" }}>
                        Business Locations & Field Activity Map
                    </h2>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                        Visualize client offices, supplier vendors, and contractor project sites on Google Maps to coordinate operations and field logistics.
                    </p>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                    <input
                        type="text"
                        placeholder="Search location or site..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            outline: "none",
                            minWidth: "220px"
                        }}
                    />

                    {/* Filter Pills */}
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button
                            type="button"
                            onClick={() => setFilterType("all")}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "20px",
                                border: "1px solid " + (filterType === "all" ? "#2563eb" : "#cbd5e1"),
                                background: filterType === "all" ? "#2563eb" : "white",
                                color: filterType === "all" ? "white" : "#475569",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            All ({allLocations.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType("project")}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "20px",
                                border: "1px solid " + (filterType === "project" ? "#2563eb" : "#cbd5e1"),
                                background: filterType === "project" ? "#2563eb" : "white",
                                color: filterType === "project" ? "white" : "#475569",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            🏗️ Projects ({countProjects})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType("client")}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "20px",
                                border: "1px solid " + (filterType === "client" ? "#059669" : "#cbd5e1"),
                                background: filterType === "client" ? "#059669" : "white",
                                color: filterType === "client" ? "white" : "#475569",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            🏢 Clients ({countClients})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType("supplier")}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "20px",
                                border: "1px solid " + (filterType === "supplier" ? "#d97706" : "#cbd5e1"),
                                background: filterType === "supplier" ? "#d97706" : "white",
                                color: filterType === "supplier" ? "white" : "#475569",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            🚢 Suppliers ({countSuppliers})
                        </button>
                    </div>
                </div>
            </div>

            {/* Map & Interactive Side Panel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", minHeight: "520px" }}>
                {/* Map View */}
                <div style={{ position: "relative", minHeight: "520px", background: "#e2e8f0" }}>
                    <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "520px" }} />
                    {loading && (
                        <div style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            background: "rgba(255,255,255,0.9)",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            fontWeight: "600",
                            color: "#334155",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            zIndex: 1000
                        }}>
                            Loading location coordinates...
                        </div>
                    )}
                </div>

                {/* Sidebar Directory & Field Activities Panel */}
                <div style={{
                    borderLeft: "1px solid #e2e8f0",
                    background: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    height: "520px",
                    overflow: "hidden"
                }}>
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                            Location Directory ({filteredLocations.length})
                        </h3>
                        <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                            Click any site to focus on map & view operations details
                        </p>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
                        {filteredLocations.length === 0 ? (
                            <div style={{ padding: "30px 15px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                                No locations found matching your criteria.
                            </div>
                        ) : (
                            filteredLocations.map((item) => {
                                const isSelected = selectedLocation?.id === item.id;
                                const badgeColor = item.type === "project" ? "#2563eb" : item.type === "client" ? "#059669" : "#d97706";
                                const badgeBg = item.type === "project" ? "#eff6ff" : item.type === "client" ? "#ecfdf5" : "#fffbeb";

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleFocusLocation(item)}
                                        style={{
                                            padding: "12px",
                                            marginBottom: "8px",
                                            borderRadius: "10px",
                                            border: `1px solid ${isSelected ? badgeColor : "#e2e8f0"}`,
                                            background: isSelected ? badgeBg : "#ffffff",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                                            <strong style={{ fontSize: "13px", color: "#0f172a" }}>{item.title}</strong>
                                            <span style={{
                                                fontSize: "10px",
                                                fontWeight: "800",
                                                textTransform: "uppercase",
                                                padding: "2px 8px",
                                                borderRadius: "12px",
                                                background: badgeBg,
                                                color: badgeColor
                                            }}>
                                                {item.type}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: "12px", color: "#475569", marginBottom: "4px" }}>
                                            📍 {item.locationStr}
                                        </div>

                                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                                            {item.subtitle}
                                        </div>

                                        {isSelected && (
                                            <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #cbd5e1" }}>
                                                {item.type === "project" && (
                                                    <div style={{ fontSize: "11px", color: "#334155", display: "grid", gap: "2px", marginBottom: "8px" }}>
                                                        <div><strong>Budget:</strong> {item.details.budget}</div>
                                                        <div><strong>Deadline:</strong> {item.details.deadline}</div>
                                                        <div><strong>Lead:</strong> {item.details.assignedEmployee}</div>
                                                    </div>
                                                )}
                                                {item.type === "client" && (
                                                    <div style={{ fontSize: "11px", color: "#334155", display: "grid", gap: "2px", marginBottom: "8px" }}>
                                                        <div><strong>Contact:</strong> {item.details.contactPerson}</div>
                                                        <div><strong>Email:</strong> {item.details.email}</div>
                                                        <div><strong>Phone:</strong> {item.details.phone}</div>
                                                    </div>
                                                )}
                                                {item.type === "supplier" && (
                                                    <div style={{ fontSize: "11px", color: "#334155", display: "grid", gap: "2px", marginBottom: "8px" }}>
                                                        <div><strong>Country:</strong> {item.details.country}</div>
                                                        <div><strong>Category:</strong> {item.details.category}</div>
                                                        <div><strong>Phone:</strong> {item.details.phone}</div>
                                                    </div>
                                                )}
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.locationStr || item.title)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: "inline-block",
                                                        width: "100%",
                                                        textAlign: "center",
                                                        padding: "6px 0",
                                                        background: "#2563eb",
                                                        color: "white",
                                                        borderRadius: "6px",
                                                        fontSize: "11px",
                                                        fontWeight: "700",
                                                        textDecoration: "none"
                                                    }}
                                                >
                                                    🗺️ Open Directions on Google Maps ↗
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
