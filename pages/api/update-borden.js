import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getCollectionDefaults } from "../../lib/collection-defaults";

// Calculate price based on calculation_type (same as in add-borden.js)
function calculatePrice(product) {
  const {
    calculation_type,
    available,
    width_cm,
    height_cm,
    price_per_square_meter,
    price_per_piece,
    price_per_meter,
    price_per_rol,
    total_meter_per_rol
  } = product;

  switch (calculation_type) {
    case 'bord':
      return available * (width_cm * height_cm / 10000) * (price_per_square_meter || 0);
    case 'stuk':
      return available * (price_per_piece || 0);
    case 'rol_per_meter':
      return available * (price_per_meter || 0);
    case 'rol_per_square_meter':
      return available * (width_cm / 100) * (price_per_square_meter || 0);
    case 'total_rol_per_meter':
      if (total_meter_per_rol && total_meter_per_rol > 0) {
        return (price_per_rol / total_meter_per_rol) * available;
      }
      return 0;
    default:
      return 0;
  }
}

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
    const { name, available, thickness, price_per_square_meter, width_cm, height_cm } = req.body;

    // Get existing product to merge with updates
    const existingProduct = await collection.findOne(docId);
    
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Convert width and height, handling both string and number inputs
    const parsedWidth = width_cm !== undefined ? Number(String(width_cm).replace(',', '.')) : existingProduct.width_cm;
    const parsedHeight = height_cm !== undefined ? Number(String(height_cm).replace(',', '.')) : existingProduct.height_cm;

    // Handle price_per_square_meter with default fallback
    let finalPricePerSquareMeter = existingProduct.price_per_square_meter;
    if (price_per_square_meter !== undefined) {
      const parsedPrice = Number(price_per_square_meter);
      if (parsedPrice === 0) {
        // Use default price from collection-defaults if price is 0
        const defaults = getCollectionDefaults(req.query.collection);
        finalPricePerSquareMeter = defaults.price_per_square_meter || 0;
      } else {
        finalPricePerSquareMeter = parsedPrice;
      }
    } else if (!finalPricePerSquareMeter || finalPricePerSquareMeter === 0) {
      // If existing product has no price, try to use default
      const defaults = getCollectionDefaults(req.query.collection);
      finalPricePerSquareMeter = defaults.price_per_square_meter || 0;
    }

    // Merge updates with existing product
    const updatedProduct = {
      ...existingProduct,
      name: name !== undefined ? name : existingProduct.name,
      available: available !== undefined ? Number(available) : existingProduct.available,
      thickness: thickness !== undefined ? Number(thickness) : existingProduct.thickness,
      price_per_square_meter: finalPricePerSquareMeter,
      width_cm: parsedWidth || 0,
      height_cm: parsedHeight || 0,
    };

    // Recalculate price
    const newPrice = calculatePrice(updatedProduct);

    const updateDoc = {
      $set: {
        name: updatedProduct.name,
        available: updatedProduct.available,
        thickness: updatedProduct.thickness,
        price_per_square_meter: updatedProduct.price_per_square_meter,
        width_cm: updatedProduct.width_cm,
        height_cm: updatedProduct.height_cm,
        price: newPrice,
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
