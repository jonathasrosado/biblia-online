const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/biblia-online';

async function checkChapterSummaries() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db();
        const collection = db.collection('chaptersummaries');

        const count = await collection.countDocuments();
        console.log(`\n📊 Total chapter summaries in DB: ${count}`);

        if (count > 0) {
            console.log('\n📋 Recent summaries:');
            const summaries = await collection.find({})
                .sort({ updatedAt: -1 })
                .limit(5)
                .toArray();

            summaries.forEach((s, i) => {
                console.log(`\n${i + 1}. ${s.book} ${s.chapter} (${s.language})`);
                console.log(`   Title: ${s.title}`);
                console.log(`   Created: ${s.createdAt}`);
                console.log(`   Updated: ${s.updatedAt}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

checkChapterSummaries();
