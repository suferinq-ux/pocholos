import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gogrqgkzqnhfzpwsohsd.supabase.co';
const supabaseKey = 'sb_publishable_z-gj2LWuk3pgSfM6d3aFRA_pOOIeoIV';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllSales() {
  const { data, error } = await supabase
    .from('ventas')
    .select('id, created_at, tipo_comprobante')
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log("Found:", data ? data.length : 0);
  console.log(data);
}

getAllSales();
