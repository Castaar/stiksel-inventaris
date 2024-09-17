import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async (req, res) => {
  try {
    // Ensure the request is a POST or PUT method
    if (req.method !== "POST" && req.method !== "PUT") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const client = await clientPromise;
    const db = client.db("stock");

    const collection = db.collection(req.query.collection);

    // Ensure _id is a valid ObjectId
    const docId = { _id: new ObjectId(req.body._id) };

    // Validate request body
    const { name, available, format } = req.body;
    if (!name || available === undefined) {
      return res.status(400).json({ message: "Invalid request body" });
    }

    const updateDoc = {
      $set: {
        name,
        available,
        format,
      },
    };

    const options = { upsert: true };

    // Perform the update
    const result = await collection.updateOne(docId, updateDoc, options);

    // Return the result
    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
