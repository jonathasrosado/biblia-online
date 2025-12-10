import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import path from "path";
import fs from "fs";

console.log("Starting Audio Test...");

(async () => {
    try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata("pt-BR-AntonioNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

        const tempDir = 'C:\\Users\\Dondon\\Desktop\\biblia\\temp_audio';
        if (!fs.existsSync(tempDir)) {
            console.log("Creating dir:", tempDir);
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputPath = path.join(tempDir, `test-${Date.now()}.mp3`);
        console.log("Generating to:", outputPath);

        const filePath = await tts.toFile(outputPath, "Olá, este é um teste de áudio.");
        console.log("Success! File saved at:", filePath);

    } catch (e) {
        console.error("TEST FAILED:", e);
    }
})();
