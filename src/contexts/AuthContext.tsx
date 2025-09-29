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
    // Vérifier s'il y a un utilisateur connecté en local storage
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
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
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};