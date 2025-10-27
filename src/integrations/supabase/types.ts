export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_user: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          credential_id: string | null
          handle: string | null
          id: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          credential_id?: string | null
          handle?: string | null
          id?: string
          role: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          credential_id?: string | null
          handle?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: true
            referencedRelation: "credential"
            referencedColumns: ["id"]
          },
        ]
      }
      article: {
        Row: {
          author: string | null
          categories: string[] | null
          contenu: string | null
          cover_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string | null
          titre: string | null
        }
        Insert: {
          author?: string | null
          categories?: string[] | null
          contenu?: string | null
          cover_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string | null
          titre?: string | null
        }
        Update: {
          author?: string | null
          categories?: string[] | null
          contenu?: string | null
          cover_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string | null
          titre?: string | null
        }
        Relationships: []
      }
      client_routines: {
        Row: {
          active: boolean | null
          assigned_by: string
          client_id: string
          created_at: string | null
          id: string
          routine_id: string
        }
        Insert: {
          active?: boolean | null
          assigned_by: string
          client_id: string
          created_at?: string | null
          id?: string
          routine_id: string
        }
        Update: {
          active?: boolean | null
          assigned_by?: string
          client_id?: string
          created_at?: string | null
          id?: string
          routine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_routines_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_routines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_routines_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      credential: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          role: string
          secret_hash: string
          status: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          role: string
          secret_hash: string
          status?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          role?: string
          secret_hash?: string
          status?: string | null
          username?: string
        }
        Relationships: []
      }
      exercise: {
        Row: {
          categories: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          groupes: string[] | null
          id: string
          libelle: string
          materiel: string[] | null
          niveau: string | null
          tags: string[] | null
          verified: boolean | null
          video_id: string | null
          video_provider: string | null
          youtube_url: string | null
        }
        Insert: {
          categories?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          groupes?: string[] | null
          id?: string
          libelle: string
          materiel?: string[] | null
          niveau?: string | null
          tags?: string[] | null
          verified?: boolean | null
          video_id?: string | null
          video_provider?: string | null
          youtube_url?: string | null
        }
        Update: {
          categories?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          groupes?: string[] | null
          id?: string
          libelle?: string
          materiel?: string[] | null
          niveau?: string | null
          tags?: string[] | null
          verified?: boolean | null
          video_id?: string | null
          video_provider?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_feedback: {
        Row: {
          created_at: string | null
          difficulte_0_10: number | null
          exercise_id: string | null
          id: string
          plaisir_0_10: number | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          difficulte_0_10?: number | null
          exercise_id?: string | null
          id?: string
          plaisir_0_10?: number | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          difficulte_0_10?: number | null
          exercise_id?: string | null
          id?: string
          plaisir_0_10?: number | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_feedback_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session"
            referencedColumns: ["id"]
          },
        ]
      }
      habit: {
        Row: {
          created_at: string | null
          default_active: boolean | null
          description: string | null
          id: string
          key: string | null
          owner: string | null
          titre: string | null
        }
        Insert: {
          created_at?: string | null
          default_active?: boolean | null
          description?: string | null
          id?: string
          key?: string | null
          owner?: string | null
          titre?: string | null
        }
        Update: {
          created_at?: string | null
          default_active?: boolean | null
          description?: string | null
          id?: string
          key?: string | null
          owner?: string | null
          titre?: string | null
        }
        Relationships: []
      }
      habit_assignment: {
        Row: {
          active: boolean | null
          client_id: string | null
          created_at: string | null
          habit_id: string | null
          id: string
        }
        Insert: {
          active?: boolean | null
          client_id?: string | null
          created_at?: string | null
          habit_id?: string | null
          id?: string
        }
        Update: {
          active?: boolean | null
          client_id?: string | null
          created_at?: string | null
          habit_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_assignment_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_assignment_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_check: {
        Row: {
          checked: boolean | null
          client_id: string | null
          created_at: string | null
          date: string | null
          habit_id: string | null
          id: string
        }
        Insert: {
          checked?: boolean | null
          client_id?: string | null
          created_at?: string | null
          date?: string | null
          habit_id?: string | null
          id?: string
        }
        Update: {
          checked?: boolean | null
          client_id?: string | null
          created_at?: string | null
          date?: string | null
          habit_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_check_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_check_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit"
            referencedColumns: ["id"]
          },
        ]
      }
      program: {
        Row: {
          client_id: string | null
          coach_id: string | null
          created_at: string | null
          id: string
          objectif: string | null
          statut: string | null
          titre: string | null
        }
        Insert: {
          client_id?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          objectif?: string | null
          statut?: string | null
          titre?: string | null
        }
        Update: {
          client_id?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          objectif?: string | null
          statut?: string | null
          titre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          order_index: number
          repetitions: number | null
          routine_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          order_index?: number
          repetitions?: number | null
          routine_id: string
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          order_index?: number
          repetitions?: number | null
          routine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_tracking: {
        Row: {
          client_id: string
          completed: boolean | null
          created_at: string | null
          date: string
          id: string
          routine_id: string
        }
        Insert: {
          client_id: string
          completed?: boolean | null
          created_at?: string | null
          date: string
          id?: string
          routine_id: string
        }
        Update: {
          client_id?: string
          completed?: boolean | null
          created_at?: string | null
          date?: string
          id?: string
          routine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_tracking_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_tracking_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          coach_id: string
          created_at: string | null
          description: string | null
          id: string
          tips: Json | null
          title: string
          type: Database["public"]["Enums"]["routine_type"]
          video_url: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          tips?: Json | null
          title: string
          type?: Database["public"]["Enums"]["routine_type"]
          video_url?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          tips?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["routine_type"]
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routines_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          client_id: string | null
          commentaire_fin: string | null
          created_at: string | null
          date_demarree: string | null
          date_terminee: string | null
          id: string
          index_num: number | null
          proof_media_url: string | null
          statut: string | null
          week_plan_id: string | null
          workout_id: string | null
        }
        Insert: {
          client_id?: string | null
          commentaire_fin?: string | null
          created_at?: string | null
          date_demarree?: string | null
          date_terminee?: string | null
          id?: string
          index_num?: number | null
          proof_media_url?: string | null
          statut?: string | null
          week_plan_id?: string | null
          workout_id?: string | null
        }
        Update: {
          client_id?: string | null
          commentaire_fin?: string | null
          created_at?: string | null
          date_demarree?: string | null
          date_terminee?: string | null
          id?: string
          index_num?: number | null
          proof_media_url?: string | null
          statut?: string | null
          week_plan_id?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_week_plan_id_fkey"
            columns: ["week_plan_id"]
            isOneToOne: false
            referencedRelation: "week_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout"
            referencedColumns: ["id"]
          },
        ]
      }
      set_log: {
        Row: {
          charge: number | null
          commentaire: string | null
          created_at: string | null
          exercise_id: string | null
          id: string
          index_serie: number | null
          reps: number | null
          rpe: number | null
          session_id: string | null
        }
        Insert: {
          charge?: number | null
          commentaire?: string | null
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          index_serie?: number | null
          reps?: number | null
          rpe?: number | null
          session_id?: string | null
        }
        Update: {
          charge?: number | null
          commentaire?: string | null
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          index_serie?: number | null
          reps?: number | null
          rpe?: number | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "set_log_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session"
            referencedColumns: ["id"]
          },
        ]
      }
      week_plan: {
        Row: {
          created_at: string | null
          end_date: string | null
          expected_sessions: number
          id: string
          iso_week: number | null
          program_id: string | null
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          expected_sessions: number
          id?: string
          iso_week?: number | null
          program_id?: string | null
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          expected_sessions?: number
          id?: string
          iso_week?: number | null
          program_id?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "week_plan_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program"
            referencedColumns: ["id"]
          },
        ]
      }
      workout: {
        Row: {
          circuit_configs: Json | null
          circuit_rounds: number | null
          created_at: string | null
          description: string | null
          duree_estimee: number | null
          id: string
          is_template: boolean | null
          nombre_circuits: number | null
          program_id: string | null
          temps_repos_tours_seconds: number | null
          titre: string | null
          workout_type: string | null
        }
        Insert: {
          circuit_configs?: Json | null
          circuit_rounds?: number | null
          created_at?: string | null
          description?: string | null
          duree_estimee?: number | null
          id?: string
          is_template?: boolean | null
          nombre_circuits?: number | null
          program_id?: string | null
          temps_repos_tours_seconds?: number | null
          titre?: string | null
          workout_type?: string | null
        }
        Update: {
          circuit_configs?: Json | null
          circuit_rounds?: number | null
          created_at?: string | null
          description?: string | null
          duree_estimee?: number | null
          id?: string
          is_template?: boolean | null
          nombre_circuits?: number | null
          program_id?: string | null
          temps_repos_tours_seconds?: number | null
          titre?: string | null
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercise: {
        Row: {
          charge_cible: number | null
          circuit_number: number | null
          couleur: string | null
          couleur_elastique: string | null
          exercise_id: string | null
          id: string
          order_index: number | null
          reps: number | null
          rpe_cible: number | null
          series: number | null
          tempo: string | null
          temps_repos_seconds: number | null
          temps_seconds: number | null
          tips: string | null
          variations: string | null
          workout_id: string | null
        }
        Insert: {
          charge_cible?: number | null
          circuit_number?: number | null
          couleur?: string | null
          couleur_elastique?: string | null
          exercise_id?: string | null
          id?: string
          order_index?: number | null
          reps?: number | null
          rpe_cible?: number | null
          series?: number | null
          tempo?: string | null
          temps_repos_seconds?: number | null
          temps_seconds?: number | null
          tips?: string | null
          variations?: string | null
          workout_id?: string | null
        }
        Update: {
          charge_cible?: number | null
          circuit_number?: number | null
          couleur?: string | null
          couleur_elastique?: string | null
          exercise_id?: string | null
          id?: string
          order_index?: number | null
          reps?: number | null
          rpe_cible?: number | null
          series?: number | null
          tempo?: string | null
          temps_repos_seconds?: number | null
          temps_seconds?: number | null
          tips?: string | null
          variations?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercise_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercise_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_auth_user_from_credential: {
        Args: { p_credential_id: string; p_email: string; p_password: string }
        Returns: string
      }
      get_app_user_id: { Args: never; Returns: string }
      is_client: { Args: never; Returns: boolean }
      is_coach: { Args: never; Returns: boolean }
    }
    Enums: {
      routine_type: "exercises" | "video"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      routine_type: ["exercises", "video"],
    },
  },
} as const
