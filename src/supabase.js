//supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://TU_PROYECTO.supabase.co';
const supabaseKey = 'TU_API_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
