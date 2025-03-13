// backend/config/supabase.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve .env from one level up (backend/.env)
const envPath = path.resolve(__dirname, '../.env');

// Load environment variables without logging sensitive data
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: Missing Supabase credentials in .env file!");
  process.exit(1);
}

console.log("\nSupabase client initialized successfully!");

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
