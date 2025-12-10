import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
console.log("Checking PCM...");
const pcm = Object.keys(OUTPUT_FORMAT).filter(k => k.includes("PCM"));
console.log(pcm);
