import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from 'fs';

(async () => {
    try {
        console.log("Starting TTS test...");
        const tts = new MsEdgeTTS();
        await tts.setMetadata("pt-BR-AntonioNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
        const result = await tts.toStream("Teste de som um dois três");
        const stream = result.audioStream;

        const chunks = [];
        stream.on('data', c => chunks.push(c));
        stream.on('end', () => {
            console.log("Stream ended. Buffer size:", Buffer.concat(chunks).length);
        });
        stream.on('error', e => console.error("Stream error:", e));
    } catch (e) {
        console.error("Crash:", e);
    }
})();
