import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gogrqgkzqnhfzpwsohsd.supabase.co';
const supabaseKey = 'sb_publishable_z-gj2LWuk3pgSfM6d3aFRA_pOOIeoIV';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching ventas:', error);
  } else if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data returned, cannot infer columns.");
  }
}

checkColumns();
