import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import { getYouTubeEmbedUrl, isYouTubeShort } from '@/lib/utils';

interface Exercise {
  exercise_id: string;
  order_index?: number;
  reps?: number | null;
  temps_seconds?: number | null;
  charge_cible?: number | null;
  couleur_elastique?: string | null;
  tips?: string | null;
  variations?: string | null;
  exercise: {
    id: string;
    libelle: string;
    description?: string;
    video_id?: string;
    youtube_url?: string;
    categories: string[];
    groupes: string[];
  };
}

interface CircuitExerciseCardProps {
  exercise: Exercise;
  index: number;
}

export const CircuitExerciseCard: React.FC<CircuitExerciseCardProps> = ({ exercise: we, index }) => {
  const [showVideo, setShowVideo] = useState(false);
  const isShort = we.exercise?.youtube_url ? isYouTubeShort(we.exercise.youtube_url) : false;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Badge variant="outline" className="font-mono mt-1">
              {index + 1}
            </Badge>
            <div className="flex-1">
              <CardTitle className="text-lg">{we.exercise.libelle}</CardTitle>
              {we.exercise.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {we.exercise.description}
                </p>
              )}
            </div>
          </div>
          
          {we.exercise.video_id && (
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
          {we.exercise.categories?.map(cat => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
          {we.exercise.groupes?.map(groupe => (
            <Badge key={groupe} variant="outline" className="text-xs">
              {groupe}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Video Player */}
        {showVideo && we.exercise.video_id && (
          <div className={isShort ? "flex justify-center" : "aspect-video w-full"}>
            <iframe
              src={getYouTubeEmbedUrl(we.exercise.video_id, isShort)}
              title={we.exercise.libelle}
              className={isShort ? "w-full max-w-[360px] h-[640px] rounded-lg" : "w-full h-full rounded-lg"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Exercise Prescription */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="font-semibold text-lg">
              {we.reps || we.temps_seconds}
            </div>
            <div className="text-xs text-muted-foreground">
              {we.reps ? 'Répétitions' : 'Secondes'}
            </div>
          </div>
          {we.charge_cible && (
            <div className="text-center">
              <div className="font-semibold text-lg">{we.charge_cible}kg</div>
              <div className="text-xs text-muted-foreground">Charge cible</div>
            </div>
          )}
        </div>

        {/* Couleur élastique */}
        {we.couleur_elastique && (
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
            <Badge variant="outline">Élastique {we.couleur_elastique}</Badge>
          </div>
        )}

        {/* Tips & Variations */}
        {(we.tips || we.variations) && (
          <div className="space-y-2">
            {we.tips && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 rounded">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Conseil</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">{we.tips}</div>
              </div>
            )}
            {we.variations && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 border-l-4 border-green-400 rounded">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">Variations</div>
                <div className="text-sm text-green-700 dark:text-green-300">{we.variations}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
