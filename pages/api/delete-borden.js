import clientPromise from "../../lib/mongodb";

import { ObjectId } from "mongodb";

export default async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("borden");

    const collection = db.collection(req.query.collection);

    let objectId;
    try {
      objectId = ObjectId.createFromHexString(req.body)
    } catch (error) {
      console.log("Invalid ObjectId");
      return { props: { product: null } };
    }

    const docId = { _id: objectId };

    let result;

    result = await collection.deleteOne(docId);

    res.json(result);
  } catch (e) {
    console.log(e);
    throw new Error(e).message;
  }
};
