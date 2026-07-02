import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://vhiqhjljmxiarcikggoc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoaXFoamxqbXhpYXJjaWtnZ29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5ODM0OTEsImV4cCI6MjA5ODU1OTQ5MX0.pXlj_UUP16Syv3XwVl_LRlIgsCp0j3oYQKMYwZZ-jEw"
);
