import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientWithProgram {
  id: string;
  handle: string;
  avatar_url?: string;
  program?: {
    id: string;
    titre: string;
    statut: string;
    objectif?: string;
  };
}

export const useCoachClients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientWithProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchClients = async () => {
      try {
        // Get programs where this coach is the coach
        const { data: programs, error: programError } = await supabase
          .from('program')
          .select(`
            id,
            titre,
            statut,
            objectif,
            client_id,
            client:client_id (
              id,
              handle,
              avatar_url
            )
          `)
          .eq('coach_id', user.id);

        if (programError) throw programError;

        // Transform data
        const clientsMap = new Map<string, ClientWithProgram>();
        
        programs?.forEach((prog: any) => {
          if (prog.client) {
            const clientId = prog.client.id;
            if (!clientsMap.has(clientId)) {
              clientsMap.set(clientId, {
                id: clientId,
                handle: prog.client.handle,
                avatar_url: prog.client.avatar_url,
                program: {
                  id: prog.id,
                  titre: prog.titre,
                  statut: prog.statut,
                  objectif: prog.objectif
                }
              });
            }
          }
        });

        setClients(Array.from(clientsMap.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [user]);

  return { clients, loading, error, refetch: () => setLoading(true) };
};
