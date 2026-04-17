import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, profileApi } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAuthState = async () => {
    const currentSession = await authApi.session();
    setSession(currentSession);
    setUser(currentSession?.user || null);

    if (currentSession?.access_token) {
      try {
        const me = await authApi.me();
        const backendUser = me?.user || null;
        if (backendUser) {
          setUser((prev) => ({ ...(prev || {}), ...backendUser }));
        }
      } catch (_error) {
        // Leave session in place even if /auth/me is temporarily unavailable.
      }

      try {
        await refreshProfile();
      } catch (_error) {
        setProfile(null);
      }
    } else {
      setProfile(null);
    }

    return currentSession;
  };

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
        if (!mounted) return;
        await refreshAuthState();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      isAuthenticated: Boolean(session?.access_token),
      hasProfile: Boolean(profile?.fullName),
      refreshProfile,
      refreshAuthState,
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
