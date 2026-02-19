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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  // Use ref to persist recovery detection across closures
  const recoveryDetectedOnceRef = useRef(false);

  const detectRecovery = () => {
    // Check hash for explicit type=recovery (Supabase v2 recommended approach)
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      if (params.get("type") === "recovery") return true;
    }

    // Check search params for explicit type=recovery
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("type") === "recovery") return true;

    // On /set-password page, also accept code/token_hash as recovery indicators.
    // These params are ambiguous elsewhere (e.g. /signup uses them for invites),
    // so we only trust them when we're already on the password-reset page.
    if (window.location.pathname === '/set-password') {
      const hasCode = !!searchParams.get("code") ||
        (window.location.hash ? !!new URLSearchParams(window.location.hash.substring(1)).get("code") : false);
      const hasTokenHash = !!searchParams.get("token_hash") ||
        (window.location.hash ? !!new URLSearchParams(window.location.hash.substring(1)).get("token_hash") : false);
      if (hasCode || hasTokenHash) return true;
    }

    return false;
  };

  useEffect(() => {
    const initialRecoveryState = detectRecovery();
    
    // If we detect recovery initially, mark it as detected once (persist it)
    if (initialRecoveryState) {
      recoveryDetectedOnceRef.current = true;
      setIsPasswordRecovery(true);
      
      // If we're not already on the set-password page, redirect there immediately
      if (window.location.pathname !== '/set-password') {
        // Use window.location.href for immediate redirect (happens before React router)
        window.location.href = '/set-password' + window.location.hash + window.location.search;
      }
    }

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {
        
        // Check for PASSWORD_RECOVERY event specifically
        const isRecoveryEvent = event === "PASSWORD_RECOVERY";
        const recoveryFromUrl = detectRecovery();
        
        // If we detect recovery now, mark it as detected (persist it)
        if (isRecoveryEvent || recoveryFromUrl) {
          recoveryDetectedOnceRef.current = true;
        }
        
        // If we've detected recovery once, or if we detect it now, keep it true
        // Also check if we're on set-password page with a session
        let shouldBeInRecovery = recoveryDetectedOnceRef.current || isRecoveryEvent || recoveryFromUrl;
        
        // If we're on set-password page with a session and we've detected recovery, keep it true
        if (window.location.pathname === '/set-password' && session && recoveryDetectedOnceRef.current) {
          shouldBeInRecovery = true;
        }
        
        // If we detect recovery but we're not on set-password page, navigate there
        // This handles the case where Supabase redirects to root with hash
        // IMPORTANT: also exclude /signup — invite links carry similar URL params
        if (shouldBeInRecovery && window.location.pathname !== '/set-password' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          // Use setTimeout to avoid navigation during render
          setTimeout(() => {
            window.location.href = '/set-password';
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
      
      // If we detect recovery now, mark it as detected (persist it)
      if (recoveryDetected) {
        recoveryDetectedOnceRef.current = true;
      }
      
      const shouldBeInRecovery = recoveryDetectedOnceRef.current || recoveryDetected;
      
      setIsPasswordRecovery(shouldBeInRecovery);
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

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [session, setSession] = useState<Session | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

//   // Helper function to check if we're in a password recovery flow
//   const checkIsPasswordRecovery = (): boolean => {
//     // Check URL hash for recovery (Supabase v2 recommended approach)
//     if (window.location.hash.includes('type=recovery')) {
//       return true;
//     }
    
//     // Also check if we're on the reset-password page with recovery indicators
//     if (window.location.pathname === '/reset-password') {
//       // Check URL hash first (Supabase often uses hash fragments)
//       if (window.location.hash) {
//         const hashParams = new URLSearchParams(window.location.hash.substring(1));
//         const hashType = hashParams.get('type');
//         if (hashType === 'recovery') {
//           return true;
//         }
//       }
      
//       // Check URL search params for recovery indicators
//       const urlParams = new URLSearchParams(window.location.search);
//       const type = urlParams.get('type');
//       const code = urlParams.get('code');
//       const tokenHash = urlParams.get('token_hash');
//       const accessToken = urlParams.get('access_token');
//       const refreshToken = urlParams.get('refresh_token');
      
//       return type === 'recovery' || !!code || !!tokenHash || (!!accessToken && !!refreshToken);
//     }
//     return false;
//   };

//   useEffect(() => {
//     // Set up auth state listener FIRST
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       (event, session) => {
//         // Check if this is a password recovery event or if URL indicates recovery
//         const isRecovery = event === 'PASSWORD_RECOVERY' || checkIsPasswordRecovery();
//         setIsPasswordRecovery(isRecovery);
        
//         setSession(session);
//         setUser(session?.user ?? null);
//         setLoading(false);
        
//         // Handle SIGNED_OUT event explicitly
//         if (event === 'SIGNED_OUT') {
//           // Clear state immediately
//           setSession(null);
//           setUser(null);
//           setIsPasswordRecovery(false);
//         }
//       }
//     );

//     // THEN check for existing session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       // Check if we're in a recovery flow
//       setIsPasswordRecovery(checkIsPasswordRecovery());
      
//       setSession(session);
//       setUser(session?.user ?? null);
//       setLoading(false);
//     });

//     // Also check on pathname changes (in case user navigates to reset-password)
//     const handleLocationChange = () => {
//       setIsPasswordRecovery(checkIsPasswordRecovery());
//     };
    
//     window.addEventListener('popstate', handleLocationChange);
//     // Check periodically in case URL changes without popstate
//     const interval = setInterval(handleLocationChange, 100);

//     return () => {
//       subscription.unsubscribe();
//       window.removeEventListener('popstate', handleLocationChange);
//       clearInterval(interval);
//     };
//   }, []);

//   const signOut = async () => {
//     try {
//       // Clear local state first
//       setSession(null);
//       setUser(null);
      
//       // Sign out from Supabase (this should clear localStorage)
//       // Use scope: 'global' to sign out from all devices
//       const { error } = await supabase.auth.signOut({ scope: 'global' });
      
//       if (error) {
//         console.error('Error signing out:', error);
//       }
      
//       // Manually clear Supabase auth data from localStorage to ensure it's gone
//       // Supabase stores session data with keys like 'sb-<project-ref>-auth-token'
//       const supabaseKeys = Object.keys(localStorage).filter(key => 
//         key.startsWith('sb-') && key.includes('auth-token')
//       );
//       supabaseKeys.forEach(key => localStorage.removeItem(key));
      
//       // Also clear any other potential auth-related keys
//       localStorage.removeItem('supabase.auth.token');
      
//       // Small delay to ensure localStorage is cleared before redirect
//       await new Promise(resolve => setTimeout(resolve, 100));
      
//       // Redirect to home page with full page reload to clear all state
//       window.location.href = '/';
//     } catch (err) {
//       console.error('Error during sign out:', err);
//       // Clear state and localStorage even on error
//       setSession(null);
//       setUser(null);
      
//       // Clear Supabase auth data from localStorage
//       const supabaseKeys = Object.keys(localStorage).filter(key => 
//         key.startsWith('sb-') && key.includes('auth-token')
//       );
//       supabaseKeys.forEach(key => localStorage.removeItem(key));
//       localStorage.removeItem('supabase.auth.token');
      
//       window.location.href = '/';
//     }
//   };

//   const value = {
//     user,
//     session,
//     loading,
//     isPasswordRecovery,
//     signOut,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };