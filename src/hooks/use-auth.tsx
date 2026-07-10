import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "member";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: Role | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null, role: null, loading: true, isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => fetchRole(s.user.id), 0);
      } else {
        setRole(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) fetchRole(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (data?.some((r) => r.role === "admin")) setRole("admin");
    else if (data?.length) setRole("member");
    else setRole(null);
  };

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        role,
        loading,
        isAdmin: role === "admin",
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
