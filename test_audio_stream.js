import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "fs";

(async () => {
    console.log("Testing Stream Logic (Mirroring api.js)...");
    const tts = new MsEdgeTTS();
    await tts.setMetadata("pt-BR-AntonioNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    // exact header match
    tts.headers = { "User-Agent": "Mozilla/5.0" };

    try {
        console.log("Requesting stream...");
        const stream = await tts.toStream("Teste de áudio com stream e headers configurados.");

        if (!stream) {
            console.error("FATAL: Stream is null");
            process.exit(1);
        }

        const chunks = [];
        stream.on('data', c => {
            process.stdout.write('.');
            chunks.push(c);
        });

        await new Promise((res, rej) => {
            stream.on('end', () => {
                console.log("\nStream ended.");
                res();
            });
            stream.on('error', (e) => {
                console.error("\nStream Error:", e);
                rej(e);
            });
        });

        const finalBuffer = Buffer.concat(chunks);
        console.log(`\nSuccess! Received ${chunks.length} chunks.`);
        console.log(`Total size: ${finalBuffer.length} bytes`);
        console.log("Base64 sample:", finalBuffer.toString('base64').substring(0, 50) + "...");

    } catch (e) {
        console.error("\nTEST FAILED:", e);
    }
})();
