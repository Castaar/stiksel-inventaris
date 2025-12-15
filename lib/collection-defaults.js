// Default prices per square meter for collections
// Update these values when prices change

export const COLLECTION_DEFAULTS = {
  // Borden collections
  'forex_zwart': {
    price_per_square_meter: 4.76,
    calculation_type: 'bord'
  },
  'forex_wit': {
    price_per_square_meter: 6.08,
    calculation_type: 'bord'
  },
  'borden_forex_wit': {
    thicknesses: {
      '1': {
        price_per_square_meter: 4.81,
        calculation_type: 'bord'
      },
      '3': {
        price_per_square_meter: 5.83,
        calculation_type: 'bord'
      },
      '4': {
        price_per_square_meter: 8.75,
        calculation_type: 'bord'
      },
      '5': {
        price_per_square_meter: 9.46,
        calculation_type: 'bord'
      },
      '8': {
        price_per_square_meter: 14.89,
        calculation_type: 'bord'
      },
      '10': {
        price_per_square_meter: 18.07,
        calculation_type: 'bord'
      }
    },
    default_thickness: '3',
    calculation_type: 'bord'
  },
  'borden_zwart': {
    price_per_square_meter: 6.08,
    calculation_type: 'bord'
  },
  'borden_wit': {
    price_per_square_meter: 4.58,
    calculation_type: 'bord'
  },
  'borden_kanaalplaten': {
    price_per_square_meter: 12.50,
    calculation_type: 'bord'
  },
  'borden_plexiglas': {
    price_per_square_meter: 151.46,
    calculation_type: 'bord'
  },
  'stock_magneetfolie': {
    price_per_meter: 10.55,
    calculation_type: 'rol_per_meter'
  },
  'stock_rekkers': {
    price_per_piece: 0.82,
    calculation_type: 'stuk'
  },
};

// Get default price for a collection
// If thickness is provided, will return the price for that specific thickness
export function getCollectionDefaults(collectionName, thickness = null) {
  const normalized = collectionName?.toLowerCase().trim();
  const collection = COLLECTION_DEFAULTS[normalized];
  
  if (!collection) {
    return {
      price_per_square_meter: 0,
      calculation_type: 'bord'
    };
  }
  
  // If collection has thickness-based pricing
  if (collection.thicknesses) {
    const thicknessKey = thickness?.toString() || collection.default_thickness;
    const thicknessData = collection.thicknesses[thicknessKey];
    
    if (thicknessData) {
      return thicknessData;
    }
    
    // Fallback to default thickness if specified thickness not found
    return collection.thicknesses[collection.default_thickness] || {
      price_per_square_meter: 0,
      calculation_type: collection.calculation_type || 'bord'
    };
  }
  
  // Return regular collection data
  return collection;
}
