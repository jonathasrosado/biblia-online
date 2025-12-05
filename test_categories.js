
import fetch from 'node-fetch';

async function testCategories() {
    try {
        const res = await fetch('http://localhost:3002/api/categories');
        if (res.ok) {
            const data = await res.json();
            console.log('Categories data:', JSON.stringify(data, null, 2));
        } else {
            const text = await res.text();
            console.error('Failed to fetch categories:', res.status, res.statusText, text);
        }
    } catch (e) {
        console.error('Error fetching categories:', e);
    }
}

testCategories();
