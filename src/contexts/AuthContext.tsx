import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

const RECOVERY_EXCLUDED_PATHS = ['/reset-password', '/login', '/finish-signup'];

function detectRecovery(): boolean {
  // Check hash for explicit type=recovery
  if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    if (params.get("type") === "recovery") return true;
  }

  // Check search params for explicit type=recovery
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get("type") === "recovery") return true;

  // On /reset-password page, also accept code/token_hash as recovery indicators.
  // These params are ambiguous elsewhere (e.g. /finish-signup uses them for invites),
  // so we only trust them on the password-reset page.
  if (window.location.pathname === '/reset-password') {
    const hasCode = !!searchParams.get("code") ||
      (window.location.hash ? !!new URLSearchParams(window.location.hash.substring(1)).get("code") : false);
    const hasTokenHash = !!searchParams.get("token_hash") ||
      (window.location.hash ? !!new URLSearchParams(window.location.hash.substring(1)).get("token_hash") : false);
    if (hasCode || hasTokenHash) return true;
  }

  return false;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const recoveryDetectedOnceRef = useRef(false);

  useEffect(() => {
    const initialRecoveryState = detectRecovery();

    if (initialRecoveryState) {
      recoveryDetectedOnceRef.current = true;
      setIsPasswordRecovery(true);

      if (window.location.pathname !== '/reset-password') {
        window.location.href = '/reset-password' + window.location.hash + window.location.search;
      }
    }

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {
        const isRecoveryEvent = event === "PASSWORD_RECOVERY";
        const recoveryFromUrl = detectRecovery();

        if (isRecoveryEvent || recoveryFromUrl) {
          recoveryDetectedOnceRef.current = true;
        }

        let shouldBeInRecovery = recoveryDetectedOnceRef.current || isRecoveryEvent || recoveryFromUrl;

        if (window.location.pathname === '/reset-password' && session && recoveryDetectedOnceRef.current) {
          shouldBeInRecovery = true;
        }

        // Redirect to /reset-password if in recovery but on an unrelated page
        if (shouldBeInRecovery && !RECOVERY_EXCLUDED_PATHS.includes(window.location.pathname)) {
          setTimeout(() => {
            window.location.href = '/reset-password';
          }, 0);
        }

        setIsPasswordRecovery(shouldBeInRecovery);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setIsPasswordRecovery(false);
          recoveryDetectedOnceRef.current = false;
        }
      });

    supabase.auth.getSession().then(({ data }) => {
      const recoveryDetected = detectRecovery();

      if (recoveryDetected) {
        recoveryDetectedOnceRef.current = true;
      }

      setIsPasswordRecovery(recoveryDetectedOnceRef.current || recoveryDetected);
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsPasswordRecovery(false);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isPasswordRecovery, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
