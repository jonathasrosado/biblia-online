import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
console.log("Checking RAW...");
const raw = Object.keys(OUTPUT_FORMAT).filter(k => k.includes("RAW"));
console.log(raw);
