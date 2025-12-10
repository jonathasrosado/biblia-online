import fetch from 'node-fetch';

async function testSummaryAPI() {
    console.log('🧪 Testando API de resumo de capítulo...\n');

    const startTime = Date.now();

    try {
        console.log('📤 Enviando request para /api/ai/chapter-summary');
        console.log('   Book: Gênesis, Chapter: 1, Language: pt\n');

        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
            console.log('⏱️ Timeout após 30 segundos');
        }, 30000);

        const response = await fetch('http://localhost:3002/api/ai/chapter-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                book: 'Gênesis',
                chapter: 1,
                language: 'pt'
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Response received in ${elapsed}s`);
        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`\n❌ Error Response:\n${errorText}`);
            return;
        }

        const data = await response.json();

        console.log('\n📦 Response structure:');
        console.log(`   Has 'text' field: ${!!data.text}`);
        console.log(`   Has 'title' field: ${!!data.title}`);
        console.log(`   Has 'summary' field: ${!!data.summary}`);

        if (data.text) {
            console.log('\n📝 Nested JSON detected (text field)');
            try {
                const parsed = JSON.parse(data.text);
                console.log(`   Parsed title: ${parsed.title}`);
                console.log(`   Has structure: ${!!parsed.structure}`);
                console.log(`   Has keyVerses: ${!!parsed.keyVerses}`);
            } catch (e) {
                console.error('   Failed to parse text field');
            }
        } else if (data.title) {
            console.log('\n📝 Direct JSON format');
            console.log(`   Title: ${data.title}`);
            console.log(`   Summary length: ${data.summary?.length || 0} chars`);
        }

        console.log('\n✅ API test completed successfully!');

    } catch (error) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        if (error.name === 'AbortError') {
            console.error(`\n❌ Request timed out after ${elapsed}s`);
            console.error('   A API demorou muito para responder');
        } else {
            console.error(`\n❌ Error after ${elapsed}s:`, error.message);
        }
    }
}

testSummaryAPI();
