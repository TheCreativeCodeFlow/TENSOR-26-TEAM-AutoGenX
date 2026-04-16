import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, profileApi } from "../services/api.js";

const AuthContext = createContext(null);
const REQUIRED_PROFILE_FIELDS = ["fullName", "age", "coastalArea", "locationLabel", "language", "boatType", "phone", "latitude", "longitude"];

const isProfileComplete = (profile) => {
  if (!profile) return false;
  return REQUIRED_PROFILE_FIELDS.every((field) => {
    const value = profile[field];
    return value !== undefined && value !== null && value !== "";
  });
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const data = await profileApi.getMine();
      setProfile(data.profile || data);
      return data.profile || data;
    } catch (error) {
      if (String(error.message || "").includes("not found")) {
        setProfile(null);
        return null;
      }
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const currentSession = await authApi.session();
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user || null);
        if (currentSession?.user) {
          await refreshProfile();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const subscription = authApi.supabase?.auth?.onAuthStateChange
      ? authApi.supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          setSession(nextSession);
          setUser(nextSession?.user || null);
          if (nextSession?.user) {
            try {
              await refreshProfile();
            } catch (_error) {
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
        })
      : null;

    return () => {
      mounted = false;
      subscription?.data?.subscription?.unsubscribe?.();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      isAuthenticated: Boolean(session?.access_token),
      hasProfile: isProfileComplete(profile),
      refreshProfile,
      requiredProfileFields: REQUIRED_PROFILE_FIELDS,
      signOut: async () => {
        await authApi.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
      },
    }),
    [loading, profile, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
