// Quick test to see MongoDB save
import fetch from 'node-fetch';

console.log('🧪 Testing summary generation and MongoDB save...\n');

async function waitAndCheck() {
    // Wait a bit for server to be ready
    await new Promise(r => setTimeout(r, 2000));

    console.log('📤 Requesting summary for Gênesis 2 (should generate new)...');
    const start = Date.now();

    try {
        const response = await fetch('http://localhost:3002/api/ai/chapter-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ book: 'Gênesis', chapter: 2, language: 'pt' })
        });

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`✅ Response received in ${elapsed}s`);

        if (response.ok) {
            const data = await response.json();
            const parsed = data.text ? JSON.parse(data.text) : data;
            console.log(`📖 Title: ${parsed.title}`);
        }

        // Wait a bit then check MongoDB
        console.log('\n⏳ Waiting 2s then checking MongoDB...');
        await new Promise(r => setTimeout(r, 2000));

        // Check MongoDB
        const { default: mongoose } = await import('mongoose');
        await mongoose.connect(process.env.MONGO_URI);

        const ChapterSummary = mongoose.connection.collection('chaptersummaries');
        const count = await ChapterSummary.countDocuments();
        console.log(`\n📊 Total summaries in DB: ${count}`);

        if (count > 0) {
            const latest = await ChapterSummary.findOne({}, { sort: { updatedAt: -1 } });
            console.log(`📝 Latest: ${latest.book} ${latest.chapter}`);
            console.log(`   Normalized: "${latest.normalizedBook}"`);
        } else {
            console.log('❌ No summaries found - save failed!');
        }

        await mongoose.connection.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

waitAndCheck();
