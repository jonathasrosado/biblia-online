import fetch from 'node-fetch';

async function testMateusAPI() {
    console.log('🧪 Testando geração de Mateus 2...\n');

    const start = Date.now();
    const timeout = 60000; // 60 seconds

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout);

        console.log('📤 Enviando request...');
        const response = await fetch('http://localhost:3002/api/ai/chapter-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                book: 'Mateus',
                chapter: 2,
                language: 'pt'
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);

        console.log(`\n⏱️ Tempo de resposta: ${elapsed}s`);
        console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:');
            console.error(errorText.substring(0, 500));
            return;
        }

        const data = await response.json();

        console.log('✅ Resposta recebida com sucesso!');
        console.log(`   Has 'text' field: ${!!data.text}`);
        console.log(`   Has 'title' field: ${!!data.title}`);

        if (data.text) {
            const parsed = JSON.parse(data.text);
            console.log(`\n📖 Título: ${parsed.title}`);
            console.log(`   Summary: ${parsed.summary?.substring(0, 100)}...`);
        } else if (data.title) {
            console.log(`\n📖 Título: ${data.title}`);
            console.log(`   Summary: ${data.summary?.substring(0, 100)}...`);
        }

    } catch (error) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);

        if (error.name === 'AbortError') {
            console.error(`\n❌ TIMEOUT após ${elapsed}s`);
            console.error('   A API está demorando mais de 60 segundos!');
            console.error('   Possíveis causas:');
            console.error('   - API do Gemini muito lenta');
            console.error('   - Quota excedida');
            console.error('   - Erro na geração');
        } else if (error.code === 'ECONNREFUSED') {
            console.error(`\n❌ Servidor não está rodando na porta 3002`);
        } else {
            console.error(`\n❌ Erro após ${elapsed}s:`, error.message);
        }
    }
}

testMateusAPI();
