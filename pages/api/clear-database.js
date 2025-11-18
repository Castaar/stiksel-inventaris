import clientPromise from "../../lib/mongodb";

const databasesToClear = ['borden', 'stock'];

export default async (req, res) => {
  try {
    // Only allow POST method
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    // Check for password protection
    const { password } = req.body;
    const requiredPassword = process.env.CLEAR_PASSWORD || process.env.IMPORT_PASSWORD;

    if (!password || password !== requiredPassword) {
      return res.status(401).json({ message: "Unauthorized - Invalid password" });
    }

    const client = await clientPromise;
    const results = [];

    for (const dbName of databasesToClear) {
      console.log(`Clearing database: ${dbName}`);
      const db = client.db(dbName);

      // List all collections in the current database
      const collections = await db.listCollections().toArray();

      for (const col of collections) {
        const collectionName = col.name;
        console.log(`  Clearing collection: ${collectionName}`);
        const collection = db.collection(collectionName);

        // Delete all documents in the collection
        const deleteResult = await collection.deleteMany({});
        
        results.push({
          database: dbName,
          collection: collectionName,
          deletedCount: deleteResult.deletedCount
        });

        console.log(`    Deleted ${deleteResult.deletedCount} documents from ${collectionName}`);
      }
    }

    const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0);

    console.log(`Successfully cleared ${results.length} collections, deleted ${totalDeleted} documents total`);

    res.status(200).json({ 
      message: "Database cleared successfully",
      totalDeleted,
      details: results
    });
  } catch (e) {
    console.error('Clear database error:', e);
    res.status(500).json({ error: e.message, stack: e.stack });
  }
};
