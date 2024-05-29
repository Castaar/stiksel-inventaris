import clientPromise from "../../lib/mongodb";

export default async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("Folies");

    const collection = db.collection(req.query.collection);
    const docId = { name: req.body.name };
    const options = { upsert: true };

    let updateDoc;
    let result;

    // check state if new product
    if (req.body.state) {
      updateDoc = {
        name: req.body.name,
        unit: req.body.unit,
        available: req.body.available,
        format: req.body.format,
        price: req.body.price,
        number: req.body.number,
      };
      result = await collection.insertOne(updateDoc);
    } else {
      updateDoc = {
        $set: {
          name: req.body.name,
          available: req.body.available,
        },
      };
      result = await collection.updateOne(docId, updateDoc, options);
    }

    res.json(result);
  } catch (e) {
    console.log(e);
    throw new Error(e).message;
  }
};
