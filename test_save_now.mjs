// Test if MongoDB saves are working after restart
import fetch from 'node-fetch';

console.log('🧪 Testing save after server restart\n');

async function testSaveNow() {
    try {
        console.log('📤 Generating Êxodo 1 summary...');
        const response = await fetch('http://localhost:3002/api/ai/chapter-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ book: 'Êxodo', chapter: 1, language: 'pt' })
        });

        if (!response.ok) {
            console.error(`❌ API error: ${response.status}`);
            return;
        }

        const data = await response.json();
        console.log('✅ API responded successfully');

        // Wait for save to complete
        console.log('\n⏳ Waiting 3s for MongoDB save...\n');
        await new Promise(r => setTimeout(r, 3000));

        // Check if saved
        const { default: mongoose } = await import('mongoose');
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

        const ChapterSummary = mongoose.connection.collection('chaptersummaries');
        const found = await ChapterSummary.findOne({
            normalizedBook: 'exodo',
            chapter: 1,
            language: 'pt'
        });

        if (found) {
            console.log('✅✅✅ SUCCESS! Summary WAS SAVED to MongoDB!');
            console.log(`   Title: ${found.title}`);
            console.log(`   ID: ${found._id}`);
        } else {
            console.log('❌ FAILED - Summary NOT found in MongoDB');
            console.log('   The save is still not working');
        }

        await mongoose.connection.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSaveNow();
