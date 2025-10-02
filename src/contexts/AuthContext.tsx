import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'spotif.ve' | 'coach';

export interface AppUser {
  id: string;
  role: UserRole;
  handle?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  login: (role: UserRole, username: string, accessKey: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session Supabase d'abord
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Récupérer les infos complètes de l'utilisateur depuis app_user
        const { data: appUser } = await supabase
          .from('app_user')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (appUser) {
          setUser({
            id: appUser.id,
            role: appUser.role as UserRole,
            handle: appUser.handle || undefined,
            avatar_url: appUser.avatar_url || undefined,
          });
          localStorage.setItem('auth_user', JSON.stringify({
            id: appUser.id,
            role: appUser.role,
            handle: appUser.handle,
            avatar_url: appUser.avatar_url,
          }));
        }
      } else {
        // Sinon vérifier le local storage
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            localStorage.removeItem('auth_user');
          }
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (role: UserRole, username: string, accessKey: string) => {
    try {
      setIsLoading(true);
      
      // Appel à l'edge function d'authentification
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: { role, username, access_key: accessKey }
      });

      if (error) {
        return { error: "Erreur de connexion. Vérifiez vos identifiants." };
      }

      if (data?.error) {
        if (data.error === 'role_mismatch') {
          return { error: "Accès refusé : vos identifiants ne correspondent pas au rôle choisi." };
        }
        return { error: data.error };
      }

      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        // Se connecter via Supabase Auth avec les credentials
        if (data.auth) {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: data.auth.email,
            password: data.auth.password,
          });

          if (authError) {
            console.error('Auth error:', authError);
            return { error: "Erreur lors de l'authentification Supabase" };
          }
        }
        
        return {};
      }

      return { error: "Erreur inconnue lors de la connexion." };
    } catch (error) {
      return { error: "Erreur de connexion. Veuillez réessayer." };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};