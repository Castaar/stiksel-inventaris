import clientPromise from "../../lib/mongodb";

export default async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("Folies");

    const collection = db.collection(req.query.collection);
    const docId = { number: req.body.number };

    let result;

    // check state if new product
    result = await collection.deleteOne(docId);

    res.json(result);
  } catch (e) {
    console.log(e);
    throw new Error(e).message;
  }
};
