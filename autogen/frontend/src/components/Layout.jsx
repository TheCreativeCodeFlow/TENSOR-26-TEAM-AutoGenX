import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import EmergencyButton from "./EmergencyButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import OfflineSafetyGuard from "./OfflineSafetyGuard.jsx";

const navLabelByLanguage = {
  en: ["Safety", "Weather", "Alerts", "Map", "History"],
  ta: ["பாதுகாப்பு", "வானிலை", "எச்சரிக்கை", "வரைபடம்", "வரலாறு"],
  ml: ["സുരക്ഷ", "കാലാവസ്ഥ", "മുന്നറിയിപ്പ്", "മാപ്", "ചരിത്രം"],
  te: ["భద్రత", "వాతావరణం", "హెచ్చరికలు", "మ్యాప్", "చరిత్ర"],
  or: ["ସୁରକ୍ଷା", "ପାଣିପାଗ", "ସତର୍କତା", "ମାନଚିତ୍ର", "ଇତିହାସ"],
};

const chromeByLanguage = {
  en: { currentZone: "Current zone", locationPending: "Location pending", profile: "Profile", logout: "Logout", fisherfolkSafety: "Fisherfolk safety" },
  ta: { currentZone: "தற்போதைய பகுதி", locationPending: "இடம் நிலுவையில்", profile: "சுயவிவரம்", logout: "வெளியேறு", fisherfolkSafety: "மீனவர் பாதுகாப்பு" },
  ml: { currentZone: "നിലവിലെ മേഖല", locationPending: "സ്ഥലം ബാക്കി", profile: "പ്രൊഫൈൽ", logout: "ലോഗൗട്ട്", fisherfolkSafety: "മത്സ്യത്തൊഴിലാളി സുരക്ഷ" },
  te: { currentZone: "ప్రస్తుత జోన్", locationPending: "స్థానం ఇంకా లేదు", profile: "ప్రొఫైల్", logout: "లాగౌట్", fisherfolkSafety: "మత్స్యకార భద్రత" },
  or: { currentZone: "ବର୍ତ୍ତମାନ ଅଞ୍ଚଳ", locationPending: "ଅବସ୍ଥାନ ଅପେକ୍ଷାରତ", profile: "ପ୍ରୋଫାଇଲ", logout: "ଲଗଆଉଟ", fisherfolkSafety: "ମତ୍ସ୍ୟଜୀବୀ ସୁରକ୍ଷା" },
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  const advisoryFetchedAt = useMemo(() => {
    try {
      const zoneId = profile?.primaryZoneId;
      if (!zoneId) return "";
      const cache = JSON.parse(localStorage.getItem("offline_advisory_cache_v1") || "{}");
      return cache?.[zoneId]?.fetchedAt || "";
    } catch (_error) {
      return "";
    }
  }, [profile?.primaryZoneId]);

  const links = useMemo(() => {
    const language = profile?.language || "en";
    const labels = navLabelByLanguage[language] || navLabelByLanguage.en;
    return [
      { to: "/app", label: labels[0], icon: "security" },
      { to: "/app/advisory", label: labels[1], icon: "storm" },
      { to: "/app/danger", label: labels[2], icon: "warning" },
      { to: "/app/map", label: labels[3], icon: "map" },
      { to: "/app/history", label: labels[4], icon: "history" },
    ];
  }, [profile?.language]);

  const chromeText = useMemo(() => {
    const language = profile?.language || "en";
    return chromeByLanguage[language] || chromeByLanguage.en;
  }, [profile?.language]);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const logout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl md:left-64">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <button type="button" className="flex items-center gap-3 text-left" onClick={() => navigate("/app/profile")}>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white shadow-lg">
              <span className="material-symbols-outlined">sailing</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-outline">{chromeText.fisherfolkSafety}</p>
              <h1 className="text-base font-black uppercase leading-none text-primary">
                {profile?.fullName || user?.phone || "Fisherfolk"}
              </h1>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNavOpen((value) => !value)}
              className="rounded-full bg-surface-container-highest px-3 py-2 text-sm font-black md:hidden"
            >
              Menu
            </button>
            <button
              type="button"
              onClick={() => navigate("/app/profile")}
              className="hidden rounded-full bg-surface-container-highest px-4 py-2 text-sm font-black md:inline-flex"
            >
              {chromeText.profile}
            </button>
            <button
              type="button"
              onClick={logout}
              className="hidden rounded-full bg-surface-container-highest px-4 py-2 text-sm font-black md:inline-flex"
            >
              {chromeText.logout}
            </button>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 border-r border-white/60 bg-white/70 px-4 py-6 backdrop-blur-xl md:flex md:flex-col">
        <div className="mt-16 rounded-[28px] bg-[linear-gradient(135deg,#00450d,#1b5e20)] p-4 text-white shadow-[0_24px_70px_rgba(0,69,13,0.25)]">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/70">{chromeText.currentZone}</p>
          <h2 className="mt-2 text-2xl font-black uppercase leading-none">{profile?.coastalArea || "Coastal area"}</h2>
          <p className="mt-2 text-sm text-white/80">{profile?.locationLabel || chromeText.locationPending}</p>
        </div>

        <nav className="mt-6 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 font-bold transition-all duration-300 ${
                  isActive ? "bg-primary text-white shadow-lg" : "bg-white/70 text-slate-700 hover:-translate-y-0.5 hover:bg-white"
                }`
              }
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <EmergencyButton compact className="w-full" />
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-2xl bg-surface-container-highest px-4 py-3 font-black text-outline transition hover:-translate-y-0.5"
          >
            {chromeText.logout}
          </button>
        </div>
      </aside>

      <main className="fade-in pb-28 pt-20 md:ml-64 md:pb-0">
        <OfflineSafetyGuard advisoryFetchedAt={advisoryFetchedAt} />
        <Outlet />
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/60 bg-white/90 px-3 py-2 backdrop-blur-xl md:hidden">
        {navOpen ? (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black uppercase tracking-[0.2em] ${
                    isActive ? "bg-primary text-white" : "bg-surface-container-low text-outline"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-2">
          {links.slice(0, 4).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-black uppercase tracking-wide ${
                  isActive ? "bg-primary text-white" : "text-slate-500"
                }`
              }
            >
              <span className="material-symbols-outlined text-[22px]">{link.icon}</span>
              <span className="mt-1">{link.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <EmergencyButton compact />
      </div>
    </div>
  );
}
