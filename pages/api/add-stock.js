import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getCollectionDefaults } from "../../lib/collection-defaults";

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("stock");

    const { collection: collectionName } = req.query;
    if (!collectionName) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const collection = db.collection(collectionName);

    const {
      _id,
      name,
      unit,
      format,
      calculation_type,
      width_cm,
      height_cm,
      depth_cm,
      available,
      thickness,
      price_per_square_meter,
      price_per_piece,
      price_per_meter,
      total_meter_per_rol
    } = req.body;

    if (_id) {
      let objectId;
      try {
        objectId = ObjectId.createFromHexString(_id);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid _id format' });
      }

      const updateResult = await collection.updateOne(
        { _id: objectId },
        { $inc: { available: Number(available) } }
      );

      if (updateResult.matchedCount === 1) {
        return res.status(200).json({ message: 'Stock updated successfully' });
      } else {
        // Get defaults from collection based on name
        const upperName = name ? name.toUpperCase() : '';
        const defaults = getCollectionDefaults(collectionName, null, upperName);

        const newProduct = {
          name: upperName,
          unit: unit || '',
          format: format || '',
          calculation_type: defaults.calculation_type || null, // "bord" || "stuk" || "rol_per_meter" || "rol_per_square_meter" || "total_rol_per_meter"
          width_cm: Number(width_cm) || Number(defaults.width_cm) || 0,
          height_cm: Number(height_cm) || 0,
          depth_cm: Number(depth_cm) || 0,
          available: Number(available) || 0,
          thickness: Number(thickness) || 0,
          price_per_square_meter: Number(price_per_square_meter) || Number(defaults.price_per_square_meter) || 0,
          price_per_piece: Number(price_per_piece) || Number(defaults.price_per_piece) || 0,
          price_per_meter: Number(price_per_meter) || Number(defaults.price_per_meter) || 0,
          total_meter_per_rol: Number(total_meter_per_rol) || 0
        };

        const insertResult = await collection.insertOne(newProduct);
        return res.status(201).json({ message: 'New product created', productId: insertResult.insertedId });
      }
    } else {

      // Add sanitization
      
      // if (!name || available === undefined) {
      //   return res.status(400).json({ error: 'Name and available fields are required for new products' });
      // }

      // Get defaults from collection based on name
      const upperName = name ? name.toUpperCase() : '';
      const defaults = getCollectionDefaults(collectionName, null, upperName);

      const newProduct = {
        name: upperName,
        unit: unit || '',
        format: format || '',
        calculation_type: defaults.calculation_type || null, // "bord" || "stuk" || "rol_per_meter" || "rol_per_square_meter" || "total_rol_per_meter"
        width_cm: Number(width_cm) || Number(defaults.width_cm) || 0,
        height_cm: Number(height_cm) || 0,
        depth_cm: Number(depth_cm) || 0,
        available: Number(available) || 0,
        thickness: Number(thickness) || 0,
        price_per_square_meter: Number(price_per_square_meter) || Number(defaults.price_per_square_meter) || 0,
        price_per_piece: Number(price_per_piece) || Number(defaults.price_per_piece) || 0,
        price_per_meter: Number(price_per_meter) || Number(defaults.price_per_meter) || 0,
        total_meter_per_rol: Number(total_meter_per_rol) || 0
      };

      const insertResult = await collection.insertOne(newProduct);
      return res.status(201).json({ message: 'New product created', productId: insertResult.insertedId });
    }
  } catch (error) {
    console.error('Error in add-product API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}