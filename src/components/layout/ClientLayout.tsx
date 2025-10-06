import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, Calendar, BookOpen, LogOut, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header compact */}
      <header className="sticky top-0 z-40 w-full border-b bg-deep-navy text-white shadow-md">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/logo-actiminute.png" alt="Acti'Minute" className="h-6 w-6" />
            <span className="font-semibold text-base">Acti'Minute</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm opacity-90 hidden sm:inline">
              {user?.handle || 'Sportif.ve'}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-white hover:bg-white/10 h-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Frosted Glass Bottom Navigation Bar - Mobile Only */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-[480px]">
        <div 
          className="rounded-xl border shadow-float backdrop-blur-glass backdrop-saturate-glass bg-white/70 dark:bg-gray-900/60"
          style={{
            borderColor: 'rgba(217, 227, 232, 0.6)',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex justify-around items-center h-16 px-2">
            <Link
              to="/client/home"
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 min-w-[44px] min-h-[44px] rounded-lg transition-all duration-150 ease-out active:scale-95",
                isActive("/client/home") ? "text-royal-blue" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Home className="h-7 w-7" strokeWidth={2} />
                {isActive("/client/home") && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-royal-blue" />
                )}
              </div>
              <span className="text-xs font-semibold">Accueil</span>
            </Link>
            
            <Link
              to="/client/habits"
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 min-w-[44px] min-h-[44px] rounded-lg transition-all duration-150 ease-out active:scale-95",
                isActive("/client/habits") ? "text-royal-blue" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
                {isActive("/client/habits") && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-royal-blue" />
                )}
              </div>
              <span className="text-xs font-semibold">Habitudes</span>
            </Link>
            
            <Link
              to="/client/articles"
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 min-w-[44px] min-h-[44px] rounded-lg transition-all duration-150 ease-out active:scale-95",
                isActive("/client/articles") ? "text-royal-blue" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <BookOpen className="h-7 w-7" strokeWidth={2} />
                {isActive("/client/articles") && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-royal-blue" />
                )}
              </div>
              <span className="text-xs font-semibold">Articles</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};