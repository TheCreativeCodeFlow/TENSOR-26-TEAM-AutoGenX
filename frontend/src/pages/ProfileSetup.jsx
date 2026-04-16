import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { profileApi, zonesApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ta", label: "Tamil" },
  { value: "ml", label: "Malayalam" },
  { value: "te", label: "Telugu" },
  { value: "or", label: "Odia" },
];

const BOAT_TYPES = ["Traditional Boat", "Mechanized Boat", "Trawler", "Gillnetter", "Catamaran"];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [zones, setZones] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    coastalArea: "",
    primaryZoneId: "",
    locationLabel: "",
    latitude: "",
    longitude: "",
    language: "ta",
    boatType: BOAT_TYPES[0],
    phone: "",
  });

  useEffect(() => {
    const loadZones = async () => {
      try {
        const data = await zonesApi.getAll();
        setZones(Array.isArray(data) ? data : data.zones || []);
      } catch (_error) {
        setZones([]);
      }
    };
    loadZones();
  }, []);

  useEffect(() => {
    if (!user) return;
    setFormData((current) => ({
      ...current,
      phone: profile?.phone || user?.phone || current.phone,
      language: profile?.language || current.language,
      fullName: profile?.fullName || current.fullName,
      age: profile?.age || current.age,
      coastalArea: profile?.coastalArea || current.coastalArea,
      primaryZoneId: profile?.primaryZoneId || current.primaryZoneId,
      locationLabel: profile?.locationLabel || current.locationLabel,
      latitude: profile?.latitude || current.latitude,
      longitude: profile?.longitude || current.longitude,
      boatType: profile?.boatType || current.boatType,
    }));
  }, [profile, user]);

  const update = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }

    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = Number(position.coords.latitude.toFixed(6));
          const lng = Number(position.coords.longitude.toFixed(6));
          const located = await zonesApi.locate(lat, lng);
          const zone = located.zone || located;
          setFormData((current) => ({
            ...current,
            latitude: lat,
            longitude: lng,
            primaryZoneId: zone.id,
            coastalArea: zone.name,
            locationLabel: `${lat}, ${lng}`,
          }));
          setSuccess("Location detected and matched to the nearest coastal zone.");
          setError("");
        } catch (err) {
          setError(err.message || "Could not match location");
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        setError("Location permission was denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const latitude = Number(formData.latitude);
      const longitude = Number(formData.longitude);
      const phone = String(formData.phone || "").trim();
      if (!phone) {
        throw new Error("Safety phone is required. Sign in with phone OTP or add a valid phone number.");
      }
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Please detect or enter valid latitude and longitude values.");
      }

      await profileApi.saveMine({
        ...formData,
        age: Number(formData.age),
        latitude,
        longitude,
        phone,
        safetyPhone: user?.phone || phone,
      });
      await refreshProfile();
      setSuccess("Your fisherfolk profile is saved.");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(0,69,13,0.14),_transparent_34%),linear-gradient(180deg,#f8fbf7,#eef7ef)] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="fade-in mb-6 rounded-[28px] bg-gradient-to-r from-primary to-[#0e7430] p-6 text-white shadow-[0_24px_70px_rgba(0,69,13,0.28)]">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-white/70">Onboarding</p>
          <h1 className="mt-2 text-3xl font-black uppercase leading-none md:text-5xl">Complete your fishing profile</h1>
          <p className="mt-3 max-w-2xl text-sm font-medium text-white/85 md:text-base">
            We need your age, coastal area, location, language, and boat type so the backend can compute safer go/no-go advisories.
          </p>
        </div>

        <form onSubmit={submit} className="slide-up space-y-5 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.12)] backdrop-blur-xl md:p-8">
          {error ? <div className="rounded-2xl border border-tertiary/20 bg-tertiary/10 px-4 py-3 text-sm font-bold text-tertiary">{error}</div> : null}
          {success ? <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary">{success}</div> : null}

          <section className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-outline">Fisherman name</span>
              <input
                value={formData.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className="w-full rounded-2xl border border-surface-container-highest bg-white px-4 py-4 text-lg font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-outline">Age</span>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => update("age", e.target.value)}
                className="w-full rounded-2xl border border-surface-container-highest bg-white px-4 py-4 text-lg font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                min="18"
                max="99"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-outline">Language</span>
              <select
                value={formData.language}
                onChange={(e) => update("language", e.target.value)}
                className="w-full rounded-2xl border border-surface-container-highest bg-white px-4 py-4 text-lg font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-outline">Coastal area</span>
              <select
                value={formData.primaryZoneId}
                onChange={(e) => {
                  const zone = zones.find((item) => item.id === e.target.value);
                  update("primaryZoneId", e.target.value);
                  update("coastalArea", zone?.name || "");
                }}
                className="w-full rounded-2xl border border-surface-container-highest bg-white px-4 py-4 text-lg font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                required
              >
                <option value="">Select zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-outline">Boat type</span>
              <select
                value={formData.boatType}
                onChange={(e) => update("boatType", e.target.value)}
                className="w-full rounded-2xl border border-surface-container-highest bg-white px-4 py-4 text-lg font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                {BOAT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-outline">Safety phone</span>
              <input
                value={formData.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full rounded-2xl border border-surface-container-highest bg-white px-4 py-4 text-lg font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="+91 9XXXXXXXXX"
                required
                readOnly={Boolean(user?.phone)}
              />
              {user?.phone ? <p className="mt-2 text-xs font-medium text-outline">Verified through Supabase phone OTP login.</p> : null}
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-outline">Location</span>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  value={formData.locationLabel}
                  onChange={(e) => update("locationLabel", e.target.value)}
                  placeholder="Village / GPS / harbor"
                  className="w-full rounded-2xl border border-surface-container-highest bg-white px-4 py-4 text-lg font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  required
                />
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={busy}
                  className="rounded-2xl bg-surface-container-highest px-5 py-4 text-sm font-black uppercase tracking-[0.2em] transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  Detect
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-outline">Latitude</span>
              <input
                value={formData.latitude}
                onChange={(e) => update("latitude", e.target.value)}
                placeholder="9.2855"
                className="w-full rounded-2xl border border-surface-container-highest bg-white px-4 py-4 text-lg font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-outline">Longitude</span>
              <input
                value={formData.longitude}
                onChange={(e) => update("longitude", e.target.value)}
                placeholder="79.3128"
                className="w-full rounded-2xl border border-surface-container-highest bg-white px-4 py-4 text-lg font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </label>
          </section>

          <button
            type="submit"
            disabled={busy}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-black uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_rgba(0,69,13,0.25)] transition duration-300 hover:-translate-y-0.5 disabled:opacity-60"
          >
            <span className="material-symbols-outlined transition group-hover:translate-x-1">save</span>
            {busy ? "Saving..." : "Save and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
