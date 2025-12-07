
import 'dotenv/config';
import mongoose from 'mongoose';

async function test() {
    console.log("Testando conexão com MongoDB Atlas...");
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI não encontrada no .env");

        // Hide password in log
        console.log("URI:", process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@'));

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ SUCESSO! Conexão estabelecida.");

        console.log("Estado da conexão:", mongoose.connection.readyState); // 1 = Connected

        await mongoose.disconnect();
    } catch (e) {
        console.error("❌ ERRO:", e.message);
        process.exit(1);
    }
}
test();
