import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OfflineData {
  type: 'set_log' | 'exercise_feedback' | 'session_update';
  data: any;
  timestamp: number;
  id: string;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<OfflineData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending data from localStorage
    const stored = localStorage.getItem('offline_pending_sync');
    if (stored) {
      try {
        setPendingSync(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading offline data:', e);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('offline_pending_sync', JSON.stringify(pendingSync));
  }, [pendingSync]);

  const addOfflineData = useCallback((type: OfflineData['type'], data: any) => {
    const offlineItem: OfflineData = {
      type,
      data,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    };
    
    setPendingSync(prev => [...prev, offlineItem]);
  }, []);

  const syncPendingData = useCallback(async () => {
    if (!isOnline || pendingSync.length === 0 || isSyncing) return;

    setIsSyncing(true);
    
    try {
      for (const item of pendingSync) {
        switch (item.type) {
          case 'set_log':
            await supabase.from('set_log').insert(item.data);
            break;
          case 'exercise_feedback':
            await supabase.from('exercise_feedback').insert(item.data);
            break;
          case 'session_update':
            await supabase.from('session').update(item.data.updates).eq('id', item.data.sessionId);
            break;
        }
      }
      
      setPendingSync([]);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, pendingSync, isSyncing]);

  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      syncPendingData();
    }
  }, [isOnline, syncPendingData]);

  return {
    isOnline,
    pendingSync: pendingSync.length,
    isSyncing,
    addOfflineData,
    syncPendingData,
  };
};