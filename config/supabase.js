import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;  // Use the service role key

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERROR: Missing Supabase credentials in .env file!");
    console.error("SUPABASE_URL:", supabaseUrl);
    console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "Present" : "MISSING");
    process.exit(1);
}

console.log("✅ Supabase client initialized successfully!");

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
