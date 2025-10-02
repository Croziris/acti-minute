import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Play, Trophy, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { useWeeklyProgram } from '@/hooks/useWeeklyProgram';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useNavigate } from 'react-router-dom';

const ClientHome = () => {
  const navigate = useNavigate();
  const { weekPlan, loading } = useWeeklyProgram();
  const { isOnline, pendingSync } = useOfflineSync();

  const handleStartSession = (sessionId: string) => {
    navigate(`/client/session/${sessionId}`);
  };

  const getSessionStatusText = (status: string) => {
    switch (status) {
      case 'done': return 'Terminée ✅';
      case 'ongoing': return 'En cours 🔄';
      case 'skipped': return 'Sautée ⏭️';
      default: return 'À faire';
    }
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
            <div className="flex items-center">
              <WifiOff className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800 text-sm">
                Mode hors-ligne — vos données seront synchronisées à la reconnexion.
                {pendingSync > 0 && ` (${pendingSync} éléments en attente)`}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-card rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Bonjour ! 👋
          </h1>
          <p className="text-muted-foreground">
            Prêt(e) pour votre séance d'aujourd'hui ?
          </p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cette semaine</p>
                  <p className="text-xl font-bold">
                    {weekPlan ? 
                      `${weekPlan.sessions.filter(s => s.statut === 'done').length}/${weekPlan.expected_sessions}` 
                      : '0/0'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p className="text-xl font-bold">
                    {isOnline ? 'En ligne' : 'Hors ligne'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Programme de la semaine */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Programme de la semaine</span>
                </CardTitle>
                <CardDescription>
                  {weekPlan ? (
                    <>
                      Semaine du {new Date(weekPlan.start_date).toLocaleDateString('fr-FR')} au {new Date(weekPlan.end_date).toLocaleDateString('fr-FR')}
                      {weekPlan.iso_week !== Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 604800000) + 1 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Semaine {weekPlan.iso_week})
                        </span>
                      )}
                    </>
                  ) : 'Chargement...'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-muted/50 rounded-lg h-16"></div>
                ))}
              </div>
            ) : weekPlan && weekPlan.sessions.length > 0 ? (
              weekPlan.sessions.map((session, index) => {
                const isNext = session.statut === 'planned' && 
                             !weekPlan.sessions.slice(0, index).some(s => s.statut === 'planned');
                
                return (
                  <div 
                    key={session.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isNext ? 'bg-primary/5 border-l-4 border-primary' : 'bg-muted/50'
                    }`}
                  >
                    <div>
                      <h4 className="font-medium">
                        Séance {session.index_num} - {session.workout?.titre || 'Séance'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {session.workout?.duree_estimee ? `${session.workout.duree_estimee} min • ` : ''}
                        {getSessionStatusText(session.statut)}
                      </p>
                    </div>
                    
                    {session.statut === 'planned' && isNext && (
                      <Button 
                        size="sm" 
                        className="bg-gradient-primary"
                        onClick={() => handleStartSession(session.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Commencer
                      </Button>
                    )}
                    
                    {session.statut === 'ongoing' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStartSession(session.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Reprendre
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Aucune séance programmée</h3>
                <p className="text-sm text-muted-foreground">
                  Votre coach n'a pas encore créé de programme pour cette semaine.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center space-y-1"
            onClick={() => navigate('/client/habits')}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-sm">Mes habitudes</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center space-y-1"
            onClick={() => navigate('/client/articles')}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Articles</span>
          </Button>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientHome;