import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
const keys = Object.keys(OUTPUT_FORMAT);
console.log("--- 48k ---");
console.log(keys.filter(k => k.toLowerCase().includes("48k")));
console.log("--- 44k ---");
console.log(keys.filter(k => k.toLowerCase().includes("44k")));
