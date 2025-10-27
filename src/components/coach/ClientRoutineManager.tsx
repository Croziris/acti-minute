import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientRoutineAssignment } from './ClientRoutineAssignment';
import { ClientRoutineStats } from './ClientRoutineStats';

interface ClientRoutineManagerProps {
  clientId: string;
}

export const ClientRoutineManager: React.FC<ClientRoutineManagerProps> = ({ clientId }) => {
  return (
    <Tabs defaultValue="assign" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="assign">Assigner une Routine</TabsTrigger>
        <TabsTrigger value="stats">Suivi & Statistiques</TabsTrigger>
      </TabsList>
      <TabsContent value="assign" className="mt-6">
        <ClientRoutineAssignment clientId={clientId} />
      </TabsContent>
      <TabsContent value="stats" className="mt-6">
        <ClientRoutineStats clientId={clientId} />
      </TabsContent>
    </Tabs>
  );
};
