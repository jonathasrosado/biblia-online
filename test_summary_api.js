async function testApi() {
    const book = 'Êxodo'; // Changed to force generation
    const url = `http://localhost:3002/api/books/${book}/summary?lang=pt`;
    console.log(`Fetching from: ${url}`);

    const start = Date.now();
    try {
        const response = await fetch(url);
        const duration = (Date.now() - start) / 1000;
        console.log(`Status: ${response.status}`);
        console.log(`Duration: ${duration}s`);

        const text = await response.text();
        console.log(`Full Response: ${text}`);

        try {
            const json = JSON.parse(text);
            console.log("JSON Parse: Success");
            console.log("Keys:", Object.keys(json));
        } catch (e) {
            console.error("JSON Parse: Failed");
        }
    } catch (e) {
        console.error("Fetch Failed:", e.message);
    }
}

testApi();
