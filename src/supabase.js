//supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vziaqtyfjuqhwmfqxqrv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6aWFxdHlmanVxaHdtZnF4cXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTE0MTksImV4cCI6MjA2NzI4NzQxOX0.pDEN6Jc7jDOYh-hUGxiOVIVXOCAU--2fg9U_gwgzklg';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
