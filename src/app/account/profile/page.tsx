import { Metadata } from "next";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm, AddressManager } from "./ProfileClient";

export const metadata: Metadata = { title: "My Profile — NodeCommerce" };

export default async function ProfilePage() {
  const session = await requireCustomer();

  const [customer, profile, addresses] = await Promise.all([
    prisma.customer.findUnique({ where: { customer_id: session.id }, select: { name: true, email: true, phone: true } }),
    prisma.profile.findUnique({ where: { customer_id: session.id } }),
    prisma.address.findMany({ where: { customer_id: session.id }, orderBy: [{ is_default: "desc" }, { created_at: "asc" }] }),
  ]);

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 28 }}>My Profile</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Profile Info */}
        <div style={{ background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 8 }}>
            Personal Information
          </h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 24 }}>Email: {customer?.email}</p>
          <ProfileForm
            profile={{ full_name: profile?.full_name ?? null, gender: profile?.gender ?? null, date_of_birth: profile?.date_of_birth?.toISOString().split("T")[0] ?? null }}
            phone={customer?.phone ?? null}
            name={customer?.name ?? ""}
          />
        </div>

        {/* Addresses */}
        <div style={{ background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 20 }}>
            Saved Addresses
          </h2>
          <AddressManager addresses={addresses.map(a => ({
            address_id: a.address_id, label: a.label, address_line1: a.address_line1,
            city: a.city, district: a.district, is_default: a.is_default,
          }))} />
        </div>
      </div>
    </div>
  );
}
