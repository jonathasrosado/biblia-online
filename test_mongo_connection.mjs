import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function testConnection() {
    try {
        console.log('🔄 Tentando conectar ao MongoDB...');
        console.log(`URI: ${uri?.substring(0, 30)}...`);

        await mongoose.connect(uri);

        console.log('✅ Conectado ao MongoDB com sucesso!');

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`\n📊 Collections disponíveis (${collections.length}):`);
        collections.forEach(c => console.log(`  - ${c.name}`));

        // Check ChapterSummary collection
        const ChapterSummary = mongoose.connection.collection('chaptersummaries');
        const count = await ChapterSummary.countDocuments();
        console.log(`\n📖 Resumos de capítulos: ${count}`);

        if (count > 0) {
            console.log('\n📋 Últimos 3 resumos:');
            const summaries = await ChapterSummary.find({})
                .sort({ updatedAt: -1 })
                .limit(3)
                .toArray();

            summaries.forEach((s, i) => {
                console.log(`\n  ${i + 1}. ${s.book} ${s.chapter} (${s.language})`);
                console.log(`     Título: ${s.title}`);
                console.log(`     Criado: ${s.createdAt}`);
            });
        }

        await mongoose.connection.close();
        console.log('\n✅ Conexão fechada com sucesso');

    } catch (error) {
        console.error('\n❌ Erro ao conectar:', error.message);
        if (error.code) console.error(`   Código: ${error.code}`);
        process.exit(1);
    }
}

testConnection();
