export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      access_grants: {
        Row: {
          blockchain_last_error: string | null
          blockchain_status: string
          blockchain_tx_hash: string | null
          can_download_attachments: boolean
          can_view_scope1: boolean
          can_view_scope2_mental: boolean
          can_view_scope2_physical: boolean
          consent_hash: string
          created_at: string
          doctor_id: string
          expires_at: string
          grant_id: string
          granted_at: string
          is_revoked: boolean
          patient_id: string
          replaced_by_grant_id: string | null
          revoked_at: string | null
        }
        Insert: {
          blockchain_last_error?: string | null
          blockchain_status?: string
          blockchain_tx_hash?: string | null
          can_download_attachments?: boolean
          can_view_scope1?: boolean
          can_view_scope2_mental?: boolean
          can_view_scope2_physical?: boolean
          consent_hash: string
          created_at?: string
          doctor_id: string
          expires_at: string
          grant_id?: string
          granted_at?: string
          is_revoked?: boolean
          patient_id: string
          replaced_by_grant_id?: string | null
          revoked_at?: string | null
        }
        Update: {
          blockchain_last_error?: string | null
          blockchain_status?: string
          blockchain_tx_hash?: string | null
          can_download_attachments?: boolean
          can_view_scope1?: boolean
          can_view_scope2_mental?: boolean
          can_view_scope2_physical?: boolean
          consent_hash?: string
          created_at?: string
          doctor_id?: string
          expires_at?: string
          grant_id?: string
          granted_at?: string
          is_revoked?: boolean
          patient_id?: string
          replaced_by_grant_id?: string | null
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_grants_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "access_grants_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "access_grants_replaced_by_grant_id_fkey"
            columns: ["replaced_by_grant_id"]
            isOneToOne: false
            referencedRelation: "access_grants"
            referencedColumns: ["grant_id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          created_at: string
          key_version: string
          message_id: string
          message_text_ciphertext: string
          message_text_iv: string
          message_text_tag: string
          patient_id: string
          sender_role: string
          session_id: string
        }
        Insert: {
          created_at?: string
          key_version?: string
          message_id?: string
          message_text_ciphertext: string
          message_text_iv: string
          message_text_tag: string
          patient_id: string
          sender_role: string
          session_id: string
        }
        Update: {
          created_at?: string
          key_version?: string
          message_id?: string
          message_text_ciphertext?: string
          message_text_iv?: string
          message_text_tag?: string
          patient_id?: string
          sender_role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "ai_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      ai_message_attachments: {
        Row: {
          attachment_id: string
          created_at: string
          extracted_text_ciphertext: string
          extracted_text_iv: string
          extracted_text_tag: string
          extracted_text_truncated: boolean
          extraction_method: "pdf_text" | "image_ocr"
          file_id: string
          file_size_bytes: number
          key_version: string
          message_id: string
          patient_id: string
          session_id: string
        }
        Insert: {
          attachment_id?: string
          created_at?: string
          extracted_text_ciphertext: string
          extracted_text_iv: string
          extracted_text_tag: string
          extracted_text_truncated?: boolean
          extraction_method: "pdf_text" | "image_ocr"
          file_id: string
          file_size_bytes: number
          key_version?: string
          message_id: string
          patient_id: string
          session_id: string
        }
        Update: {
          attachment_id?: string
          created_at?: string
          extracted_text_ciphertext?: string
          extracted_text_iv?: string
          extracted_text_tag?: string
          extracted_text_truncated?: boolean
          extraction_method?: "pdf_text" | "image_ocr"
          file_id?: string
          file_size_bytes?: number
          key_version?: string
          message_id?: string
          patient_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_message_attachments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "secure_files"
            referencedColumns: ["file_id"]
          },
          {
            foreignKeyName: "ai_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "ai_message_attachments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "ai_message_attachments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      ai_sessions: {
        Row: {
          created_at: string
          end_reason: string | null
          ended_at: string | null
          key_version: string
          patient_id: string
          session_id: string
          session_title_ciphertext: string | null
          session_title_iv: string | null
          session_title_tag: string | null
          summary_generated_at: string | null
          summary_generation_status: "pending" | "generating" | "completed" | "failed"
          summary_text_ciphertext: string | null
          summary_text_iv: string | null
          summary_text_tag: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          key_version?: string
          patient_id: string
          session_id?: string
          session_title_ciphertext?: string | null
          session_title_iv?: string | null
          session_title_tag?: string | null
          summary_generated_at?: string | null
          summary_generation_status?: "pending" | "generating" | "completed" | "failed"
          summary_text_ciphertext?: string | null
          summary_text_iv?: string | null
          summary_text_tag?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          key_version?: string
          patient_id?: string
          session_id?: string
          session_title_ciphertext?: string | null
          session_title_iv?: string | null
          session_title_tag?: string | null
          summary_generated_at?: string | null
          summary_generation_status?: "pending" | "generating" | "completed" | "failed"
          summary_text_ciphertext?: string | null
          summary_text_iv?: string | null
          summary_text_tag?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          access_status: string
          action: string
          actor_auth_user_id: string
          actor_role: string
          audit_event_hash: string
          blockchain_last_error: string | null
          blockchain_status: string
          blockchain_tx_hash: string | null
          created_at: string
          doctor_id: string | null
          ip_address: unknown
          log_id: string
          patient_id: string | null
          reason: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          access_status: string
          action: string
          actor_auth_user_id: string
          actor_role: string
          audit_event_hash: string
          blockchain_last_error?: string | null
          blockchain_status?: string
          blockchain_tx_hash?: string | null
          created_at?: string
          doctor_id?: string | null
          ip_address?: unknown
          log_id?: string
          patient_id?: string | null
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          access_status?: string
          action?: string
          actor_auth_user_id?: string
          actor_role?: string
          audit_event_hash?: string
          blockchain_last_error?: string | null
          blockchain_status?: string
          blockchain_tx_hash?: string | null
          created_at?: string
          doctor_id?: string | null
          ip_address?: unknown
          log_id?: string
          patient_id?: string | null
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "audit_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
        ]
      }
      doctor_kyc_documents: {
        Row: {
          created_at: string
          doctor_id: string
          document_id: string
          document_type: string
          file_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          document_id?: string
          document_type: string
          file_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          document_id?: string
          document_type?: string
          file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_kyc_documents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "doctor_kyc_documents_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "secure_files"
            referencedColumns: ["file_id"]
          },
        ]
      }
      doctors: {
        Row: {
          account_status: string
          age_years: number | null
          auth_user_id: string
          created_at: string
          doctor_access_code: string | null
          doctor_id: string
          email: string
          gender: string | null
          full_name: string
          onboarding_completed_at: string | null
          onboarding_step: string
          phone_number: string | null
          qr_code_token: string | null
          rejection_reason: string | null
          specialization: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_status?: string
          age_years?: number | null
          auth_user_id: string
          created_at?: string
          doctor_access_code?: string | null
          doctor_id?: string
          email: string
          gender?: string | null
          full_name: string
          onboarding_completed_at?: string | null
          onboarding_step?: string
          phone_number?: string | null
          qr_code_token?: string | null
          rejection_reason?: string | null
          specialization?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_status?: string
          age_years?: number | null
          auth_user_id?: string
          created_at?: string
          doctor_access_code?: string | null
          doctor_id?: string
          email?: string
          gender?: string | null
          full_name?: string
          onboarding_completed_at?: string | null
          onboarding_step?: string
          phone_number?: string | null
          qr_code_token?: string | null
          rejection_reason?: string | null
          specialization?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "medical_admins"
            referencedColumns: ["admin_id"]
          },
        ]
      }
      medical_admins: {
        Row: {
          admin_id: string
          auth_user_id: string
          created_at: string
          email: string
          full_name: string
        }
        Insert: {
          admin_id?: string
          auth_user_id: string
          created_at?: string
          email: string
          full_name: string
        }
        Update: {
          admin_id?: string
          auth_user_id?: string
          created_at?: string
          email?: string
          full_name?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          auth_user_id: string
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          key_version: string
          onboarding_completed_at: string | null
          onboarding_step: string
          patient_id: string
          profiling_data_ciphertext: string | null
          profiling_data_iv: string | null
          profiling_data_tag: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          key_version?: string
          onboarding_completed_at?: string | null
          onboarding_step?: string
          patient_id?: string
          profiling_data_ciphertext?: string | null
          profiling_data_iv?: string | null
          profiling_data_tag?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          key_version?: string
          onboarding_completed_at?: string | null
          onboarding_step?: string
          patient_id?: string
          profiling_data_ciphertext?: string | null
          profiling_data_iv?: string | null
          profiling_data_tag?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scope_1_medical_records: {
        Row: {
          amends_record_id: string | null
          attachment_file_id: string | null
          blockchain_last_error: string | null
          blockchain_status: string
          blockchain_tx_hash: string | null
          created_at: string
          description_ciphertext: string | null
          description_iv: string | null
          description_tag: string | null
          doctor_id: string
          key_version: string
          patient_id: string
          record_hash: string
          record_id: string
          record_type_ciphertext: string
          record_type_iv: string
          record_type_tag: string
          title_ciphertext: string
          title_iv: string
          title_tag: string
        }
        Insert: {
          amends_record_id?: string | null
          attachment_file_id?: string | null
          blockchain_last_error?: string | null
          blockchain_status?: string
          blockchain_tx_hash?: string | null
          created_at?: string
          description_ciphertext?: string | null
          description_iv?: string | null
          description_tag?: string | null
          doctor_id: string
          key_version?: string
          patient_id: string
          record_hash: string
          record_id?: string
          record_type_ciphertext: string
          record_type_iv: string
          record_type_tag: string
          title_ciphertext: string
          title_iv: string
          title_tag: string
        }
        Update: {
          amends_record_id?: string | null
          attachment_file_id?: string | null
          blockchain_last_error?: string | null
          blockchain_status?: string
          blockchain_tx_hash?: string | null
          created_at?: string
          description_ciphertext?: string | null
          description_iv?: string | null
          description_tag?: string | null
          doctor_id?: string
          key_version?: string
          patient_id?: string
          record_hash?: string
          record_id?: string
          record_type_ciphertext?: string
          record_type_iv?: string
          record_type_tag?: string
          title_ciphertext?: string
          title_iv?: string
          title_tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "scope_1_medical_records_amends_record_id_fkey"
            columns: ["amends_record_id"]
            isOneToOne: false
            referencedRelation: "scope_1_medical_records"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "scope_1_medical_records_attachment_file_id_fkey"
            columns: ["attachment_file_id"]
            isOneToOne: false
            referencedRelation: "secure_files"
            referencedColumns: ["file_id"]
          },
          {
            foreignKeyName: "scope_1_medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "scope_1_medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
        ]
      }
      scope_2_mental: {
        Row: {
          ai_model: string | null
          anxiety_level_ciphertext: string | null
          anxiety_level_iv: string | null
          anxiety_level_tag: string | null
          created_at: string
          extraction_confidence_ciphertext: string | null
          extraction_confidence_iv: string | null
          extraction_confidence_tag: string | null
          is_emergency_flagged_ciphertext: string
          is_emergency_flagged_iv: string
          is_emergency_flagged_tag: string
          key_version: string
          log_date: string
          log_id: string
          mood_score_ciphertext: string | null
          mood_score_iv: string | null
          mood_score_tag: string | null
          patient_id: string
          raw_extraction_jsonb_ciphertext: string | null
          raw_extraction_jsonb_iv: string | null
          raw_extraction_jsonb_tag: string | null
          raw_quote_ciphertext: string
          raw_quote_hash: string | null
          raw_quote_iv: string
          raw_quote_tag: string
          schema_version: string
          session_id: string
          sleep_hours_ciphertext: string | null
          sleep_hours_iv: string | null
          sleep_hours_tag: string | null
          trigger_notes_ciphertext: string | null
          trigger_notes_iv: string | null
          trigger_notes_tag: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          anxiety_level_ciphertext?: string | null
          anxiety_level_iv?: string | null
          anxiety_level_tag?: string | null
          created_at?: string
          extraction_confidence_ciphertext?: string | null
          extraction_confidence_iv?: string | null
          extraction_confidence_tag?: string | null
          is_emergency_flagged_ciphertext: string
          is_emergency_flagged_iv: string
          is_emergency_flagged_tag: string
          key_version?: string
          log_date: string
          log_id?: string
          mood_score_ciphertext?: string | null
          mood_score_iv?: string | null
          mood_score_tag?: string | null
          patient_id: string
          raw_extraction_jsonb_ciphertext?: string | null
          raw_extraction_jsonb_iv?: string | null
          raw_extraction_jsonb_tag?: string | null
          raw_quote_ciphertext: string
          raw_quote_hash?: string | null
          raw_quote_iv: string
          raw_quote_tag: string
          schema_version?: string
          session_id: string
          sleep_hours_ciphertext?: string | null
          sleep_hours_iv?: string | null
          sleep_hours_tag?: string | null
          trigger_notes_ciphertext?: string | null
          trigger_notes_iv?: string | null
          trigger_notes_tag?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          anxiety_level_ciphertext?: string | null
          anxiety_level_iv?: string | null
          anxiety_level_tag?: string | null
          created_at?: string
          extraction_confidence_ciphertext?: string | null
          extraction_confidence_iv?: string | null
          extraction_confidence_tag?: string | null
          is_emergency_flagged_ciphertext?: string
          is_emergency_flagged_iv?: string
          is_emergency_flagged_tag?: string
          key_version?: string
          log_date?: string
          log_id?: string
          mood_score_ciphertext?: string | null
          mood_score_iv?: string | null
          mood_score_tag?: string | null
          patient_id?: string
          raw_extraction_jsonb_ciphertext?: string | null
          raw_extraction_jsonb_iv?: string | null
          raw_extraction_jsonb_tag?: string | null
          raw_quote_ciphertext?: string
          raw_quote_hash?: string | null
          raw_quote_iv?: string
          raw_quote_tag?: string
          schema_version?: string
          session_id?: string
          sleep_hours_ciphertext?: string | null
          sleep_hours_iv?: string | null
          sleep_hours_tag?: string | null
          trigger_notes_ciphertext?: string | null
          trigger_notes_iv?: string | null
          trigger_notes_tag?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scope_2_mental_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "scope_2_mental_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "ai_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      scope_2_physical: {
        Row: {
          ai_model: string | null
          body_location_ciphertext: string | null
          body_location_iv: string | null
          body_location_tag: string | null
          created_at: string
          duration_note_ciphertext: string | null
          duration_note_iv: string | null
          duration_note_tag: string | null
          extraction_confidence_ciphertext: string | null
          extraction_confidence_iv: string | null
          extraction_confidence_tag: string | null
          is_emergency_flagged_ciphertext: string
          is_emergency_flagged_iv: string
          is_emergency_flagged_tag: string
          key_version: string
          log_date: string
          log_id: string
          patient_id: string
          raw_extraction_jsonb_ciphertext: string | null
          raw_extraction_jsonb_iv: string | null
          raw_extraction_jsonb_tag: string | null
          raw_quote_ciphertext: string
          raw_quote_hash: string
          raw_quote_iv: string
          raw_quote_tag: string
          schema_version: string
          session_id: string
          severity_ciphertext: string | null
          severity_iv: string | null
          severity_tag: string | null
          symptom_type_ciphertext: string | null
          symptom_type_iv: string | null
          symptom_type_tag: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          body_location_ciphertext?: string | null
          body_location_iv?: string | null
          body_location_tag?: string | null
          created_at?: string
          duration_note_ciphertext?: string | null
          duration_note_iv?: string | null
          duration_note_tag?: string | null
          extraction_confidence_ciphertext?: string | null
          extraction_confidence_iv?: string | null
          extraction_confidence_tag?: string | null
          is_emergency_flagged_ciphertext: string
          is_emergency_flagged_iv: string
          is_emergency_flagged_tag: string
          key_version?: string
          log_date: string
          log_id?: string
          patient_id: string
          raw_extraction_jsonb_ciphertext?: string | null
          raw_extraction_jsonb_iv?: string | null
          raw_extraction_jsonb_tag?: string | null
          raw_quote_ciphertext: string
          raw_quote_hash: string
          raw_quote_iv: string
          raw_quote_tag: string
          schema_version?: string
          session_id: string
          severity_ciphertext?: string | null
          severity_iv?: string | null
          severity_tag?: string | null
          symptom_type_ciphertext?: string | null
          symptom_type_iv?: string | null
          symptom_type_tag?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          body_location_ciphertext?: string | null
          body_location_iv?: string | null
          body_location_tag?: string | null
          created_at?: string
          duration_note_ciphertext?: string | null
          duration_note_iv?: string | null
          duration_note_tag?: string | null
          extraction_confidence_ciphertext?: string | null
          extraction_confidence_iv?: string | null
          extraction_confidence_tag?: string | null
          is_emergency_flagged_ciphertext?: string
          is_emergency_flagged_iv?: string
          is_emergency_flagged_tag?: string
          key_version?: string
          log_date?: string
          log_id?: string
          patient_id?: string
          raw_extraction_jsonb_ciphertext?: string | null
          raw_extraction_jsonb_iv?: string | null
          raw_extraction_jsonb_tag?: string | null
          raw_quote_ciphertext?: string
          raw_quote_hash?: string
          raw_quote_iv?: string
          raw_quote_tag?: string
          schema_version?: string
          session_id?: string
          severity_ciphertext?: string | null
          severity_iv?: string | null
          severity_tag?: string | null
          symptom_type_ciphertext?: string | null
          symptom_type_iv?: string | null
          symptom_type_tag?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scope_2_physical_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "scope_2_physical_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      secure_files: {
        Row: {
          bucket_name: string
          created_at: string
          file_id: string
          file_sha256: string
          file_size_bytes: number
          key_version: string
          mime_type: string
          object_path: string
          original_filename_ciphertext: string
          original_filename_iv: string
          original_filename_tag: string
          owner_id: string
          owner_role: string
        }
        Insert: {
          bucket_name: string
          created_at?: string
          file_id?: string
          file_sha256: string
          file_size_bytes: number
          key_version?: string
          mime_type: string
          object_path: string
          original_filename_ciphertext: string
          original_filename_iv: string
          original_filename_tag: string
          owner_id: string
          owner_role: string
        }
        Update: {
          bucket_name?: string
          created_at?: string
          file_id?: string
          file_sha256?: string
          file_size_bytes?: number
          key_version?: string
          mime_type?: string
          object_path?: string
          original_filename_ciphertext?: string
          original_filename_iv?: string
          original_filename_tag?: string
          owner_id?: string
          owner_role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_blockchain_proofs: {
        Args: {
          batch_limit?: number
          target_proof_type: string
        }
        Returns: {
          action: string | null
          actor_auth_user_id: string | null
          blockchain_tx_hash: string | null
          doctor_id: string | null
          expires_at: string | null
          id: string
          is_revoked: boolean | null
          patient_id: string | null
          proof_hash: string
          proof_type: string
          target_id: string | null
        }[]
      }
      replace_active_access_grant: {
        Args: {
          allow_download_attachments: boolean
          allow_scope1: boolean
          allow_scope2_mental: boolean
          allow_scope2_physical: boolean
          target_consent_hash: string
          target_doctor_id: string
          target_expires_at: string
          target_patient_id: string
        }
        Returns: {
          blockchain_last_error: string | null
          blockchain_status: string
          blockchain_tx_hash: string | null
          can_download_attachments: boolean
          can_view_scope1: boolean
          can_view_scope2_mental: boolean
          can_view_scope2_physical: boolean
          consent_hash: string
          created_at: string
          doctor_id: string
          expires_at: string
          grant_id: string
          granted_at: string
          is_revoked: boolean
          patient_id: string
          replaced_by_grant_id: string | null
          revoked_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "access_grants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      replace_active_access_grant_v2: {
        Args: {
          allow_download_attachments: boolean
          allow_scope1: boolean
          allow_scope2_mental: boolean
          allow_scope2_physical: boolean
          prior_replacement_consent_hash: string | null
          target_audit_event_hash: string
          target_audit_log_id: string
          target_consent_hash: string
          target_doctor_id: string
          target_expires_at: string
          target_grant_id: string
          target_granted_at: string
          target_ip_address?: unknown | null
          target_patient_id: string
        }
        Returns: {
          blockchain_last_error: string | null
          blockchain_status: string
          blockchain_tx_hash: string | null
          can_download_attachments: boolean
          can_view_scope1: boolean
          can_view_scope2_mental: boolean
          can_view_scope2_physical: boolean
          consent_hash: string
          created_at: string
          doctor_id: string
          expires_at: string
          grant_id: string
          granted_at: string
          is_revoked: boolean
          patient_id: string
          replaced_by_grant_id: string | null
          revoked_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "access_grants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_active_access_grant: {
        Args: {
          target_audit_event_hash: string
          target_audit_log_id: string
          target_consent_hash: string
          target_grant_id: string
          target_ip_address?: unknown | null
          target_patient_id: string
          target_revoked_at: string
        }
        Returns: {
          blockchain_last_error: string | null
          blockchain_status: string
          blockchain_tx_hash: string | null
          can_download_attachments: boolean
          can_view_scope1: boolean
          can_view_scope2_mental: boolean
          can_view_scope2_physical: boolean
          consent_hash: string
          created_at: string
          doctor_id: string
          expires_at: string
          grant_id: string
          granted_at: string
          is_revoked: boolean
          patient_id: string
          replaced_by_grant_id: string | null
          revoked_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "access_grants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
