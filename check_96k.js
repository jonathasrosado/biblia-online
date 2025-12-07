import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
console.log("Checking for 96KBITRATE...");
const k96 = Object.keys(OUTPUT_FORMAT).filter(k => k.includes("96KBITRATE"));
console.log(k96);
console.log("Checking exact match AUDIO_24KHZ_96KBITRATE_MONO_MP3:");
console.log("Exists:", !!OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
