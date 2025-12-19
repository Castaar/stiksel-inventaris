import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import ExcelJS from "exceljs";
import formidable from "formidable";
import fs from "fs/promises";

// Disable body parser for file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = await clientPromise;

    // Parse the uploaded file
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    // Check password
    const password = fields.password?.[0];
    const correctPassword = process.env.IMPORT_PASSWORD || 'castaar2024'; // Set this in .env.local
    
    if (!password || password !== correctPassword) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const uploadedFile = files.file?.[0];
    if (!uploadedFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read the Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(uploadedFile.filepath);

    let updatedCount = 0;
    let deletedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each worksheet (skip the TOTALS sheet)
    for (const worksheet of workbook.worksheets) {
      if (worksheet.name === 'TOTALS' || worksheet.name === 'total') {
        continue; // Skip totals sheets
      }

      // Parse database and collection name from worksheet name
      // Format: "borden_forex_zwart" or "stock_collection_name"
      const parts = worksheet.name.split('_');
      if (parts.length < 2) {
        console.log(`Skipping worksheet ${worksheet.name} - invalid format`);
        continue;
      }

      const dbName = parts[0]; // "borden" or "stock"
      const collectionName = parts.slice(1).join('_'); // rest is collection name

      const db = client.db(dbName);
      const collection = db.collection(collectionName);

      // Get header row (row 1)
      const headerRow = worksheet.getRow(1);
      const headers = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value;
      });

      // Find the _id column index
      const idColumnIndex = headers.findIndex(h => h === '_id');
      if (idColumnIndex === -1) {
        console.log(`No _id column found in ${worksheet.name}`);
        continue;
      }

      // Collect all rows to process and their IDs
      const rowsToProcess = [];
      const excelIds = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        const idValue = row.getCell(idColumnIndex).value;
        if (!idValue || idValue === 'Total') return; // Skip total rows
        
        try {
          const objectId = ObjectId.createFromHexString(idValue);
          excelIds.push(objectId);
          rowsToProcess.push({ row, rowNumber, objectId });
        } catch (e) {
          console.log(`Invalid ObjectId in row ${rowNumber}: ${idValue}`);
          errorCount++;
          errors.push({ row: rowNumber, error: `Invalid ObjectId: ${idValue}` });
        }
      });

      // Skip empty worksheets (no data rows)
      if (rowsToProcess.length === 0) {
        console.log(`Skipping empty worksheet: ${worksheet.name}`);
        continue;
      }

      console.log(`Processing ${worksheet.name} with ${rowsToProcess.length} rows...`);

      // Delete items from database that are not in the Excel file
      const deleteResult = await collection.deleteMany({
        _id: { $nin: excelIds }
      });
      
      if (deleteResult.deletedCount > 0) {
        deletedCount += deleteResult.deletedCount;
        console.log(`Deleted ${deleteResult.deletedCount} items from ${worksheet.name} that were not in Excel`);
      }

      // Process each row sequentially
      for (const { row, rowNumber, objectId } of rowsToProcess) {
        try {
          // Build update document from row data
          const updateDoc = {
            _id: objectId // Ensure _id is set for upsert
          };
          row.eachCell((cell, colNumber) => {
            const fieldName = headers[colNumber];
            if (!fieldName || fieldName === '_id' || fieldName === 'subtotal') {
              return; // Skip _id (already set) and subtotal (calculated field)
            }

            let value = cell.value;
            
            // Handle formula cells - use the result
            if (value && typeof value === 'object' && 'result' in value) {
              value = value.result;
            }

            // Convert to appropriate type based on field name
            if (fieldName.includes('price') || fieldName.includes('available') || 
                fieldName.includes('width') || fieldName.includes('height') || 
                fieldName.includes('depth') || fieldName.includes('thickness') ||
                fieldName.includes('meter')) {
              updateDoc[fieldName] = Number(value) || 0;
            } else if (fieldName === 'name') {
              updateDoc[fieldName] = value ? String(value).toUpperCase() : value;
            } else {
              updateDoc[fieldName] = value;
            }
          });

          // Calculate price based on the data
          if (updateDoc.calculation_type && updateDoc.available) {
            const price = calculatePrice(updateDoc);
            updateDoc.price = price;
          }

          // Update the document (or insert if it doesn't exist - upsert)
          const result = await collection.updateOne(
            { _id: objectId },
            { $set: updateDoc },
            { upsert: true }
          );

          if (result.modifiedCount > 0 || result.upsertedCount > 0 || result.matchedCount > 0) {
            updatedCount++;
            console.log(`Updated/Inserted row ${rowNumber} in ${worksheet.name} (matched: ${result.matchedCount}, modified: ${result.modifiedCount}, upserted: ${result.upsertedCount})`);
          } else {
            console.log(`No changes for row ${rowNumber} in ${worksheet.name}`);
          }
        } catch (error) {
          console.error(`Error updating row ${rowNumber}:`, error);
          errorCount++;
          errors.push({ row: rowNumber, error: error.message });
        }
      }
      
      console.log(`Processed ${worksheet.name}: ${rowsToProcess.length} rows`);
    }

    // Clean up uploaded file
    await fs.unlink(uploadedFile.filepath);

    console.log(`Import completed: ${updatedCount} updated, ${deletedCount} deleted, ${errorCount} errors`);

    res.status(200).json({
      success: true,
      message: `Import completed. Updated ${updatedCount} records, deleted ${deletedCount} records.`,
      updatedCount,
      deletedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Calculate price based on calculation_type (same logic as export)
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
