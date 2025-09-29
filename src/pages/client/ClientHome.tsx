import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Play, Trophy, TrendingUp } from 'lucide-react';

const ClientHome = () => {
  return (
    <ClientLayout>
      <div className="space-y-6">
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
                  <p className="text-xl font-bold">2/3</p>
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
                  <p className="text-sm text-muted-foreground">Progression</p>
                  <p className="text-xl font-bold">+12%</p>
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
                  Semaine du 23 au 29 septembre 2025
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <h4 className="font-medium">Séance 1 - Haut du corps</h4>
                <p className="text-sm text-muted-foreground">45 min • Terminée ✅</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <h4 className="font-medium">Séance 2 - Cardio HIIT</h4>
                <p className="text-sm text-muted-foreground">30 min • Terminée ✅</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
              <div>
                <h4 className="font-medium">Séance 3 - Jambes & Glutes</h4>
                <p className="text-sm text-muted-foreground">50 min • À faire aujourd'hui</p>
              </div>
              <Button size="sm" className="bg-gradient-primary">
                <Play className="h-4 w-4 mr-1" />
                Commencer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1">
            <Calendar className="h-5 w-5" />
            <span className="text-sm">Mes habitudes</span>
          </Button>
          
          <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Articles</span>
          </Button>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientHome;