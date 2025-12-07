import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

console.log("Checking for 48KHZ formats...");
const formats = Object.keys(OUTPUT_FORMAT).filter(k => k.includes("48KHZ"));
console.log(formats);
