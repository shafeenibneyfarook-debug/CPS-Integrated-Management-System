import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../../auth/authStore";
import { getClients } from "../../client/clientApi";
import { getSuppliers } from "../../supplier/supplierApi";
import { createQuotation, updateQuotation } from "../quotationApi";

const blankItem = () => ({ description: "", quantity: 1, unitPrice: 0, supplier: "" });
const blank = {
    title: "",
    client: "",
    tenderReference: "",
    constructionSiteLocation: "",
    approximateAreaSqFt: 1500,
    numberOfFloors: 3,
    projectType: "Residential Building",
    materialQuality: "Standard",
    labourCategory: "Standard",
    validUntil: "",
    currency: "BDT",
    taxRate: 0,
    notes: "",
    items: [blankItem()]
};
const messageFor = (error) => error.response?.data?.errors?.join(". ") || error.response?.data?.message || "Unable to save quotation.";

// Major Bangladesh Regional Hubs for Quick Selection
const BANGLADESH_REGIONS = [
    { city: "Dhaka", location: "Dhaka, Bangladesh", lat: 23.8103, lng: 90.4125 },
    { city: "Chittagong (Chattogram)", location: "Chittagong, Bangladesh", lat: 22.3569, lng: 91.7832 },
    { city: "Sylhet", location: "Sylhet, Bangladesh", lat: 24.8949, lng: 91.8687 },
    { city: "Khulna", location: "Khulna, Bangladesh", lat: 22.8456, lng: 89.5403 },
    { city: "Rajshahi", location: "Rajshahi, Bangladesh", lat: 24.3745, lng: 88.6042 },
    { city: "Barisal", location: "Barisal, Bangladesh", lat: 22.7010, lng: 90.3535 },
    { city: "Rangpur", location: "Rangpur, Bangladesh", lat: 25.7439, lng: 89.2752 },
    { city: "Mymensingh", location: "Mymensingh, Bangladesh", lat: 24.7471, lng: 90.4203 },
    { city: "Gazipur", location: "Gazipur, Bangladesh", lat: 23.9999, lng: 90.4203 },
    { city: "Narayanganj", location: "Narayanganj, Bangladesh", lat: 23.6238, lng: 90.5000 },
    { city: "Comilla (Cumilla)", location: "Comilla, Bangladesh", lat: 23.4682, lng: 91.1788 },
    { city: "Cox's Bazar", location: "Cox's Bazar, Bangladesh", lat: 21.4272, lng: 92.0058 }
];

function InteractiveLocationPicker({ value, onChange }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);

    const [selectedCoords, setSelectedCoords] = useState({ lat: 23.8103, lng: 90.4125 });

    // Extract lat/lng if present in the string value
    useEffect(() => {
        if (value) {
            const match = value.match(/Lat:\s*(-?\d+(\.\d+)?),\s*Lng:\s*(-?\d+(\.\d+)?)/i);
            if (match) {
                const lat = parseFloat(match[1]);
                const lng = parseFloat(match[3]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    setSelectedCoords({ lat, lng });
                }
            }
        }
    }, [value]);

    useEffect(() => {
        if (!mapRef.current) return;

        if (!mapInstance.current) {
            const map = L.map(mapRef.current, {
                center: [selectedCoords.lat, selectedCoords.lng],
                zoom: 11,
                scrollWheelZoom: true
            });

            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
                attribution: '&copy; OpenStreetMap &copy; CARTO'
            }).addTo(map);

            const customPinIcon = L.divIcon({
                className: "custom-map-picker-pin",
                html: `<div style="background: #2563eb; border: 2px solid white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 18px; color: white; cursor: pointer;">📍</div>`,
                iconSize: [34, 34],
                iconAnchor: [17, 17]
            });

            const marker = L.marker([selectedCoords.lat, selectedCoords.lng], {
                icon: customPinIcon,
                draggable: true
            }).addTo(map);

            const updateFromCoords = (lat, lng, nameHint = "") => {
                const latFormatted = parseFloat(lat.toFixed(4));
                const lngFormatted = parseFloat(lng.toFixed(4));
                setSelectedCoords({ lat: latFormatted, lng: lngFormatted });

                let baseText = value ? value.replace(/\s*\(Lat:.*?\)/i, "").trim() : "";
                if (!baseText || baseText === "Construction Site Location") {
                    baseText = nameHint || "Construction Site Location";
                }
                onChange(`${baseText} (Lat: ${latFormatted}, Lng: ${lngFormatted})`);
            };

            map.on("click", (e) => {
                const { lat, lng } = e.latlng;
                marker.setLatLng([lat, lng]);
                updateFromCoords(lat, lng);
            });

            marker.on("dragend", (e) => {
                const { lat, lng } = e.target.getLatLng();
                updateFromCoords(lat, lng);
            });

            mapInstance.current = map;
            markerRef.current = marker;
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    const handleSelectRegion = (region) => {
        const { lat, lng, location } = region;
        setSelectedCoords({ lat, lng });

        if (mapInstance.current && markerRef.current) {
            mapInstance.current.flyTo([lat, lng], 12);
            markerRef.current.setLatLng([lat, lng]);
        }

        let baseText = value ? value.replace(/\s*\(Lat:.*?\)/i, "").trim() : "";
        if (!baseText || BANGLADESH_REGIONS.some(r => baseText.includes(r.city))) {
            baseText = location;
        }
        onChange(`${baseText} (Lat: ${lat}, Lng: ${lng})`);
    };

    const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value || "Dhaka, Bangladesh")}`;

    return (
        <div className="full" style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "16px", margin: "12px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                <label style={{ margin: 0, fontWeight: "800", color: "#0f172a", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                    📍 Site Location Selector (Interactive Google Maps) *
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: "700" }}>
                        GPS Pin: {selectedCoords.lat}° N, {selectedCoords.lng}° E
                    </span>
                    <a
                        href={googleMapsSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#2563eb",
                            background: "#eff6ff",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid #bfdbfe",
                            textDecoration: "none"
                        }}
                    >
                        🗺️ View / Search on Google Maps ↗
                    </a>
                </div>
            </div>

            {/* Quick Regional Hub Selector */}
            <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                    Select Division / City Hub (or click on the map to pin your site location):
                </div>
                <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "6px" }}>
                    {BANGLADESH_REGIONS.map((r, idx) => {
                        const isSel = Math.abs(selectedCoords.lat - r.lat) < 0.05 && Math.abs(selectedCoords.lng - r.lng) < 0.05;
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectRegion(r)}
                                style={{
                                    padding: "5px 10px",
                                    borderRadius: "8px",
                                    border: isSel ? "2px solid #2563eb" : "1px solid #cbd5e1",
                                    background: isSel ? "#eff6ff" : "#ffffff",
                                    color: isSel ? "#1d4ed8" : "#475569",
                                    fontSize: "12px",
                                    fontWeight: isSel ? "800" : "600",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                🏙️ {r.city}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Interactive Leaflet Map Canvas */}
            <div style={{ height: "200px", width: "100%", borderRadius: "8px", border: "1px solid #93c5fd", overflow: "hidden", marginBottom: "12px", position: "relative" }}>
                <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
            </div>

            {/* Manual Location Text Input */}
            <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>
                    Construction Site Address / Location Details *
                </label>
                <input
                    name="constructionSiteLocation"
                    placeholder="Enter custom site address (e.g. Plot 15, Road 4, Sector 3, Uttara, Dhaka)"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "700", color: "#0f172a" }}
                />
                <small style={{ color: "#64748b", fontSize: "11px", display: "block", marginTop: "4px" }}>
                    💡 Tip: Click anywhere on the map to place a pin, select a city hub, or type your exact site address manually.
                </small>
            </div>
        </div>
    );
}

export default function QuotationForm({ selected, onSaved, onCancel }) {
    const { user } = useAuth();
    const isClientRole = user?.role === "client";

    const [form, setForm] = useState(() => selected ? {
        title: selected.title,
        client: selected.client?._id || selected.client,
        tenderReference: selected.tenderReference || "",
        constructionSiteLocation: selected.constructionSiteLocation || "",
        approximateAreaSqFt: selected.approximateAreaSqFt || 1500,
        numberOfFloors: selected.numberOfFloors || 3,
        projectType: selected.projectType || "Residential Building",
        materialQuality: selected.materialQuality || "Standard",
        labourCategory: selected.labourCategory || "Standard",
        validUntil: selected.validUntil?.slice(0, 10) || "",
        currency: selected.currency || "BDT",
        taxRate: selected.taxRate || 0,
        notes: selected.notes || "",
        items: selected.items.map(({ description, quantity, unitPrice, supplier }) => ({
            description,
            quantity,
            unitPrice,
            supplier: supplier?._id || supplier || ""
        }))
    } : blank);

    const [clients, setClients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loadingDirectories, setLoadingDirectories] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setLoadingDirectories(true);

        const fetches = [getSuppliers()];
        if (!isClientRole) fetches.push(getClients());

        Promise.allSettled(fetches)
            .then(([supRes, cliRes]) => {
                if (!active) return;
                if (supRes.status === "fulfilled") {
                    const supList = Array.isArray(supRes.value?.data) ? supRes.value.data : [];
                    setSuppliers(supList);
                }
                if (cliRes && cliRes.status === "fulfilled") {
                    const cliList = Array.isArray(cliRes.value?.data) ? cliRes.value.data : [];
                    setClients(cliList);
                }
            })
            .finally(() => {
                if (active) setLoadingDirectories(false);
            });

        return () => { active = false; };
    }, [isClientRole]);

    const change = ({ target: { name, value } }) => setForm((old) => ({ ...old, [name]: value }));
    const changeItem = (index, name, value) => setForm((old) => ({ ...old, items: old.items.map((item, i) => i === index ? { ...item, [name]: value } : item) }));
    const subtotal = form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
    const total = subtotal * (1 + (Number(form.taxRate) || 0) / 100);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            const preparedItems = isClientRole ? [
                {
                    description: `${form.title} — ${form.approximateAreaSqFt} SqFt (${form.numberOfFloors} Floors, ${form.projectType})`,
                    quantity: Number(form.approximateAreaSqFt) || 1,
                    unitPrice: 0
                }
            ] : form.items.map((item) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                ...(item.supplier ? { supplier: item.supplier } : {})
            }));

            const payload = {
                ...form,
                approximateAreaSqFt: Number(form.approximateAreaSqFt) || 1500,
                numberOfFloors: Number(form.numberOfFloors) || 1,
                taxRate: Number(form.taxRate),
                items: preparedItems
            };

            if (selected) await updateQuotation(selected._id, payload);
            else await createQuotation(payload);
            await onSaved(selected ? "Quotation updated." : isClientRole ? "Building proposal request submitted successfully!" : "Quotation draft created.");
        } catch (requestError) {
            setError(messageFor(requestError));
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="quote-card">
            <div className="quote-heading">
                <div>
                    <p className="quote-eyebrow">{isClientRole ? "Building & Construction Request" : "Quotation & Estimation Record"}</p>
                    <h2>{selected ? `Edit ${selected.quotationNumber}` : isClientRole ? "Submit Building Proposal Request" : "Create Quotation & Match Suppliers"}</h2>
                </div>
                {selected && <button type="button" className="quote-button ghost" onClick={onCancel}>Cancel</button>}
            </div>

            {error && <div className="quote-alert error">{error}</div>}

            <form className="quote-form" onSubmit={submit}>
                <label className="full">
                    Construction Project / Building Title *
                    <input name="title" placeholder="e.g. Residential 5-Story Apartment / Commercial Complex" value={form.title} onChange={change} required />
                </label>

                {/* Client Selection (Internal Users) vs Auto Client (Client Role) */}
                {isClientRole ? (
                    <label>
                        Requesting Client / Owner
                        <input value={`${user?.name} (${user?.email})`} disabled style={{ background: "#f1f5f9", cursor: "not-allowed" }} />
                    </label>
                ) : (
                    <label>
                        Client *
                        <select name="client" value={form.client} onChange={change} required>
                            <option value="">
                                {loadingDirectories ? "Loading clients..." : clients.length === 0 ? "No clients found — Add a client first" : "Select Client"}
                            </option>
                            {clients.map((client) => {
                                const name = client.companyName || client.company || client.contactPerson || client.name || client.email;
                                return (
                                    <option key={client._id} value={client._id}>
                                        {name} {client.phone ? `(${client.phone})` : ""}
                                    </option>
                                );
                            })}
                        </select>
                        {clients.length === 0 && !loadingDirectories && (
                            <small style={{ color: "#d97706", display: "block", marginTop: "4px" }}>
                                No clients in database. <Link to="/clients" style={{ color: "#2563eb", fontWeight: "700" }}>+ Add Client to Directory</Link>
                            </small>
                        )}
                    </label>
                )}

                {/* LAND & BUILDING SPECIFICATION PARAMETERS */}
                <div className="full" style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "16px", margin: "8px 0" }}>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                        📐 Land & Building Parameters for Cost Estimation *
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                        <label>
                            Building / Project Type *
                            <select name="projectType" value={form.projectType} onChange={change} required>
                                <option value="Residential Building">Residential Building</option>
                                <option value="Commercial Complex">Commercial Complex</option>
                                <option value="Industrial Warehouse">Industrial Warehouse</option>
                                <option value="Renovation & Extension">Renovation & Extension</option>
                            </select>
                        </label>

                        <label>
                            Approximate Land / Built-up Area (Sq Ft) *
                            <input type="number" min="100" name="approximateAreaSqFt" value={form.approximateAreaSqFt} onChange={change} required />
                        </label>

                        <label>
                            Number of Floors *
                            <input type="number" min="1" max="30" name="numberOfFloors" value={form.numberOfFloors} onChange={change} required />
                        </label>

                        <label>
                            Preferred Material Quality
                            <select name="materialQuality" value={form.materialQuality} onChange={change}>
                                <option value="Standard">Standard (BDS & BNBC Grade)</option>
                                <option value="Economy">Economy (Budget Focus)</option>
                                <option value="Premium">Premium (Imported / High-End)</option>
                            </select>
                        </label>

                        <label>
                            Preferred Labour Category
                            <select name="labourCategory" value={form.labourCategory} onChange={change}>
                                <option value="Standard">Standard Site Crew</option>
                                <option value="Skilled">Skilled Technical Crew</option>
                                <option value="Specialized">Specialized Structural Engineers</option>
                            </select>
                        </label>
                    </div>
                </div>

                {/* INTERACTIVE GOOGLE MAP & LOCATION PICKER */}
                <InteractiveLocationPicker
                    value={form.constructionSiteLocation}
                    onChange={(newVal) => setForm(prev => ({ ...prev, constructionSiteLocation: newVal }))}
                />

                <label>
                    Tender Reference (Optional)
                    <input name="tenderReference" placeholder="e.g. TND-2026-8801" value={form.tenderReference} onChange={change} />
                </label>

                <label>
                    Target Completion / Validity Date *
                    <input type="date" name="validUntil" value={form.validUntil} onChange={change} required />
                </label>

                <label>
                    Currency
                    <select name="currency" value={form.currency} onChange={change}>
                        <option value="BDT">BDT (৳)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                    </select>
                </label>

                {!isClientRole && (
                    <label>
                        Tax Rate (%)
                        <input type="number" min="0" max="100" step="0.01" name="taxRate" value={form.taxRate} onChange={change} />
                    </label>
                )}

                {/* Line Items with Available Supplier Matching (Manager / Admin Only) */}
                {!isClientRole && (
                    <div className="quote-items full">
                        <div className="quote-heading">
                            <h3>Construction Items & Supplier Matching</h3>
                            <button className="quote-button ghost" type="button" onClick={() => setForm((old) => ({ ...old, items: [...old.items, blankItem()] }))}>
                                + Add Line Item
                            </button>
                        </div>

                        {form.items.map((item, index) => (
                            <div className="quote-item-card" key={index} style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "10px",
                                padding: "14px",
                                marginBottom: "12px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px"
                            }}>
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "10px", alignItems: "center" }}>
                                    <input
                                        aria-label="Description"
                                        placeholder="Work Item / Material Description (e.g. 500 Tons Structural Steel)"
                                        value={item.description}
                                        onChange={(e) => changeItem(index, "description", e.target.value)}
                                        required
                                    />
                                    <input
                                        aria-label="Quantity"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Quantity"
                                        value={item.quantity}
                                        onChange={(e) => changeItem(index, "quantity", e.target.value)}
                                        required
                                    />
                                    <input
                                        aria-label="Unit price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Unit Price"
                                        value={item.unitPrice}
                                        onChange={(e) => changeItem(index, "unitPrice", e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="quote-button danger"
                                        disabled={form.items.length === 1}
                                        onClick={() => setForm((old) => ({ ...old, items: old.items.filter((_, i) => i !== index) }))}
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", minWidth: "130px" }}>
                                        🚢 Matched Supplier:
                                    </span>
                                    <select
                                        value={item.supplier}
                                        onChange={(e) => changeItem(index, "supplier", e.target.value)}
                                        style={{ flex: 1, fontSize: "12px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    >
                                        <option value="">Select Matched Supplier Option from Directory</option>
                                        {suppliers.map((s) => (
                                            <option key={s._id} value={s._id}>
                                                {s.supplierName} ({s.country || "Global"}) — {s.productCategory || "Materials"}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ textAlign: "right", fontSize: "12px", color: "#334155" }}>
                                    Item Subtotal: <strong>{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)} {form.currency}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <label className="full">
                    Notes & Special Soil / Land Specifications
                    <textarea name="notes" rows="3" placeholder="soil test notes, piling requirements, foundation details, blueprint preferences..." value={form.notes} onChange={change} />
                </label>

                {!isClientRole && (
                    <div className="quote-summary full">
                        <span>Subtotal: {subtotal.toFixed(2)} {form.currency}</span>
                        <strong>Best Estimated Total: {total.toFixed(2)} {form.currency}</strong>
                    </div>
                )}

                <div className="quote-actions full">
                    <button className="quote-button primary" disabled={saving || (!isClientRole && clients.length === 0)}>
                        {saving ? "Submitting..." : isClientRole ? "Submit Building Proposal Request to Manager" : "Save Quotation & Supplier Options"}
                    </button>
                </div>
            </form>
        </section>
    );
}
