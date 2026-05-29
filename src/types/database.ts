export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Role = 'participante' | 'curador' | 'admin' | 'super_admin'
export type TaskFrequency = 'unica' | 'semanal' | 'mensal'
export type SubmissionStatus = 'pendente' | 'aprovado' | 'recusado'

export interface Database {
  public: {
    Tables: {
      programs: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          primary_color: string
          dark_color: string
          task_label: string
          points_label: string
          participant_label: string
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['programs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['programs']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          program_id: string
          email: string
          name: string
          role: Role
          instagram: string | null
          whatsapp: string | null
          linkedin: string | null
          avatar_url: string | null
          points: number
          ranking_position: number | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at' | 'points' | 'ranking_position'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          program_id: string
          title: string
          description: string
          instructions: string[]
          network: string
          content_type: string
          proof_type: string
          points: number
          frequency: TaskFrequency
          active: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      submissions: {
        Row: {
          id: string
          task_id: string
          user_id: string
          program_id: string
          proof_url: string | null
          proof_note: string | null
          status: SubmissionStatus
          points_awarded: number | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['submissions']['Row'], 'id' | 'created_at' | 'updated_at' | 'status' | 'points_awarded' | 'reviewed_by' | 'reviewed_at' | 'review_note'>
        Update: Partial<Database['public']['Tables']['submissions']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          program_id: string
          title: string
          body: string
          type: string
          read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'read'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
    Views: {
      ranking: {
        Row: {
          user_id: string
          program_id: string
          name: string
          avatar_url: string | null
          points: number
          position: number
          submissions_count: number
          approval_rate: number
        }
      }
    }
    Functions: {
      award_points: {
        Args: { p_user_id: string; p_points: number; p_program_id: string }
        Returns: void
      }
    }
  }
}

// Aliases convenientes
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Submission = Database['public']['Tables']['submissions']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Program = Database['public']['Tables']['programs']['Row']
export type RankingRow = Database['public']['Views']['ranking']['Row']
