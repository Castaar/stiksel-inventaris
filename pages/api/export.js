import path from 'path';
import fs from 'fs/promises';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';
import ExcelJS from 'exceljs';

const password = process.env.PW;
const databasesToExport = ['borden', 'stock'];

// Convert column index to Excel column letter
function getColumnLetter(colIndex) {
  let letter = '';
  while (colIndex > 0) {
    const modulo = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + modulo) + letter;
    colIndex = Math.floor((colIndex - modulo) / 26);
  }
  return letter;
}

// Convert column letter to number
function getColumnNumber(colLetter) {
  let column = 0;
  for (let i = 0; i < colLetter.length; i++) {
    column = column * 26 + (colLetter.charCodeAt(i) - 64);
  }
  return column;
}

// Auto-size columns
function autoSizeColumns(worksheet) {
  worksheet.columns.forEach((column) => {
    let maxLength = 10; // Minimum width
    column.eachCell({ includeEmpty: true }, (cell) => {
      let cellValue = '';
      if (cell.value === null || cell.value === undefined) {
        cellValue = '';
      } else if (typeof cell.value === 'object' && cell.value.formula) {
        cellValue = cell.value.formula;
      } else {
        cellValue = cell.value.toString();
      }
      maxLength = Math.max(maxLength, cellValue.length + 2); // Adding padding
    });
    column.width = maxLength;
  });
}

function getCurrentDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

async function getNextVersionNumber(dateString, dbName, outputFolder) {
  const regex = new RegExp(`^${dateString}-export-${dbName}-(\\d+)v(\\d+)\\.xlsx$`);
  try {
    const files = await fs.readdir(outputFolder);
    const matchedFiles = files.filter(file => regex.test(file));
    if (matchedFiles.length === 0) {
      return '1v0';
    }
    const versions = matchedFiles.map(file => {
      const match = file.match(regex);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        return { major, minor };
      }
      return null;
    }).filter(v => v !== null);
    if (versions.length === 0) {
      return '1v0';
    }
    let highestVersion = versions[0];
    for (const v of versions) {
      if (v.major > highestVersion.major || (v.major === highestVersion.major && v.minor > highestVersion.minor)) {
        highestVersion = v;
      }
    }
    let nextMajor = highestVersion.major;
    let nextMinor = highestVersion.minor + 1;
    if (nextMinor > 9) {
      nextMinor = 0;
      nextMajor += 1;
    }
    return `${nextMajor}v${nextMinor}`;
  } catch (err) {
    console.error('Error reading output directory:', err);
    return '1v0';
  }
}

function flattenObject(ob) {
  const toReturn = {};
  for (const i in ob) {
    if (!Object.prototype.hasOwnProperty.call(ob, i)) continue;

    if (ob[i] instanceof ObjectId) {
      toReturn[i] = ob[i].toString();
    } else if (typeof ob[i] === 'object' && ob[i] !== null && !Array.isArray(ob[i])) {
      const flatObject = flattenObject(ob[i]);
      for (const x in flatObject) {
        if (!Object.prototype.hasOwnProperty.call(flatObject, x)) continue;
        toReturn[`${i}.${x}`] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
}

export default async (req, res) => {
  try {
    const client = await clientPromise;

    // Create the 'public/output' folder if it doesn't exist
    const resultFolder = path.join(process.cwd(), 'public', 'output');
    try {
      await fs.access(resultFolder);
    } catch {
      console.log('Creating output folder...');
      await fs.mkdir(resultFolder, { recursive: true });
    }

    const exportedFiles = [];

    for (const dbName of databasesToExport) {
      console.log(`Processing database: ${dbName}`);
      const db = client.db(dbName);

      // List all collections in the current database
      const collections = await db.listCollections().toArray();

      // Create a new workbook for the current database
      const workbook = new ExcelJS.Workbook();

      // Array to store subtotal references for the 'total' sheet
      const subtotalReferences = [];

      for (const col of collections) {
        const collectionName = col.name;
        console.log(`  Processing collection: ${collectionName}`);
        const collection = db.collection(collectionName);

        // Fetch all documents in the collection
        const documents = await collection.find({}).toArray();

        // Create a new worksheet for the collection
        const worksheet = workbook.addWorksheet(collectionName);

        if (documents.length > 0) {
          // Get all unique keys
          const allKeys = new Set();
          documents.forEach((doc) => {
            Object.keys(flattenObject(doc)).forEach((key) => allKeys.add(key));
          });

          // Convert set to array and add 'subtotal'
          const header = Array.from(allKeys).sort();
          header.push('subtotal');

          const headerRow = worksheet.addRow(header);

          // Freeze top row
          worksheet.views = [{ state: 'frozen', ySplit: 1 }];

          // Create column map
          const columnMap = {};
          header.forEach((colName, idx) => {
            columnMap[colName] = getColumnLetter(idx + 1);
          });

          // Add document rows
          documents.forEach((doc) => {
            const flattenedDoc = flattenObject(doc);
            const rowValues = header.slice(0, -1).map((key) => flattenedDoc[key]);
            worksheet.addRow(rowValues);
          });

          // Add formulas
          documents.forEach((doc, index) => {
            const rowNumber = index + 2; 
            const calculationType = doc['calculation_type'];
            let formula = '';

            switch (calculationType) {
              case 'bord':
                if (
                  'available' in columnMap &&
                  'width_cm' in columnMap &&
                  'height_cm' in columnMap &&
                  'price_per_square_meter' in columnMap
                ) {
                  const availableCol = columnMap['available'];
                  const widthCol = columnMap['width_cm'];
                  const heightCol = columnMap['height_cm'];
                  const priceCol = columnMap['price_per_square_meter'];
                  formula = `=${availableCol}${rowNumber}*(${widthCol}${rowNumber}*${heightCol}${rowNumber}/10000)*${priceCol}${rowNumber}`;
                }
                break;
              case 'stuk':
                if ('available' in columnMap && 'price_per_piece' in columnMap) {
                  const availableCol = columnMap['available'];
                  const priceCol = columnMap['price_per_piece'];
                  formula = `=${availableCol}${rowNumber}*${priceCol}${rowNumber}`;
                }
                break;
              case 'rol_per_meter':
                if ('available' in columnMap && 'price_per_meter' in columnMap) {
                  const availableCol = columnMap['available'];
                  const priceCol = columnMap['price_per_meter'];
                  formula = `=${availableCol}${rowNumber}*${priceCol}${rowNumber}`;
                }
                break;
              case 'rol_per_square_meter':
                if (
                  'available' in columnMap &&
                  'width_cm' in columnMap &&
                  'price_per_square_meter' in columnMap
                ) {
                  const availableCol = columnMap['available'];
                  const widthCol = columnMap['width_cm'];
                  const priceCol = columnMap['price_per_square_meter'];
                  formula = `=${availableCol}${rowNumber}*(${widthCol}${rowNumber}/100)*${priceCol}${rowNumber}`;
                }
                break;
              case 'total_rol_per_meter':
                if (
                  'price_per_rol' in columnMap &&
                  'total_meter_per_rol' in columnMap &&
                  'available' in columnMap
                ) {
                  const priceCol = columnMap['price_per_rol'];
                  const totalMeterCol = columnMap['total_meter_per_rol'];
                  const availableCol = columnMap['available'];
                  formula = `=(${priceCol}${rowNumber}/${totalMeterCol}${rowNumber})*${availableCol}${rowNumber}`;
                }
                break;
              default:
                formula = '=0';
            }

            const subtotalCol = columnMap['subtotal'];
            if (formula) {
              worksheet.getCell(`${subtotalCol}${rowNumber}`).value = { formula: formula, result: null };
            } else {
              worksheet.getCell(`${subtotalCol}${rowNumber}`).value = 0;
            }
          });

          // Format subtotal column as Euro
          const subtotalCol = columnMap['subtotal'];
          worksheet.getColumn(subtotalCol).numFmt = '€#,##0.00';

          // Add total row
          const totalRowNumber = documents.length + 2;
          const sumFormula = `=SUM(${subtotalCol}2:${subtotalCol}${documents.length + 1})`;
          worksheet.getCell(`${subtotalCol}${totalRowNumber}`).value = { formula: sumFormula, result: null };

          // Place "Total" label to the left of 'subtotal'
          const subtotalColIndex = header.length;
          const totalLabelColIndex = subtotalColIndex - 1;
          if (totalLabelColIndex >= 1) {
            const totalLabelCol = getColumnLetter(totalLabelColIndex);
            worksheet.getCell(`${totalLabelCol}${totalRowNumber}`).value = 'Total';
            worksheet.getCell(`${totalLabelCol}${totalRowNumber}`).font = { bold: true };
            worksheet.getCell(`${totalLabelCol}${totalRowNumber}`).border = {
              top: { style: 'thin' },
              bottom: { style: 'double' },
              left: { style: 'thin' },
              right: { style: 'thin' },
            };
          }

          // Format the sum cell
          worksheet.getCell(`${subtotalCol}${totalRowNumber}`).numFmt = '€#,##0.00';
          worksheet.getCell(`${subtotalCol}${totalRowNumber}`).font = { bold: true };
          worksheet.getCell(`${subtotalCol}${totalRowNumber}`).border = {
            top: { style: 'thin' },
            bottom: { style: 'double' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          };

          autoSizeColumns(worksheet);

          // Lock cells
          const subtotalColLetter = columnMap['subtotal'];
          const subtotalColNumber = getColumnNumber(subtotalColLetter);
          worksheet.eachRow((row, rowNumber) => {
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              if (rowNumber === 1 || colNumber === 1 || colNumber === subtotalColNumber) {
                cell.protection = { locked: true };
              } else {
                cell.protection = { locked: false };
              }
            });
          });

          // Protect worksheet
          await worksheet.protect(password, {
            selectLockedCells: true,
            selectUnlockedCells: true,
          });

          console.log(`    Exported ${collectionName} to Excel.`);

          // Store subtotal reference
          const subtotalCellAddress = `${subtotalCol}${totalRowNumber}`;
          subtotalReferences.push({
            sheetName: collectionName,
            subtotalCell: `${collectionName}!${subtotalCellAddress}`,
          });
        } else {
          console.log(`    Collection ${collectionName} is empty. Skipping Excel export.`);
        }
      }

      // Add total sheet if we have subtotals
      if (subtotalReferences.length > 0) {
        const totalWorksheet = workbook.addWorksheet('total');
        totalWorksheet.addRow(['Sheet Name', 'Subtotal']);

        subtotalReferences.forEach((ref) => {
          totalWorksheet.addRow([ref.sheetName, { formula: `=${ref.subtotalCell}`, result: null }]);
        });

        const grandTotalRowNumber = subtotalReferences.length + 2;
        const grandTotalFormula = `=SUM(B2:B${grandTotalRowNumber - 1})`;
        totalWorksheet.addRow(['Grand Total', { formula: grandTotalFormula, result: null }]);

        const headerRow = totalWorksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };

        totalWorksheet.getColumn(2).numFmt = '€#,##0.00';
        const grandTotalRow = totalWorksheet.getRow(grandTotalRowNumber);
        grandTotalRow.getCell(1).font = { bold: true };
        grandTotalRow.getCell(2).font = { bold: true };

        totalWorksheet.eachRow((row, rowNumber) => {
          row.eachCell((cell, colNumber) => {
            cell.border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' },
            };
          });
        });

        autoSizeColumns(totalWorksheet);
      }

      const dateString = getCurrentDateString();
      const version = await getNextVersionNumber(dateString, dbName, resultFolder);
      const excelFileName = `${dateString}-export-${dbName}-${version}.xlsx`;
      const excelFilePath = path.join(resultFolder, excelFileName);

      console.log(`Writing data to ${excelFileName}...`);
      await workbook.xlsx.writeFile(excelFilePath);
      console.log(`Data successfully written to ${excelFileName}`);

      // Add the exported file path to the array
      exportedFiles.push({
        filename: excelFileName,
        url: `/output/${excelFileName}`
      });
    }

    // Return the array of files
    res.status(200).json({ files: exportedFiles });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
