import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Plus, Minus, Star } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface ExerciseCardProps {
  exercise: {
    id: string;
    libelle: string;
    description?: string;
    video_id?: string;
    youtube_url?: string;
    categories: string[];
    groupes: string[];
  };
  workoutExercise: {
    id: string;
    series?: number;
    reps?: number;
    temps_seconds?: number;
    charge_cible?: number;
    tempo?: string;
    couleur?: string;
    tips?: string;
    variations?: string;
  };
  sessionId: string;
  onSetComplete?: (setData: any) => void;
  onFeedback?: (feedback: any) => void;
}

interface SetLog {
  index_serie: number;
  reps?: number;
  charge?: number;
  rpe?: number;
  commentaire?: string;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  workoutExercise,
  sessionId,
  onSetComplete,
  onFeedback
}) => {
  const { addOfflineData } = useOfflineSync();
  const [currentSet, setCurrentSet] = useState(1);
  const [setLogs, setSetLogs] = useState<SetLog[]>([]);
  const [currentReps, setCurrentReps] = useState(workoutExercise.reps || 0);
  const [currentWeight, setCurrentWeight] = useState(workoutExercise.charge_cible || 0);
  const [currentRPE, setCurrentRPE] = useState(5);
  const [showVideo, setShowVideo] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ difficulte: 5, plaisir: 5 });

  const totalSets = workoutExercise.series || 3;

  const handleSetComplete = () => {
    const setData = {
      session_id: sessionId,
      exercise_id: exercise.id,
      index_serie: currentSet,
      reps: currentReps,
      charge: currentWeight,
      rpe: currentRPE,
      created_at: new Date().toISOString()
    };

    // Add to offline sync
    addOfflineData('set_log', setData);
    
    // Update local state
    setSetLogs(prev => [...prev, setData]);
    onSetComplete?.(setData);

    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
    } else {
      setShowFeedback(true);
    }
  };

  const handleFeedbackSubmit = () => {
    const feedbackData = {
      session_id: sessionId,
      exercise_id: exercise.id,
      difficulte_0_10: feedback.difficulte,
      plaisir_0_10: feedback.plaisir,
      created_at: new Date().toISOString()
    };

    addOfflineData('exercise_feedback', feedbackData);
    onFeedback?.(feedbackData);
    setShowFeedback(false);
  };

  const getYouTubeEmbedUrl = () => {
    if (!exercise.video_id) return null;
    return `https://www.youtube-nocookie.com/embed/${exercise.video_id}?rel=0&modestbranding=1`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{exercise.libelle}</CardTitle>
            {exercise.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {exercise.description}
              </p>
            )}
          </div>
          
          {exercise.video_id && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowVideo(!showVideo)}
            >
              <Play className="h-4 w-4 mr-1" />
              Vidéo
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {exercise.categories.map(cat => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
          {exercise.groupes.map(groupe => (
            <Badge key={groupe} variant="outline" className="text-xs">
              {groupe}
            </Badge>
          ))}
        </div>

        {workoutExercise.couleur && (
          <div 
            className="w-full h-2 rounded-full mt-2"
            style={{ backgroundColor: workoutExercise.couleur }}
          />
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Video Player */}
        {showVideo && exercise.video_id && (
          <div className="aspect-video w-full">
            <iframe
              src={getYouTubeEmbedUrl()!}
              title={exercise.libelle}
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
        )}

        {/* Exercise Info */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="font-semibold text-lg">{totalSets}</div>
            <div className="text-xs text-muted-foreground">Séries</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{workoutExercise.reps || '-'}</div>
            <div className="text-xs text-muted-foreground">Reps</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{workoutExercise.charge_cible || '-'}kg</div>
            <div className="text-xs text-muted-foreground">Charge</div>
          </div>
        </div>

        {/* Tips & Variations */}
        {(workoutExercise.tips || workoutExercise.variations) && (
          <div className="space-y-2">
            {workoutExercise.tips && (
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <div className="text-sm font-medium text-blue-800">Conseil</div>
                <div className="text-sm text-blue-700">{workoutExercise.tips}</div>
              </div>
            )}
            {workoutExercise.variations && (
              <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                <div className="text-sm font-medium text-green-800">Variations</div>
                <div className="text-sm text-green-700">{workoutExercise.variations}</div>
              </div>
            )}
          </div>
        )}

        {/* Current Set Input */}
        <div className="space-y-4 p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Série {currentSet}/{totalSets}</h4>
            <div className="text-sm text-muted-foreground">
              {setLogs.length} série(s) terminée(s)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Répétitions</label>
              <div className="flex items-center space-x-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentReps(Math.max(0, currentReps - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={currentReps}
                  onChange={(e) => setCurrentReps(parseInt(e.target.value) || 0)}
                  className="w-16 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentReps(currentReps + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Charge (kg)</label>
              <div className="flex items-center space-x-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeight(Math.max(0, currentWeight - 2.5))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  step="0.5"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeight(currentWeight + 2.5)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">RPE (1-10)</label>
            <div className="flex items-center space-x-1 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                <Button
                  key={rating}
                  variant={currentRPE === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentRPE(rating)}
                  className="w-8 h-8 p-0"
                >
                  {rating}
                </Button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSetComplete}
            className="w-full"
            disabled={currentSet > totalSets}
          >
            {currentSet < totalSets ? `Valider série ${currentSet}` : 'Terminer exercice'}
          </Button>
        </div>

        {/* Previous Sets */}
        {setLogs.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Séries précédentes</h5>
            {setLogs.map(set => (
              <div key={set.index_serie} className="flex justify-between items-center p-2 bg-muted/30 rounded text-sm">
                <span>Série {set.index_serie}</span>
                <span>{set.reps} reps × {set.charge}kg (RPE {set.rpe})</span>
              </div>
            ))}
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedback && (
          <div className="space-y-4 p-4 border-2 border-primary rounded-lg bg-primary/5">
            <h4 className="font-medium">Feedback sur l'exercice</h4>
            
            <div>
              <label className="text-sm font-medium">Difficulté (1-10)</label>
              <div className="flex items-center space-x-1 mt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                  <Button
                    key={rating}
                    variant={feedback.difficulte === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFeedback(prev => ({ ...prev, difficulte: rating }))}
                    className="w-8 h-8 p-0"
                  >
                    {rating}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Plaisir (1-10)</label>
              <div className="flex items-center space-x-1 mt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                  <Button
                    key={rating}
                    variant={feedback.plaisir === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFeedback(prev => ({ ...prev, plaisir: rating }))}
                    className="w-8 h-8 p-0"
                  >
                    <Star className="h-3 w-3" fill={feedback.plaisir >= rating ? "currentColor" : "none"} />
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleFeedbackSubmit} className="w-full">
              Envoyer le feedback
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};