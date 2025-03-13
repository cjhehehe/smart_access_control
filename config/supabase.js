// backend/config/supabase.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve .env from one level up (backend/.env)
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: Missing Supabase credentials in .env file!");
  process.exit(1);
}

// Polyfill global fetch if not already available
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

console.log("\nSupabase client initialized successfully!");

// Explicitly pass fetch to the Supabase client options
const supabase = createClient(supabaseUrl, supabaseKey, { fetch: globalThis.fetch });

export default supabase;
