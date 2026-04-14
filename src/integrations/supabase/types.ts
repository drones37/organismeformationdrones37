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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance_sheets: {
        Row: {
          created_at: string
          date: string
          days: number
          formation: string
          id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          date: string
          days?: number
          formation: string
          id: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          date?: string
          days?: number
          formation?: string
          id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      attendance_students: {
        Row: {
          created_at: string
          grade: string
          id: string
          livret_vu: boolean
          sheet_id: string
          signatures: Json
          student_id: string
          student_name: string
        }
        Insert: {
          created_at?: string
          grade?: string
          id?: string
          livret_vu?: boolean
          sheet_id: string
          signatures?: Json
          student_id: string
          student_name: string
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          livret_vu?: boolean
          sheet_id?: string
          signatures?: Json
          student_id?: string
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_students_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "attendance_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          file_data: string | null
          formation_id: string | null
          id: string
          name: string
          size: string
          student_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          file_data?: string | null
          formation_id?: string | null
          id: string
          name: string
          size?: string
          student_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          file_data?: string | null
          formation_id?: string | null
          id?: string
          name?: string
          size?: string
          student_id?: string | null
        }
        Relationships: []
      }
      invoice_statuses: {
        Row: {
          created_at: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      plan_action_entries: {
        Row: {
          action: string
          commentaire: string
          constat: string
          created_at: string
          date: string
          echeance: string
          id: string
          origine: string
          responsable: string
          statut: string
        }
        Insert: {
          action?: string
          commentaire?: string
          constat?: string
          created_at?: string
          date: string
          echeance?: string
          id: string
          origine?: string
          responsable?: string
          statut?: string
        }
        Update: {
          action?: string
          commentaire?: string
          constat?: string
          created_at?: string
          date?: string
          echeance?: string
          id?: string
          origine?: string
          responsable?: string
          statut?: string
        }
        Relationships: []
      }
      progression_modules: {
        Row: {
          comment: string | null
          created_at: string
          evaluated_at: string | null
          id: string
          name: string
          objectives: Json
          progression_id: string
          rating_end: number | null
          rating_start: number | null
          sort_order: number
          status: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          evaluated_at?: string | null
          id: string
          name: string
          objectives?: Json
          progression_id: string
          rating_end?: number | null
          rating_start?: number | null
          sort_order?: number
          status?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          evaluated_at?: string | null
          id?: string
          name?: string
          objectives?: Json
          progression_id?: string
          rating_end?: number | null
          rating_start?: number | null
          sort_order?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "progression_modules_progression_id_fkey"
            columns: ["progression_id"]
            isOneToOne: false
            referencedRelation: "progression_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      progression_sheets: {
        Row: {
          created_at: string
          end_date: string
          formation: string
          global_result: string | null
          id: string
          instructor_name: string
          start_date: string
          student_id: string
          student_name: string
        }
        Insert: {
          created_at?: string
          end_date: string
          formation: string
          global_result?: string | null
          id: string
          instructor_name?: string
          start_date: string
          student_id: string
          student_name: string
        }
        Update: {
          created_at?: string
          end_date?: string
          formation?: string
          global_result?: string | null
          id?: string
          instructor_name?: string
          start_date?: string
          student_id?: string
          student_name?: string
        }
        Relationships: []
      }
      satisfaction_questions: {
        Row: {
          created_at: string
          id: string
          rating: number
          satisfaction_id: string
          sort_order: number
          text: string
        }
        Insert: {
          created_at?: string
          id: string
          rating?: number
          satisfaction_id: string
          sort_order?: number
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          satisfaction_id?: string
          sort_order?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_questions_satisfaction_id_fkey"
            columns: ["satisfaction_id"]
            isOneToOne: false
            referencedRelation: "satisfaction_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_responses: {
        Row: {
          comment: string | null
          created_at: string
          date: string
          formation: string
          id: string
          student_id: string
          student_name: string
          type: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          date: string
          formation: string
          id: string
          student_id: string
          student_name: string
          type: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          date?: string
          formation?: string
          id?: string
          student_id?: string
          student_name?: string
          type?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          dossier_complet: boolean
          email: string
          end_date: string
          first_name: string
          formation: string
          handicap: boolean
          handicap_adaptations: string | null
          handicap_details: string | null
          id: string
          last_name: string
          phone: string
          prerequisites: Json | null
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          dossier_complet?: boolean
          email?: string
          end_date?: string
          first_name: string
          formation?: string
          handicap?: boolean
          handicap_adaptations?: string | null
          handicap_details?: string | null
          id: string
          last_name: string
          phone?: string
          prerequisites?: Json | null
          start_date?: string
          status?: string
        }
        Update: {
          created_at?: string
          dossier_complet?: boolean
          email?: string
          end_date?: string
          first_name?: string
          formation?: string
          handicap?: boolean
          handicap_adaptations?: string | null
          handicap_details?: string | null
          id?: string
          last_name?: string
          phone?: string
          prerequisites?: Json | null
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      veille_entries: {
        Row: {
          contenu: string
          created_at: string
          date: string
          exploitation: string
          id: string
          preuves: string
          type: string
        }
        Insert: {
          contenu?: string
          created_at?: string
          date: string
          exploitation?: string
          id: string
          preuves?: string
          type?: string
        }
        Update: {
          contenu?: string
          created_at?: string
          date?: string
          exploitation?: string
          id?: string
          preuves?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
