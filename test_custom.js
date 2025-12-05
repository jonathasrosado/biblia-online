
import fetch from 'node-fetch';

async function test() {
    try {
        const res = await fetch('http://localhost:3002/api/testcats');
        console.log('Status:', res.status);
        const txt = await res.text();
        console.log('Body:', txt);
    } catch (e) {
        console.error(e);
    }
}
test();
