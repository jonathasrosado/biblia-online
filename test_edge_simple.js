import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

(async () => {
    try {
        const tts = new MsEdgeTTS();

        if (typeof tts.toStream === 'function') {
            console.log("SUCCESS: toStream exists!");
        } else {
            console.log("FAILURE: toStream does NOT exist.");
            console.log("Keys:", Object.keys(tts));
            console.log("Proto Keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(tts)));
        }

    } catch (e) {
        console.error("Error:", e);
    }
})();
