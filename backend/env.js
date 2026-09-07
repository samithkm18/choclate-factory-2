// env.js — must be the FIRST import in server.js
// In ESM, all imports are hoisted, so dotenv must be loaded via a side-effect import
import dotenv from 'dotenv';
dotenv.config();
