import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session, Provider } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  birth_date?: string;
  marital_status?: string;
  privacy_level: string;
  is_verified: boolean;
  reputation: number;
  is_volunteer_ready: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  handleOAuthLogin: (provider: Provider) => Promise<{ error: Error | null }>;
  toggleVolunteerStatus: () => Promise<void>;
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ error: string | Error | null }>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only log safe information for debugging, no personal data
      if (process.env.NODE_ENV === "development") {
        console.log("Auth state change:", event, {
          authenticated: !!session,
          has_user: !!session?.user,
        });
      }
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch user profile after authentication
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        if (process.env.NODE_ENV === "development") {
          console.error(
            "Error fetching profile:",
            error.message || "Unknown error"
          );
        }
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "Error fetching profile:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const register = async (name: string, email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name,
        },
      },
    });

    return { error };
  };

  const logout = async () => {
    try {
      // Clear local state first
      setUser(null);
      setProfile(null);
      setSession(null);

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error(
            "Error logging out:",
            error.message || "Sign out failed"
          );
        }
        // Even if signOut fails, we still cleared local state
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "Error during logout:",
          error instanceof Error ? error.message : "Logout failed"
        );
      }
      // Clear local state even if there's an error
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  };

  const handleOAuthLogin = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/map`,
      },
    });
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          `OAuth error with ${provider}:`,
          error.message || "OAuth failed"
        );
      }
    }
    return { error };
  };

  const toggleVolunteerStatus = async () => {
    if (!user || !profile) return;

    const newStatus = !profile.is_volunteer_ready;

    const { error } = await supabase
      .from("profiles")
      .update({ is_volunteer_ready: newStatus })
      .eq("id", user.id);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "Error updating volunteer status:",
          error.message || "Update failed"
        );
      }
      return;
    }

    setProfile((prev) =>
      prev ? { ...prev, is_volunteer_ready: newStatus } : null
    );
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        login,
        register,
        logout,
        handleOAuthLogin,
        toggleVolunteerStatus,
        updateProfile,
        isAuthenticated: !!session,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
