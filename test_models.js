async function test() {
    try {
        console.log('Fetching from 3002...');
        const res = await fetch('http://localhost:3002/api/ai/models');
        if (res.ok) {
            const data = await res.json();
            console.log('Models:', JSON.stringify(data, null, 2));
            if (data.google && data.google.length > 0) {
                console.log('SUCCESS: Google models found!');
            } else {
                console.log('FAIL: Google models missing.');
            }
        } else {
            console.log('Error:', res.status, res.statusText);
        }
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}
test();
