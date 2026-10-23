
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "app_owner": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"catalog_items": {
                  Row: {
                    "active": boolean,"base_price": number | null,"category": string,"created_at": string,"description": string | null,"filament_id": string | null,"grams": number | null,"id": string,"name": string,"photo_path": string | null,"post_hours": number | null,"print_minutes": number | null,"site_slug": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"base_price"?: number | null,"category": string,"created_at"?: string,"description"?: string | null,"filament_id"?: string | null,"grams"?: number | null,"id"?: string,"name": string,"photo_path"?: string | null,"post_hours"?: number | null,"print_minutes"?: number | null,"site_slug"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"base_price"?: number | null,"category"?: string,"created_at"?: string,"description"?: string | null,"filament_id"?: string | null,"grams"?: number | null,"id"?: string,"name"?: string,"photo_path"?: string | null,"post_hours"?: number | null,"print_minutes"?: number | null,"site_slug"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "catalog_items_filament_id_fkey"
      columns: ["filament_id"]
isOneToOne: false
      referencedRelation: "filaments"
      referencedColumns: ["id"]
    }
                  ]
                },"customers": {
                  Row: {
                    "city": string | null,"created_at": string,"id": string,"instagram": string | null,"name": string,"notes": string | null,"origin": string | null,"updated_at": string,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "city"?: string | null,"created_at"?: string,"id"?: string,"instagram"?: string | null,"name": string,"notes"?: string | null,"origin"?: string | null,"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Update: {
                    "city"?: string | null,"created_at"?: string,"id"?: string,"instagram"?: string | null,"name"?: string,"notes"?: string | null,"origin"?: string | null,"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"failures": {
                  Row: {
                    "created_at": string,"filament_id": string | null,"grams_lost": number,"id": string,"minutes_lost": number,"occurred_at": string,"order_id": string | null,"print_job_id": string | null,"printer_id": string | null,"reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"filament_id"?: string | null,"grams_lost"?: number,"id"?: string,"minutes_lost"?: number,"occurred_at"?: string,"order_id"?: string | null,"print_job_id"?: string | null,"printer_id"?: string | null,"reason"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"filament_id"?: string | null,"grams_lost"?: number,"id"?: string,"minutes_lost"?: number,"occurred_at"?: string,"order_id"?: string | null,"print_job_id"?: string | null,"printer_id"?: string | null,"reason"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "failures_filament_id_fkey"
      columns: ["filament_id"]
isOneToOne: false
      referencedRelation: "filaments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "failures_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "failures_print_job_id_fkey"
      columns: ["print_job_id"]
isOneToOne: false
      referencedRelation: "print_jobs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "failures_printer_id_fkey"
      columns: ["printer_id"]
isOneToOne: false
      referencedRelation: "printers"
      referencedColumns: ["id"]
    }
                  ]
                },"filaments": {
                  Row: {
                    "archived": boolean,"brand": string,"color_hex": string,"color_name": string,"cost_per_g": number | null,"created_at": string,"id": string,"initial_weight_g": number,"material": string,"min_stock_g": number | null,"notes": string | null,"price_paid": number,"purchased_at": string | null,"remaining_g": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived"?: boolean,"brand": string,"color_hex"?: string,"color_name": string,"cost_per_g"?: never,"created_at"?: string,"id"?: string,"initial_weight_g": number,"material": string,"min_stock_g"?: number | null,"notes"?: string | null,"price_paid": number,"purchased_at"?: string | null,"remaining_g": number,"updated_at"?: string
                  }
                  Update: {
                    "archived"?: boolean,"brand"?: string,"color_hex"?: string,"color_name"?: string,"cost_per_g"?: never,"created_at"?: string,"id"?: string,"initial_weight_g"?: number,"material"?: string,"min_stock_g"?: number | null,"notes"?: string | null,"price_paid"?: number,"purchased_at"?: string | null,"remaining_g"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"models": {
                  Row: {
                    "area_cm2": number | null,"catalog_item_id": string | null,"created_at": string,"customer_id": string | null,"file_name": string,"file_path": string,"file_size": number | null,"format": string,"id": string,"name": string,"notes": string | null,"order_id": string | null,"parts": number | null,"plates": NonNullable<Json>,"size_x_mm": number | null,"size_y_mm": number | null,"size_z_mm": number | null,"thumbnail_path": string | null,"triangles": number | null,"updated_at": string,"volume_cm3": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "area_cm2"?: number | null,"catalog_item_id"?: string | null,"created_at"?: string,"customer_id"?: string | null,"file_name": string,"file_path": string,"file_size"?: number | null,"format": string,"id"?: string,"name": string,"notes"?: string | null,"order_id"?: string | null,"parts"?: number | null,"plates"?: NonNullable<Json>,"size_x_mm"?: number | null,"size_y_mm"?: number | null,"size_z_mm"?: number | null,"thumbnail_path"?: string | null,"triangles"?: number | null,"updated_at"?: string,"volume_cm3"?: number | null
                  }
                  Update: {
                    "area_cm2"?: number | null,"catalog_item_id"?: string | null,"created_at"?: string,"customer_id"?: string | null,"file_name"?: string,"file_path"?: string,"file_size"?: number | null,"format"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"order_id"?: string | null,"parts"?: number | null,"plates"?: NonNullable<Json>,"size_x_mm"?: number | null,"size_y_mm"?: number | null,"size_z_mm"?: number | null,"thumbnail_path"?: string | null,"triangles"?: number | null,"updated_at"?: string,"volume_cm3"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "models_catalog_item_id_fkey"
      columns: ["catalog_item_id"]
isOneToOne: false
      referencedRelation: "catalog_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "models_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customer_stats"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "models_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "models_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_events": {
                  Row: {
                    "created_at": string,"from_status": string | null,"id": string,"note": string | null,"order_id": string,"to_status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"from_status"?: string | null,"id"?: string,"note"?: string | null,"order_id": string,"to_status": string
                  }
                  Update: {
                    "created_at"?: string,"from_status"?: string | null,"id"?: string,"note"?: string | null,"order_id"?: string,"to_status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_events_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "calculated_unit_price": number,"catalog_item_id": string | null,"category": string | null,"created_at": string,"description": string,"energy_cost": number,"extras": NonNullable<Json>,"extras_total": number,"filament_id": string | null,"grams": number,"id": string,"labor_cost": number,"line_total": number | null,"machine_cost": number,"material_cost": number,"order_id": string,"override_unit_price": number | null,"params": NonNullable<Json>,"position": number,"post_hours": number,"print_minutes": number,"printer_id": string | null,"quantity": number,"unit_price": number | null,"urgent": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "calculated_unit_price"?: number,"catalog_item_id"?: string | null,"category"?: string | null,"created_at"?: string,"description": string,"energy_cost"?: number,"extras"?: NonNullable<Json>,"extras_total"?: number,"filament_id"?: string | null,"grams"?: number,"id"?: string,"labor_cost"?: number,"line_total"?: never,"machine_cost"?: number,"material_cost"?: number,"order_id": string,"override_unit_price"?: number | null,"params"?: NonNullable<Json>,"position"?: number,"post_hours"?: number,"print_minutes"?: number,"printer_id"?: string | null,"quantity"?: number,"unit_price"?: never,"urgent"?: boolean
                  }
                  Update: {
                    "calculated_unit_price"?: number,"catalog_item_id"?: string | null,"category"?: string | null,"created_at"?: string,"description"?: string,"energy_cost"?: number,"extras"?: NonNullable<Json>,"extras_total"?: number,"filament_id"?: string | null,"grams"?: number,"id"?: string,"labor_cost"?: number,"line_total"?: never,"machine_cost"?: number,"material_cost"?: number,"order_id"?: string,"override_unit_price"?: number | null,"params"?: NonNullable<Json>,"position"?: number,"post_hours"?: number,"print_minutes"?: number,"printer_id"?: string | null,"quantity"?: number,"unit_price"?: never,"urgent"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_catalog_item_id_fkey"
      columns: ["catalog_item_id"]
isOneToOne: false
      referencedRelation: "catalog_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_filament_id_fkey"
      columns: ["filament_id"]
isOneToOne: false
      referencedRelation: "filaments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_printer_id_fkey"
      columns: ["printer_id"]
isOneToOne: false
      referencedRelation: "printers"
      referencedColumns: ["id"]
    }
                  ]
                },"order_photos": {
                  Row: {
                    "created_at": string,"id": string,"order_id": string,"path": string,"show_to_customer": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"order_id": string,"path": string,"show_to_customer"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"order_id"?: string,"path"?: string,"show_to_customer"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_photos_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "created_at": string,"customer_id": string | null,"delivered_at": string | null,"delivery_fee": number,"delivery_method": string | null,"due_date": string | null,"id": string,"items_total": number,"notes": string | null,"number": number,"paid_total": number,"payment_method": string | null,"public_token": string,"quote_id": string | null,"status": string,"status_changed_at": string,"total": number | null,"tracking_code": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_id"?: string | null,"delivered_at"?: string | null,"delivery_fee"?: number,"delivery_method"?: string | null,"due_date"?: string | null,"id"?: string,"items_total"?: number,"notes"?: string | null,"number"?: number,"paid_total"?: number,"payment_method"?: string | null,"public_token"?: string,"quote_id"?: string | null,"status"?: string,"status_changed_at"?: string,"total"?: never,"tracking_code"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"customer_id"?: string | null,"delivered_at"?: string | null,"delivery_fee"?: number,"delivery_method"?: string | null,"due_date"?: string | null,"id"?: string,"items_total"?: number,"notes"?: string | null,"number"?: number,"paid_total"?: number,"payment_method"?: string | null,"public_token"?: string,"quote_id"?: string | null,"status"?: string,"status_changed_at"?: string,"total"?: never,"tracking_code"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customer_stats"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "orders_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: true
      referencedRelation: "quotes"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount": number,"created_at": string,"id": string,"kind": string,"method": string,"notes": string | null,"order_id": string,"paid_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"id"?: string,"kind"?: string,"method": string,"notes"?: string | null,"order_id": string,"paid_at"?: string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"id"?: string,"kind"?: string,"method"?: string,"notes"?: string | null,"order_id"?: string,"paid_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"print_jobs": {
                  Row: {
                    "created_at": string,"deducted_g": number | null,"filament_id": string | null,"finished_at": string | null,"grams": number,"id": string,"meta": NonNullable<Json>,"model_id": string | null,"order_id": string | null,"order_item_id": string | null,"plate_index": number | null,"position": number,"print_minutes": number,"printer_id": string | null,"source": string,"source_file_path": string | null,"started_at": string | null,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deducted_g"?: number | null,"filament_id"?: string | null,"finished_at"?: string | null,"grams"?: number,"id"?: string,"meta"?: NonNullable<Json>,"model_id"?: string | null,"order_id"?: string | null,"order_item_id"?: string | null,"plate_index"?: number | null,"position"?: number,"print_minutes"?: number,"printer_id"?: string | null,"source"?: string,"source_file_path"?: string | null,"started_at"?: string | null,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deducted_g"?: number | null,"filament_id"?: string | null,"finished_at"?: string | null,"grams"?: number,"id"?: string,"meta"?: NonNullable<Json>,"model_id"?: string | null,"order_id"?: string | null,"order_item_id"?: string | null,"plate_index"?: number | null,"position"?: number,"print_minutes"?: number,"printer_id"?: string | null,"source"?: string,"source_file_path"?: string | null,"started_at"?: string | null,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "print_jobs_filament_id_fkey"
      columns: ["filament_id"]
isOneToOne: false
      referencedRelation: "filaments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "print_jobs_model_id_fkey"
      columns: ["model_id"]
isOneToOne: false
      referencedRelation: "models"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "print_jobs_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "print_jobs_order_item_id_fkey"
      columns: ["order_item_id"]
isOneToOne: false
      referencedRelation: "order_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "print_jobs_printer_id_fkey"
      columns: ["printer_id"]
isOneToOne: false
      referencedRelation: "printers"
      referencedColumns: ["id"]
    }
                  ]
                },"printers": {
                  Row: {
                    "active": boolean,"bed_x_mm": number | null,"bed_y_mm": number | null,"bed_z_mm": number | null,"created_at": string,"id": string,"model": string | null,"name": string,"power_kw": number | null,"updated_at": string,"wear_per_hour": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"bed_x_mm"?: number | null,"bed_y_mm"?: number | null,"bed_z_mm"?: number | null,"created_at"?: string,"id"?: string,"model"?: string | null,"name": string,"power_kw"?: number | null,"updated_at"?: string,"wear_per_hour"?: number | null
                  }
                  Update: {
                    "active"?: boolean,"bed_x_mm"?: number | null,"bed_y_mm"?: number | null,"bed_z_mm"?: number | null,"created_at"?: string,"id"?: string,"model"?: string | null,"name"?: string,"power_kw"?: number | null,"updated_at"?: string,"wear_per_hour"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"quote_items": {
                  Row: {
                    "calculated_unit_price": number,"catalog_item_id": string | null,"category": string | null,"created_at": string,"description": string,"energy_cost": number,"extras": NonNullable<Json>,"extras_total": number,"filament_id": string | null,"grams": number,"id": string,"labor_cost": number,"line_total": number | null,"machine_cost": number,"material_cost": number,"override_unit_price": number | null,"params": NonNullable<Json>,"position": number,"post_hours": number,"print_minutes": number,"printer_id": string | null,"quantity": number,"quote_id": string,"unit_price": number | null,"urgent": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "calculated_unit_price"?: number,"catalog_item_id"?: string | null,"category"?: string | null,"created_at"?: string,"description": string,"energy_cost"?: number,"extras"?: NonNullable<Json>,"extras_total"?: number,"filament_id"?: string | null,"grams": number,"id"?: string,"labor_cost"?: number,"line_total"?: never,"machine_cost"?: number,"material_cost"?: number,"override_unit_price"?: number | null,"params"?: NonNullable<Json>,"position"?: number,"post_hours"?: number,"print_minutes": number,"printer_id"?: string | null,"quantity"?: number,"quote_id": string,"unit_price"?: never,"urgent"?: boolean
                  }
                  Update: {
                    "calculated_unit_price"?: number,"catalog_item_id"?: string | null,"category"?: string | null,"created_at"?: string,"description"?: string,"energy_cost"?: number,"extras"?: NonNullable<Json>,"extras_total"?: number,"filament_id"?: string | null,"grams"?: number,"id"?: string,"labor_cost"?: number,"line_total"?: never,"machine_cost"?: number,"material_cost"?: number,"override_unit_price"?: number | null,"params"?: NonNullable<Json>,"position"?: number,"post_hours"?: number,"print_minutes"?: number,"printer_id"?: string | null,"quantity"?: number,"quote_id"?: string,"unit_price"?: never,"urgent"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "quote_items_catalog_item_id_fkey"
      columns: ["catalog_item_id"]
isOneToOne: false
      referencedRelation: "catalog_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_items_filament_id_fkey"
      columns: ["filament_id"]
isOneToOne: false
      referencedRelation: "filaments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_items_printer_id_fkey"
      columns: ["printer_id"]
isOneToOne: false
      referencedRelation: "printers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_items_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "quotes"
      referencedColumns: ["id"]
    }
                  ]
                },"quotes": {
                  Row: {
                    "approved_at": string | null,"approved_via": string | null,"client_viewed_at": string | null,"created_at": string,"customer_id": string | null,"delivery_fee": number,"id": string,"internal_notes": string | null,"items_total": number,"notes": string | null,"number": number,"public_token": string,"sent_at": string | null,"status": string,"total": number | null,"updated_at": string,"valid_until": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"approved_via"?: string | null,"client_viewed_at"?: string | null,"created_at"?: string,"customer_id"?: string | null,"delivery_fee"?: number,"id"?: string,"internal_notes"?: string | null,"items_total"?: number,"notes"?: string | null,"number"?: number,"public_token"?: string,"sent_at"?: string | null,"status"?: string,"total"?: never,"updated_at"?: string,"valid_until"?: string | null
                  }
                  Update: {
                    "approved_at"?: string | null,"approved_via"?: string | null,"client_viewed_at"?: string | null,"created_at"?: string,"customer_id"?: string | null,"delivery_fee"?: number,"id"?: string,"internal_notes"?: string | null,"items_total"?: number,"notes"?: string | null,"number"?: number,"public_token"?: string,"sent_at"?: string | null,"status"?: string,"total"?: never,"updated_at"?: string,"valid_until"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "quotes_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customer_stats"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "quotes_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"settings": {
                  Row: {
                    "business_instagram": string | null,"business_name": string,"business_whatsapp": string | null,"default_printer_id": string | null,"energy_tariff": number | null,"failure_rate_pct": number | null,"id": number,"labor_rate": number | null,"last_backup_at": string | null,"low_stock_default_g": number | null,"margin_pct": number | null,"message_templates": NonNullable<Json>,"quote_validity_days": number | null,"rounding": string | null,"updated_at": string,"urgency_pct": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_instagram"?: string | null,"business_name"?: string,"business_whatsapp"?: string | null,"default_printer_id"?: string | null,"energy_tariff"?: number | null,"failure_rate_pct"?: number | null,"id"?: number,"labor_rate"?: number | null,"last_backup_at"?: string | null,"low_stock_default_g"?: number | null,"margin_pct"?: number | null,"message_templates"?: NonNullable<Json>,"quote_validity_days"?: number | null,"rounding"?: string | null,"updated_at"?: string,"urgency_pct"?: number | null
                  }
                  Update: {
                    "business_instagram"?: string | null,"business_name"?: string,"business_whatsapp"?: string | null,"default_printer_id"?: string | null,"energy_tariff"?: number | null,"failure_rate_pct"?: number | null,"id"?: number,"labor_rate"?: number | null,"last_backup_at"?: string | null,"low_stock_default_g"?: number | null,"margin_pct"?: number | null,"message_templates"?: NonNullable<Json>,"quote_validity_days"?: number | null,"rounding"?: string | null,"updated_at"?: string,"urgency_pct"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "settings_default_printer_fk"
      columns: ["default_printer_id"]
isOneToOne: false
      referencedRelation: "printers"
      referencedColumns: ["id"]
    }
                  ]
                },"site_requests": {
                  Row: {
                    "created_at": string,"customer_id": string | null,"id": string,"message": string | null,"name": string | null,"payload": NonNullable<Json>,"quote_id": string | null,"status": string,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_id"?: string | null,"id"?: string,"message"?: string | null,"name"?: string | null,"payload"?: NonNullable<Json>,"quote_id"?: string | null,"status"?: string,"whatsapp"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"customer_id"?: string | null,"id"?: string,"message"?: string | null,"name"?: string | null,"payload"?: NonNullable<Json>,"quote_id"?: string | null,"status"?: string,"whatsapp"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_requests_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customer_stats"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "site_requests_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "site_requests_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "quotes"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "customer_stats": {
                  Row: {
                    "customer_id": string | null,"last_order_at": string | null,"orders_count": number | null,"total_spent": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "claim_ownership":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"complete_print_job":
{ Args: { "p_job_id": string }; Returns: undefined
                           },
"convert_quote_to_order":
{ Args: { "p_quote_id": string }; Returns: string
                           },
"fail_print_job":
{ Args: { "p_grams_lost": number,"p_job_id": string,"p_minutes_lost": number,"p_reason"?: string }; Returns: undefined
                           },
"format_doc_number":
{ Args: { "n": number }; Returns: string
                           },
"is_owner":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"public_approve_quote":
{ Args: { "p_token": string }; Returns: Json
                           },
"public_order_tracking":
{ Args: { "p_token": string }; Returns: Json
                           },
"public_quote":
{ Args: { "p_token": string }; Returns: Json
                           },
"public_quote_seen":
{ Args: { "p_token": string }; Returns: undefined
                           },
"random_token":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"reorder_print_jobs":
{ Args: { "p_ids": (string)[] }; Returns: undefined
                           },
"save_order":
{ Args: { "p_items": Json,"p_order": Json }; Returns: string
                           },
"save_quote":
{ Args: { "p_items": Json,"p_quote": Json }; Returns: string
                           },
"start_print_job":
{ Args: { "p_job_id": string }; Returns: undefined
                           },
"today_sp":
{ Args: Record<PropertyKey, never>; Returns: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
