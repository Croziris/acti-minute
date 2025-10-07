import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, Calendar, BookOpen, LogOut, Dumbbell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header mobile */}
      <header className="bg-nav text-nav-foreground p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/Logo ActiMinute.png" alt="Acti'Minute" className="h-8 w-8" />
          <div>
            <h1 className="font-semibold">Acti'Minute</h1>
            <p className="text-sm opacity-75">Bonjour {user?.handle || 'Sportif.ve'}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-nav-foreground hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Contenu principal */}
      <main className="pb-20 px-4 pt-6">
        {children}
      </main>

      {/* Navigation bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg">
        <div className="flex items-center justify-around py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/client/home')}
            className={`flex flex-col items-center space-y-1 px-4 py-3 ${
              isActive('/client/home') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Accueil</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/client/habits')}
            className={`flex flex-col items-center space-y-1 px-4 py-3 ${
              isActive('/client/habits') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs">Habitudes</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/client/articles')}
            className={`flex flex-col items-center space-y-1 px-4 py-3 ${
              isActive('/client/articles') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs">Articles</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};