import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gogrqgkzqnhfzpwsohsd.supabase.co';
const supabaseKey = 'sb_publishable_z-gj2LWuk3pgSfM6d3aFRA_pOOIeoIV';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findDni() {
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log("Total recent sales:", data.length);
}

findDni();
