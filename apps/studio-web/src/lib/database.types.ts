export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: string
          permissions: string[] | null
          metadata: Json
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: string
          permissions?: string[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: string
          permissions?: string[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string | null
          token: string
          expires_at: string
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          token: string
          expires_at: string
          data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          token?: string
          expires_at?: string
          data?: Json
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string | null
          key_hash: string
          name: string | null
          permissions: string[] | null
          last_used_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          key_hash: string
          name?: string | null
          permissions?: string[] | null
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          key_hash?: string
          name?: string | null
          permissions?: string[] | null
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource: string | null
          resource_id: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource?: string | null
          resource_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource?: string | null
          resource_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string
          category: string | null
          tags: string[] | null
          metadata: Json | null
          is_active: boolean
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content: string
          category?: string | null
          tags?: string[] | null
          metadata?: Json | null
          is_active?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string
          category?: string | null
          tags?: string[] | null
          metadata?: Json | null
          is_active?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workflows: {
        Row: {
          id: string
          name: string
          description: string | null
          config: Json
          is_active: boolean
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          config: Json
          is_active?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          config?: Json
          is_active?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      evaluations: {
        Row: {
          id: string
          prompt_id: string | null
          workflow_id: string | null
          model: string | null
          input_data: Json | null
          output_data: Json | null
          metrics: Json | null
          score: number | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          prompt_id?: string | null
          workflow_id?: string | null
          model?: string | null
          input_data?: Json | null
          output_data?: Json | null
          metrics?: Json | null
          score?: number | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          prompt_id?: string | null
          workflow_id?: string | null
          model?: string | null
          input_data?: Json | null
          output_data?: Json | null
          metrics?: Json | null
          score?: number | null
          user_id?: string | null
          created_at?: string
        }
      }
      paraphrase_history: {
        Row: {
          id: string
          original_text: string
          paraphrased_text: string
          style: string | null
          tone: string | null
          model: string | null
          metadata: Json | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          original_text: string
          paraphrased_text: string
          style?: string | null
          tone?: string | null
          model?: string | null
          metadata?: Json | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          original_text?: string
          paraphrased_text?: string
          style?: string | null
          tone?: string | null
          model?: string | null
          metadata?: Json | null
          user_id?: string | null
          created_at?: string
        }
      }
      api_usage: {
        Row: {
          id: string
          endpoint: string
          method: string
          request_body: Json | null
          response_status: number | null
          response_time_ms: number | null
          error_message: string | null
          user_agent: string | null
          ip_address: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          endpoint: string
          method: string
          request_body?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          error_message?: string | null
          user_agent?: string | null
          ip_address?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          endpoint?: string
          method?: string
          request_body?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          error_message?: string | null
          user_agent?: string | null
          ip_address?: string | null
          user_id?: string | null
          created_at?: string
        }
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