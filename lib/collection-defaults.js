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
  // Add more collections here as needed
  // 'collection_name': {
  //   price_per_square_meter: 0.00,
  //   calculation_type: 'bord'
  // }
};

// Get default price for a collection
export function getCollectionDefaults(collectionName) {
  const normalized = collectionName?.toLowerCase().trim();
  return COLLECTION_DEFAULTS[normalized] || {
    price_per_square_meter: 0,
    calculation_type: 'bord'
  };
}
