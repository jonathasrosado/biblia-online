import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function checkSummaries() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Conectado ao MongoDB\n');

        const ChapterSummary = mongoose.connection.collection('chaptersummaries');

        // List all summaries
        const all = await ChapterSummary.find({}).toArray();
        console.log(`📊 Total de resumos salvos: ${all.length}\n`);

        if (all.length > 0) {
            console.log('📋 Resumos encontrados:');
            all.forEach((s, i) => {
                console.log(`\n${i + 1}. book: "${s.book}"`);
                console.log(`   normalizedBook: "${s.normalizedBook}"`);
                console.log(`   chapter: ${s.chapter}`);
                console.log(`   language: ${s.language}`);
                console.log(`   title: ${s.title?.substring(0, 50)}...`);
                console.log(`   created: ${s.createdAt}`);
            });
        }

        // Test normalization
        console.log('\n\n🔍 Teste de normalização:');
        const testNames = ['Gênesis', 'Genesis', 'gênesis', 'genesis'];
        testNames.forEach(name => {
            const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
            console.log(`  "${name}" → "${normalized}"`);
        });

        // Try to find Genesis 1
        console.log('\n\n🔎 Buscando Gênesis 1:');
        const normalized = 'Gênesis'.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
        console.log(`  normalizedBook procurado: "${normalized}"`);

        const found = await ChapterSummary.findOne({
            normalizedBook: normalized,
            chapter: 1,
            language: 'pt'
        });

        if (found) {
            console.log(`  ✅ ENCONTRADO: ${found.title}`);
        } else {
            console.log(`  ❌ NÃO ENCONTRADO`);
        }

        await mongoose.connection.close();

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

checkSummaries();
