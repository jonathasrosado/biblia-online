
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from 'fs';

async function test() {
    console.log("Testing MsEdgeTTS...");
    try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata("pt-BR-AntonioNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
        const result = await tts.toStream("Teste de áudio.");

        console.log("Stream result keys:", Object.keys(result));
        const stream = result.audioStream;

        if (!stream) {
            console.error("No stream!");
            return;
        }

        const chunks = [];
        stream.on('data', c => chunks.push(c));
        stream.on('end', () => console.log(`Success! Size: ${Buffer.concat(chunks).length}`));
        stream.on('error', e => console.error("Stream Error:", e));

    } catch (e) {
        console.error("Catch Error:", e);
    }
}

test();
