import fs from 'fs';
const key = "AIzaSyDFbnQMm-z49pZrM2EFSECRKe27rVZqfhw";
const content = `GEMINI_API_KEY=${key}\n`;
fs.writeFileSync('.env.local', content, 'utf8');
console.log("Written .env.local with UTF-8");
