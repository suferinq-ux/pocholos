import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://gogrqgkzqnhfzpwsohsd.supabase.co';
const supabaseKey = 'sb_publishable_z-gj2LWuk3pgSfM6d3aFRA_pOOIeoIV';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllSales() {
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log("Total recent sales:", data.length);
  if (data.length > 0) {
    console.log("Sample columns:", Object.keys(data[0]));
    const withDni = data.filter(v => v.cliente_documento || v.cliente_dni || v.dni);
    console.log("Sales with DNI or document:", withDni.length);
    console.log("First sale:", JSON.stringify(data[0], null, 2));
  }
}

getAllSales();
