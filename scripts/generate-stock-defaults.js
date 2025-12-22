import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
const envPath = resolve(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');

for (const line of envLines) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not found in .env file');
}

async function generateStockDefaults() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db("stock");
    
    // Get all collections in the stock database
    const collections = await db.listCollections().toArray();
    
    const defaults = {};
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      // Find all items with price fields > 0
      const items = await collection.find({
        $or: [
          { price_per_square_meter: { $gt: 0 } },
          { price_per_piece: { $gt: 0 } },
          { price_per_meter: { $gt: 0 } },
          { price_per_rol: { $gt: 0 } }
        ]
      }).toArray();
      
      // Group by name and get unique items
      const uniqueItems = {};
      
      for (const item of items) {
        const name = item.name?.trim();
        if (!name) continue;
        
        // Only keep first occurrence of each name (or you could average/max if preferred)
        if (!uniqueItems[name]) {
          uniqueItems[name] = {
            name,
            calculation_type: item.calculation_type,
            price_per_square_meter: item.price_per_square_meter || 0,
            price_per_piece: item.price_per_piece || 0,
            price_per_meter: item.price_per_meter || 0,
            price_per_rol: item.price_per_rol || 0,
            width_cm: item.width_cm || 0,
          };
        }
      }
      
      if (Object.keys(uniqueItems).length > 0) {
        defaults[collectionName] = uniqueItems;
      }
    }
    
    console.log('\n=== Stock Collection Defaults ===\n');
    console.log(JSON.stringify(defaults, null, 2));
    
    // Generate the code to add to collection-defaults.js
    console.log('\n\n=== Code to add to COLLECTION_DEFAULTS ===\n');
    
    for (const [collectionName, items] of Object.entries(defaults)) {
      console.log(`  // Stock: ${collectionName}`);
      
      const itemsArray = Object.values(items);
      
      if (itemsArray.length === 1) {
        // Simple case: only one item
        const item = itemsArray[0];
        const priceField = item.calculation_type === 'stuk' ? 'price_per_piece' :
                          item.calculation_type === 'rol_per_meter' ? 'price_per_meter' :
                          item.calculation_type === 'rol_per_square_meter' ? 'price_per_square_meter' :
                          'price_per_square_meter';
        
        console.log(`  '${collectionName}': {`);
        if (item[priceField] > 0) {
          console.log(`    ${priceField}: ${item[priceField]},`);
        }
        if (item.calculation_type) {
          console.log(`    calculation_type: '${item.calculation_type}'`);
        }
        console.log(`  },`);
      } else {
        // Multiple items - create a names object
        console.log(`  '${collectionName}': {`);
        console.log(`    items: {`);
        
        for (const item of itemsArray) {
          console.log(`      '${item.name}': {`);
          
          if (item.price_per_square_meter > 0) {
            console.log(`        price_per_square_meter: ${item.price_per_square_meter},`);
          }
          if (item.price_per_piece > 0) {
            console.log(`        price_per_piece: ${item.price_per_piece},`);
          }
          if (item.price_per_meter > 0) {
            console.log(`        price_per_meter: ${item.price_per_meter},`);
          }
          if (item.price_per_rol > 0) {
            console.log(`        price_per_rol: ${item.price_per_rol},`);
          }
          if (item.width_cm > 0) {
            console.log(`        width_cm: ${item.width_cm},`);
          }
          if (item.calculation_type) {
            console.log(`        calculation_type: '${item.calculation_type}'`);
          }
          
          console.log(`      },`);
        }
        
        console.log(`    }`);
        console.log(`  },`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

generateStockDefaults();
