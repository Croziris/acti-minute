import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateWorkoutDialog: React.FC<Props> = ({ open, onOpenChange, onSuccess }) => {
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [dureeEstimee, setDureeEstimee] = useState('');
  const [workoutType, setWorkoutType] = useState<'classic' | 'circuit'>('classic');
  const [circuitRounds, setCircuitRounds] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setTitre('');
    setDescription('');
    setDureeEstimee('');
    setWorkoutType('classic');
    setCircuitRounds('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titre.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre est requis",
        variant: "destructive"
      });
      return;
    }

    if (workoutType === 'circuit' && !circuitRounds) {
      toast({
        title: "Erreur",
        description: "Le nombre de tours est requis pour un circuit",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('workout')
        .insert({
          titre: titre.trim(),
          description: description.trim() || null,
          duree_estimee: dureeEstimee ? parseInt(dureeEstimee) : null,
          workout_type: workoutType,
          circuit_rounds: workoutType === 'circuit' ? parseInt(circuitRounds) : null,
          is_template: true
        });

      if (error) throw error;

      toast({
        title: "Séance créée",
        description: "La séance a été créée avec succès"
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating workout:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la séance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle séance</DialogTitle>
          <DialogDescription>
            Créez une séance réutilisable que vous pourrez assigner à vos clients
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titre">Titre de la séance *</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Full Body Débutant"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'objectif de cette séance..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="duree">Durée estimée (minutes)</Label>
            <Input
              id="duree"
              type="number"
              value={dureeEstimee}
              onChange={(e) => setDureeEstimee(e.target.value)}
              placeholder="Ex: 45"
              min="1"
            />
          </div>

          <div className="space-y-3">
            <Label>Type de séance *</Label>
            <RadioGroup value={workoutType} onValueChange={(value) => setWorkoutType(value as 'classic' | 'circuit')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="classic" id="classic" />
                <Label htmlFor="classic" className="font-normal cursor-pointer">
                  Séries classiques - Chaque exercice a ses propres séries et répétitions
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="circuit" id="circuit" />
                <Label htmlFor="circuit" className="font-normal cursor-pointer">
                  Circuit training - Groupe d'exercices à faire en circuit avec X tours
                </Label>
              </div>
            </RadioGroup>
          </div>

          {workoutType === 'circuit' && (
            <div>
              <Label htmlFor="rounds">Nombre de tours *</Label>
              <Input
                id="rounds"
                type="number"
                value={circuitRounds}
                onChange={(e) => setCircuitRounds(e.target.value)}
                placeholder="Ex: 4"
                min="1"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer la séance'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
