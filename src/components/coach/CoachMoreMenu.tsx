import { Dumbbell, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface CoachMoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CoachMoreMenu = ({ open, onOpenChange }: CoachMoreMenuProps) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: Dumbbell,
      label: 'Banque d\'exercices',
      to: '/coach/exercises',
      description: 'Gérer ma bibliothèque d\'exercices'
    },
    {
      icon: Activity,
      label: 'Mes routines',
      to: '/coach/routines',
      description: 'Créer et gérer mes routines'
    },
  ];

  const handleNavigate = (to: string) => {
    navigate(to);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle>Plus d'options</SheetTitle>
        </SheetHeader>
        <div className="grid gap-2 py-4">
          {menuItems.map((item) => (
            <button
              key={item.to}
              onClick={() => handleNavigate(item.to)}
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-muted-foreground">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
