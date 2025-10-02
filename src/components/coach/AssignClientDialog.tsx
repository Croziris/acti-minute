import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';

interface Client {
  id: string;
  handle: string;
  avatar_url?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AssignClientDialog: React.FC<Props> = ({ open, onOpenChange, onSuccess }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchAvailableClients();
    }
  }, [open]);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredClients(clients);
    } else {
      setFilteredClients(
        clients.filter((c) =>
          c.handle.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, clients]);

  const fetchAvailableClients = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les sportif.ve
      const { data: allClients, error: clientsError } = await supabase
        .from('app_user')
        .select('id, handle, avatar_url')
        .eq('role', 'spotif.ve');

      if (clientsError) throw clientsError;

      // Récupérer les clients déjà liés à ce coach
      const { data: linkedPrograms, error: programsError } = await supabase
        .from('program')
        .select('client_id')
        .eq('coach_id', user?.id);

      if (programsError) throw programsError;

      const linkedClientIds = new Set(linkedPrograms?.map((p) => p.client_id) || []);

      // Filtrer les clients non liés
      const availableClients = allClients?.filter((c) => !linkedClientIds.has(c.id)) || [];
      setClients(availableClients);
      setFilteredClients(availableClients);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les sportif·ves',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClient = async (clientId: string) => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('link-client-to-coach', {
        body: { client_id: clientId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Erreur',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Succès',
        description: 'Sportif·ve lié·e avec succès',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning client:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de lier le/la sportif·ve',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner un·e sportif·ve</DialogTitle>
          <DialogDescription>
            Sélectionnez un·e sportif·ve à ajouter à vos clients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {search ? 'Aucun résultat' : 'Tous les sportif·ves sont déjà assigné·es'}
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={client.avatar_url} />
                      <AvatarFallback>
                        {client.handle.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{client.handle}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssignClient(client.id)}
                    disabled={loading}
                  >
                    Assigner
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
