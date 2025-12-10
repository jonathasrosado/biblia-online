import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
const opus = Object.keys(OUTPUT_FORMAT).filter(k => k.includes("OPUS"));
console.log(opus);
