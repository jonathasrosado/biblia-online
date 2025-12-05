
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from 'fs';
import path from 'path';

(async () => {
    try {
        console.log("Initializing TTS...");
        const tts = new MsEdgeTTS();

        console.log("Setting Metadata...");
        await tts.setMetadata("pt-BR-AntonioNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);

        console.log("Generating valid stream...");
        const stream = await tts.toStream("Olá, teste 123.");
        console.log("Stream Type:", typeof stream);
        console.log("Stream Constructor:", stream ? stream.constructor.name : "null");

        // Check for Node Stream
        if (typeof stream.on === 'function') {
            console.log("It IS a Node Stream.");
            // Consume it
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => console.log("Stream ended. Total size:", Buffer.concat(chunks).length));
            stream.on('error', (err) => console.error("Stream error:", err));
        }
        // Check for Web Stream
        else if (typeof stream.getReader === 'function') {
            console.log("It IS a Web Stream.");
        }
        else {
            console.log("Unknown Stream Object:", stream);
            console.log("Keys:", Object.keys(stream));

            // Try to access internal
            if (stream.stream) {
                console.log("Has stream.stream property?");
            }
        }

    } catch (e) {
        console.error("Catch Block Error:", e);
        fs.writeFileSync('test_error.log', `Error: ${e}\nStack: ${e.stack}`);
    }
})();
