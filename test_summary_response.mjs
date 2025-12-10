const testSummaryAPI = async () => {
    try {
        const response = await fetch('http://localhost:3002/api/ai/chapter-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ book: 'Gênesis', chapter: 1, language: 'pt' })
        });

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        const data = await response.json();
        console.log('\n=== Full Response ===');
        console.log(JSON.stringify(data, null, 2));

        console.log('\n=== Parsed Text Field ===');
        if (data.text) {
            try {
                const parsed = JSON.parse(data.text);
                console.log(JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log('Error parsing text field:', e.message);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    }
};

testSummaryAPI();
