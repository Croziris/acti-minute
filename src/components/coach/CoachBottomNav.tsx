import { Home, Users, Dumbbell, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const CoachBottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { to: '/coach/dashboard', icon: Home, label: 'Dashboard', exactMatch: true },
    { to: '/coach/clients', icon: Users, label: 'Clients', exactMatch: false },
    { to: '/coach/workouts', icon: Dumbbell, label: 'Séances', exactMatch: false },
    { to: '/coach/exercises', icon: BookOpen, label: 'Exercices', exactMatch: false },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = item.exactMatch 
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};