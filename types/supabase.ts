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
            incidents: {
                Row: {
                    audio_url: string | null
                    confidence: number
                    created_at: string | null
                    id: string
                    latitude: number
                    longitude: number
                    status: string
                    type: string
                    unit_id: string
                }
                Insert: {
                    audio_url?: string | null
                    confidence: number
                    created_at?: string | null
                    id?: string
                    latitude: number
                    longitude: number
                    status?: string
                    type: string
                    unit_id: string
                }
                Update: {
                    audio_url?: string | null
                    confidence?: number
                    created_at?: string | null
                    id?: string
                    latitude?: number
                    longitude?: number
                    status?: string
                    type?: string
                    unit_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "incidents_unit_id_fkey"
                        columns: ["unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    }
                ]
            }
            units: {
                Row: {
                    battery: number
                    id: string
                    last_seen: string | null
                    latitude: number
                    longitude: number
                    signal_strength: string
                    status: string
                    threshold: number
                }
                Insert: {
                    battery?: number
                    id: string
                    last_seen?: string | null
                    latitude: number
                    longitude: number
                    signal_strength: string
                    status: string
                    threshold?: number
                }
                Update: {
                    battery?: number
                    id?: string
                    last_seen?: string | null
                    latitude?: number
                    longitude?: number
                    signal_strength?: string
                    status?: string
                    threshold?: number
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
