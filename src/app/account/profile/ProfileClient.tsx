"use client";
import { useState } from "react";
import { updateProfileAction, deleteAddressAction, setDefaultAddressAction } from "@/actions/profile";
import { addAddressAction } from "@/actions/order";

type Profile = { full_name: string | null; gender: string | null; date_of_birth: string | null };
type Address = { address_id: number; label: string; address_line1: string; city: string; district: string | null; is_default: boolean };

export function ProfileForm({ profile, phone, name }: { profile: Profile; phone: string | null; name: string }) {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateProfileAction(fd);
    setMsg(result.error ?? (result.success ? "Profile updated!" : ""));
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {msg && <div style={{ padding: "10px 14px", borderRadius: 10, background: msg.includes("error") ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", color: msg.includes("error") ? "#f87171" : "#4ade80", fontSize: 14 }}>{msg}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input name="full_name" defaultValue={profile.full_name ?? name} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input name="phone" defaultValue={phone ?? ""} placeholder="01XXXXXXXXX" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Gender</label>
          <select name="gender" defaultValue={profile.gender ?? ""} style={inputStyle}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Date of Birth</label>
          <input name="date_of_birth" type="date" defaultValue={profile.date_of_birth ?? ""} style={inputStyle} />
        </div>
      </div>
      <button type="submit" disabled={loading} id="save-profile-btn" style={{ padding: "12px 24px", background: "linear-gradient(135deg, #eab308, #ca8a04)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", alignSelf: "flex-start" }}>
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = await addAddressAction(fd);
    if (result?.error) { setError(result.error); return; }
    setShowForm(false);
    window.location.reload();
  }

  return (
    <div>
      {addresses.map(addr => (
        <div key={addr.address_id} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: 16, borderRadius: 14, marginBottom: 10,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div>
            <div style={{ fontWeight: 600, color: "white", fontSize: 14, marginBottom: 2 }}>
              {addr.label.charAt(0).toUpperCase() + addr.label.slice(1)}
              {addr.is_default && <span style={{ marginLeft: 8, fontSize: 11, color: "#eab308", padding: "2px 8px", borderRadius: 6, background: "rgba(234,179,8,0.1)" }}>Default</span>}
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
              {addr.address_line1}, {addr.city}{addr.district ? `, ${addr.district}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!addr.is_default && (
              <button onClick={() => setDefaultAddressAction(addr.address_id).then(() => window.location.reload())} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#eab308", cursor: "pointer" }}>
                Set Default
              </button>
            )}
            <button onClick={() => deleteAddressAction(addr.address_id).then(() => window.location.reload())} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer" }}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {!showForm && (
        <button onClick={() => setShowForm(true)} style={{ fontSize: 13, color: "#eab308", background: "none", border: "1px dashed rgba(234,179,8,0.3)", borderRadius: 10, padding: "10px 20px", cursor: "pointer", width: "100%" }}>
          + Add New Address
        </button>
      )}

      {showForm && (
        <form onSubmit={handleAdd} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
          {error && <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <select name="label" style={inputStyle}>
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
            <input name="address_line2" placeholder="Apt/Floor" style={inputStyle} />
          </div>
          <input name="address_line1" required placeholder="Street Address *" style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input name="city" required placeholder="City *" style={inputStyle} />
            <input name="district" placeholder="District" style={inputStyle} />
          </div>
          <input name="postal_code" placeholder="Postal Code" style={inputStyle} />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" style={{ padding: "10px 20px", background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 10, color: "#eab308", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.4)", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "white", fontSize: 14, outline: "none" };
