import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

console.log("MsEdgeTTS:", MsEdgeTTS);
console.log("OUTPUT_FORMAT:", OUTPUT_FORMAT);

try {
    const tts = new MsEdgeTTS();
    console.log("Instance created successfully");
} catch (e) {
    console.error("Instance creation failed:", e);
}
