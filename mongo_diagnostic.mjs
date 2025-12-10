import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function fullDiagnostic() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DO MONGODB\n');
    console.log('='.repeat(60));

    try {
        // 1. Test connection
        console.log('\n1️⃣ Testando conexão...');
        console.log(`   URI: ${uri?.substring(0, 40)}...`);

        await mongoose.connect(uri);
        console.log('   ✅ CONECTADO com sucesso!');
        console.log(`   Host: ${mongoose.connection.host}`);
        console.log(`   Database: ${mongoose.connection.name}`);
        console.log(`   ReadyState: ${mongoose.connection.readyState} (1=connected)`);

        // 2. List collections
        console.log('\n2️⃣ Listando collections...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`   Total: ${collections.length} collections`);
        collections.forEach(c => console.log(`   - ${c.name}`));

        // 3. Check ChapterSummary collection
        console.log('\n3️⃣ Verificando collection "chaptersummaries"...');
        const ChapterSummary = mongoose.connection.collection('chaptersummaries');
        const count = await ChapterSummary.countDocuments();
        console.log(`   Total de documentos: ${count}`);

        if (count > 0) {
            console.log('\n   📋 Resumos encontrados:');
            const summaries = await ChapterSummary.find({})
                .sort({ updatedAt: -1 })
                .limit(10)
                .toArray();

            summaries.forEach((s, i) => {
                console.log(`\n   ${i + 1}. ${s.book} ${s.chapter} (${s.language})`);
                console.log(`      normalizedBook: "${s.normalizedBook}"`);
                console.log(`      title: ${s.title?.substring(0, 40)}...`);
                console.log(`      created: ${s.createdAt}`);
                console.log(`      updated: ${s.updatedAt}`);
            });
        } else {
            console.log('   ⚠️ Nenhum resumo encontrado no banco!');
            console.log('   Isso significa que os saves NÃO estão funcionando.');
        }

        // 4. Test write permission
        console.log('\n4️⃣ Testando permissão de escrita...');
        try {
            const testDoc = {
                book: 'Teste',
                normalizedBook: 'teste',
                chapter: 999,
                language: 'pt',
                title: 'Teste de escrita',
                summary: 'Este é um teste',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await ChapterSummary.insertOne(testDoc);
            console.log(`   ✅ Escrita funcionando! ID: ${result.insertedId}`);

            // Clean up test
            await ChapterSummary.deleteOne({ _id: result.insertedId });
            console.log('   🧹 Teste removido');

        } catch (writeError) {
            console.error('   ❌ ERRO ao escrever:', writeError.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ DIAGNÓSTICO COMPLETO\n');

        await mongoose.connection.close();

    } catch (error) {
        console.error('\n❌ ERRO NO DIAGNÓSTICO:', error.message);
        console.error('Stack:', error.stack);
    }
}

fullDiagnostic();
