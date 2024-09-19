import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async (req, res) => {

  try {
    // Ensure the request is a POST or PUT method
    if (req.method !== "POST" && req.method !== "PUT") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const client = await clientPromise;
    const db = client.db("borden");

    const collection = db.collection(req.query.collection);

    let objectId;
    try {
      objectId = ObjectId.createFromHexString(req.body._id)
    } catch (error) {
      console.log("Invalid ObjectId");
      return { props: { product: null } };
    }

    const docId = { _id: objectId };

    // Validate request body
    const { name, available, thickness } = req.body;
    // if (!name || available === undefined) {
    //   return res.status(400).json({ message: "Invalid request body" });
    // }

    const updateDoc = {
      $set: {
        name,
        available,
        thickness,
      },
    };

    const options = { upsert: true };

    const result = await collection.updateOne(docId, updateDoc, options);

    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
