import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {

  console.log(req.body)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("borden");

    const { collection: collectionName } = req.query;
    if (!collectionName) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const collection = db.collection(collectionName);

    const { _id, name, unit, available, format, price } = req.body;

    if (_id) {
      let objectId;
      try {
        objectId = ObjectId.createFromHexString(_id);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid _id format' });
      }

      const updateResult = await collection.updateOne(
        { _id: objectId },
        { $inc: { available: available } }
      );

      if (updateResult.matchedCount === 1) {
        return res.status(200).json({ message: 'Borden updated successfully' });
      } else {
        const newProduct = {
          name,
          unit,
          available: available || 0,
          format: format || '',
          price: price || 0,
        };

        const insertResult = await collection.insertOne(newProduct);
        return res.status(201).json({ message: 'New product created', productId: insertResult.insertedId });
      }
    } else {
      if (!name || available === undefined) {
        return res.status(400).json({ error: 'Name and available fields are required for new products' });
      }

      const newProduct = {
        name,
        unit: unit || '',
        available,
        format: format || '',
        price: price || 0,
      };

      const insertResult = await collection.insertOne(newProduct);
      return res.status(201).json({ message: 'New product created', productId: insertResult.insertedId });
    }
  } catch (error) {
    console.error('Error in add-product API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}