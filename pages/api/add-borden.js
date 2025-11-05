import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

// Helper function to parse dimensions from name (e.g., "38 x 35" or "38X35" or "305,5 X 40,8")
function parseDimensionsFromName(name) {
  // Match numbers with optional comma or dot as decimal separator
  const match = name.match(/(\d+[,.]?\d*)\s*[xX×]\s*(\d+[,.]?\d*)/);
  if (match) {
    return {
      width_cm: parseFloat(match[1].replace(',', '.')),
      height_cm: parseFloat(match[2].replace(',', '.'))
    };
  }
  return { width_cm: 0, height_cm: 0 };
}

// Calculate price based on calculation_type
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
      // Price = available * (width * height / 10000) * price_per_square_meter
      return available * (width_cm * height_cm / 10000) * (price_per_square_meter || 0);
    
    case 'stuk':
      // Price = available * price_per_piece
      return available * (price_per_piece || 0);
    
    case 'rol_per_meter':
      // Price = available * price_per_meter
      return available * (price_per_meter || 0);
    
    case 'rol_per_square_meter':
      // Price = available * (width_cm / 100) * price_per_square_meter
      return available * (width_cm / 100) * (price_per_square_meter || 0);
    
    case 'total_rol_per_meter':
      // Price = (price_per_rol / total_meter_per_rol) * available
      if (total_meter_per_rol && total_meter_per_rol > 0) {
        return (price_per_rol / total_meter_per_rol) * available;
      }
      return 0;
    
    default:
      return 0;
  }
}

export default async function handler(req, res) {

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
      price_per_rol,
      total_meter_per_rol
    } = req.body;

    if (_id) {
      let objectId;
      try {
        objectId = ObjectId.createFromHexString(_id);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid _id format' });
      }

      // Get existing product to recalculate price
      const existingProduct = await collection.findOne({ _id: objectId });
      
      if (existingProduct) {
        // Update available quantity
        const newAvailable = existingProduct.available + Number(available);
        
        // Recalculate price with new available quantity
        const updatedProduct = { ...existingProduct, available: newAvailable };
        const newPrice = calculatePrice(updatedProduct);

        const updateResult = await collection.updateOne(
          { _id: objectId },
          { 
            $set: { 
              available: newAvailable,
              price: newPrice
            } 
          }
        );

        if (updateResult.matchedCount === 1) {
          return res.status(200).json({ message: 'Borden updated successfully' });
        }
      }
      
      // If product doesn't exist, create new one (fallthrough to insert logic)
    }

    // Creating new product
    if (!name || available === undefined) {
      return res.status(400).json({ error: 'Name and available fields are required for new products' });
    }

    // Parse dimensions from name if not provided
    let parsedWidth = Number(width_cm) || 0;
    let parsedHeight = Number(height_cm) || 0;
    
    if ((!parsedWidth || !parsedHeight) && name) {
      const dimensions = parseDimensionsFromName(name);
      parsedWidth = parsedWidth || dimensions.width_cm;
      parsedHeight = parsedHeight || dimensions.height_cm;
    }

    const newProduct = {
      name: name || '',
      unit: unit || '',
      format: format || '',
      calculation_type: calculation_type || 'bord', // Default to 'bord' for borden database
      width_cm: parsedWidth,
      height_cm: parsedHeight,
      depth_cm: Number(depth_cm) || 0,
      available: Number(available) || 0,
      thickness: Number(thickness) || 0,
      price_per_square_meter: Number(price_per_square_meter) || 0,
      price_per_piece: Number(price_per_piece) || 0,
      price_per_meter: Number(price_per_meter) || 0,
      price_per_rol: Number(price_per_rol) || 0,
      total_meter_per_rol: Number(total_meter_per_rol) || 0,
      price: 0 // Will be calculated below
    };

    // Calculate price
    newProduct.price = calculatePrice(newProduct);

    const insertResult = await collection.insertOne(newProduct);
    return res.status(201).json({ message: 'New product created', productId: insertResult.insertedId });
  } catch (error) {
    console.error('Error in add-product API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}