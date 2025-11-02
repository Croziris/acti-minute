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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Info } from 'lucide-react';

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
  const [sessionType, setSessionType] = useState<'warmup' | 'main' | 'cooldown'>('main');
  const [nombreCircuits, setNombreCircuits] = useState('1');
  const [circuitConfigs, setCircuitConfigs] = useState([{ rounds: '3', rest: '60' }]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setTitre('');
    setDescription('');
    setDureeEstimee('');
    setWorkoutType('classic');
    setSessionType('main');
    setNombreCircuits('1');
    setCircuitConfigs([{ rounds: '3', rest: '60' }]);
  };

  const handleNombreCircuitsChange = (value: string) => {
    setNombreCircuits(value);
    const num = value === 'custom' ? 3 : parseInt(value);
    const newConfigs = Array.from({ length: num }, (_, i) => 
      circuitConfigs[i] || { rounds: '3', rest: '60' }
    );
    setCircuitConfigs(newConfigs);
  };

  const updateCircuitConfig = (index: number, field: 'rounds' | 'rest', value: string) => {
    const newConfigs = [...circuitConfigs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setCircuitConfigs(newConfigs);
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

    if (workoutType === 'circuit') {
      const hasInvalidConfig = circuitConfigs.some(config => !config.rounds);
      if (hasInvalidConfig) {
        toast({
          title: "Erreur",
          description: "Le nombre de tours est requis pour chaque circuit",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setLoading(true);

      const configs = circuitConfigs.map(c => ({
        rounds: parseInt(c.rounds),
        rest: parseInt(c.rest)
      }));

      const { error } = await supabase
        .from('workout')
        .insert({
          titre: titre.trim(),
          description: description.trim() || null,
          duree_estimee: dureeEstimee ? parseInt(dureeEstimee) : null,
          workout_type: workoutType,
          session_type: sessionType,
          nombre_circuits: workoutType === 'circuit' ? circuitConfigs.length : 1,
          circuit_configs: workoutType === 'circuit' ? configs : null,
          // Garder la compatibilité avec l'ancien système
          circuit_rounds: workoutType === 'circuit' ? configs[0].rounds : null,
          temps_repos_tours_seconds: workoutType === 'circuit' ? configs[0].rest : null,
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
            <Label>Format de séance *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="session-type" className="flex items-center gap-2">
              Type de section
              <Info className="h-4 w-4 text-muted-foreground" />
            </Label>
            
            <Select 
              value={sessionType} 
              onValueChange={(value: 'warmup' | 'main' | 'cooldown') => setSessionType(value)}
            >
              <SelectTrigger id="session-type">
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warmup">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔥</span>
                    <div className="text-left">
                      <div className="font-medium">Échauffement</div>
                      <div className="text-xs text-muted-foreground">
                        Préparation du corps (sans feedback)
                      </div>
                    </div>
                  </div>
                </SelectItem>
                
                <SelectItem value="main">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💪</span>
                    <div className="text-left">
                      <div className="font-medium">Séance Principale</div>
                      <div className="text-xs text-muted-foreground">
                        Effort principal (avec feedbacks)
                      </div>
                    </div>
                  </div>
                </SelectItem>
                
                <SelectItem value="cooldown">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🧘</span>
                    <div className="text-left">
                      <div className="font-medium">Retour au Calme</div>
                      <div className="text-xs text-muted-foreground">
                        Récupération (optionnel, sans feedback)
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <p className="text-xs text-muted-foreground">
              {sessionType === 'warmup' && '🔥 Cette séance sera proposée en début d\'entraînement pour préparer le corps.'}
              {sessionType === 'main' && '💪 Cette séance constitue l\'effort principal avec feedbacks RPE, difficulté et plaisir.'}
              {sessionType === 'cooldown' && '🧘 Cette séance sera proposée en fin d\'entraînement (le client peut la passer).'}
            </p>
          </div>

          {workoutType === 'circuit' && (
            <>
              <div>
                <Label htmlFor="nombre-circuits">Nombre de circuits</Label>
                <Select value={nombreCircuits} onValueChange={handleNombreCircuitsChange}>
                  <SelectTrigger id="nombre-circuits">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 circuit</SelectItem>
                    <SelectItem value="2">2 circuits</SelectItem>
                    <SelectItem value="3">3 circuits</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {nombreCircuits === 'custom' && (
                <div>
                  <Label htmlFor="custom-circuits">Nombre de circuits personnalisé</Label>
                  <Input
                    id="custom-circuits"
                    type="number"
                    min="1"
                    max="10"
                    value={circuitConfigs.length}
                    onChange={(e) => {
                      const num = parseInt(e.target.value) || 1;
                      const newConfigs = Array.from({ length: num }, (_, i) => 
                        circuitConfigs[i] || { rounds: '3', rest: '60' }
                      );
                      setCircuitConfigs(newConfigs);
                    }}
                  />
                </div>
              )}

              {circuitConfigs.map((config, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-sm">
                    Circuit {index + 1}
                  </h4>
                  <div>
                    <Label htmlFor={`rounds-${index}`}>Nombre de tours *</Label>
                    <Input
                      id={`rounds-${index}`}
                      type="number"
                      value={config.rounds}
                      onChange={(e) => updateCircuitConfig(index, 'rounds', e.target.value)}
                      placeholder="Ex: 3"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`rest-${index}`}>Temps de repos entre tours (secondes)</Label>
                    <Input
                      id={`rest-${index}`}
                      type="number"
                      value={config.rest}
                      onChange={(e) => updateCircuitConfig(index, 'rest', e.target.value)}
                      placeholder="60"
                      min="0"
                      max="300"
                      step="15"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Repos recommandé : 30-90 secondes
                    </p>
                  </div>
                </div>
              ))}
            </>
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
