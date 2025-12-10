import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from 'fs';
import path from 'path';

(async () => {
    try {
        console.log("Initializing TTS...");
        const tts = new MsEdgeTTS();

        console.log("Methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(tts)));

        console.log("Setting Metadata...");
        await tts.setMetadata("pt-BR-AntonioNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);

        console.log("Generating audio (raw stream)...");
        // Try to find a stream method
        if (tts.toStream) {
            console.log("Using toStream...");
            const stream = await tts.toStream("Olá, isso é um teste de áudio.");
            const writeStream = fs.createWriteStream("test_stream.webm");
            stream.pipe(writeStream);
            writeStream.on('finish', () => console.log("Stream finished."));
        } else {
            console.log("No toStream method found.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
})();
