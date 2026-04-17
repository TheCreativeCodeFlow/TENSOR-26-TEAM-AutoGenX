import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { speak } from "../utils/voice.js";

export default function ProfileView() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const speakProfile = () => {
    const text = [
      profile?.fullName,
      profile?.age ? `${profile.age} years old` : "",
      profile?.coastalArea,
      profile?.locationLabel,
      profile?.boatType,
      profile?.language,
    ]
      .filter(Boolean)
      .join(". ");
    speak(text || "Profile not set yet.", "en-IN");
  };

  return (
    <div className="px-4 py-4 md:px-6">
      <div className="rounded-[32px] bg-white p-6 shadow-lg md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-outline">Profile</p>
            <h1 className="mt-2 text-3xl font-black uppercase text-on-surface">{profile?.fullName || "Fisherfolk user"}</h1>
            <p className="mt-1 text-sm font-medium text-on-surface-variant">{user?.phone}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={speakProfile}
              className="rounded-full bg-primary px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white"
            >
              Read profile
            </button>
            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="rounded-full bg-surface-container-highest px-4 py-3 text-sm font-black uppercase tracking-[0.2em]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full bg-tertiary px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ["Age", profile?.age],
            ["Language", profile?.language],
            ["Coastal area", profile?.coastalArea],
            ["Boat type", profile?.boatType],
            ["Location", profile?.locationLabel],
            ["Safety phone", profile?.phone || user?.phone],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] bg-surface-container-low p-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-outline">{label}</p>
              <p className="mt-2 text-lg font-bold text-on-surface">{value || "-"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
