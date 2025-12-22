// Default prices per square meter for collections
// Update these values when prices change

export const COLLECTION_DEFAULTS = {
  // Borden collections
  'forex_zwart': {
    price_per_square_meter: 7.49,
    calculation_type: 'bord'
  },
  'forex_wit': {
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
  'zwart': {
    price_per_square_meter: 18.83,
    calculation_type: 'bord'
  },
  'wit': {
    price_per_square_meter: 14.95,
    calculation_type: 'bord'
  },
  'kanaalplaten': {
    price_per_square_meter: 2.91,
    calculation_type: 'bord'
  },
  'brushed_steel': {
    price_per_square_meter: 34.55,
    calculation_type: 'bord'
  },
  'plexi_opaal': {
    price_per_square_meter: 20.55,
    calculation_type: 'bord'
  },
  'plexiglas': {
    thicknesses: {
      '3': {
        price_per_square_meter: 24.88,
        calculation_type: 'bord'
      },
      '6': {
        price_per_square_meter: 47.39,
        calculation_type: 'bord'
      },
      '8': {
        price_per_square_meter: 64.99,
        calculation_type: 'bord'
      }
    },
    default_thickness: '3',
    calculation_type: 'bord'
  },
  'magneetfolie': {
    price_per_meter: 10.55,
    calculation_type: 'rol_per_meter'
  },
  'rekkers': {
    price_per_piece: 0.82,
    calculation_type: 'stuk'
  },
  
  // Stock collections
  'rollup': {
    price_per_piece: 36.36,
    calculation_type: 'stuk'
  },
  'snijfolie': {
    items: {
      'AVERY 700 GLOSS WHITE': { price_per_meter: 5.78, calculation_type: 'rol_per_meter' },
      'AVERY 709 OCEAN BLUE': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 701 GLOSS BLACK': { price_per_meter: 3.59, calculation_type: 'rol_per_meter' },
      'AVERY 726 MEDIUM RED': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 770 RED': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 941 COSMOS BLUE': { price_per_meter: 21.47, calculation_type: 'rol_per_meter' },
      'AVERY 708 COSMOS BLUE': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 733 BLUE': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 783 SCANDINAVIAN BLUE': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 910-01 ORANGE': { price_per_meter: 21.47, calculation_type: 'rol_per_meter' },
      'AVERY 759 DARK GREY': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 707 PRIMEROSE YELLOW': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 735-01 SILVER METALLIC': { price_per_meter: 5.78, calculation_type: 'rol_per_meter' },
      'AVERY 730 MATT WHITE': { price_per_meter: 5.78, calculation_type: 'rol_per_meter' },
      'AVERY 721 MATT BLACK': { price_per_meter: 28.9, calculation_type: 'rol_per_meter' },
      'AVERY 742 TEAL': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 714 LIME': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 741 SCUBA': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 703 CHERRY REB': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 763 REGAL RED': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 725 MEDIUM GREY': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 711 FOREST GREEN': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 784 SKY BLUE': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 738-02 FIRE-ORANGE': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 739 BRIGHT YELLOW': { price_per_meter: 6.41, calculation_type: 'rol_per_meter' },
      'AVERY 836 GOLD': { price_per_meter: 10.87, calculation_type: 'rol_per_meter' },
      'AVERY C421O JAUNE SAFRAN': { price_per_meter: 8.7, calculation_type: 'rol_per_meter' },
    }
  },
  'interieurfolie': {
    items: {
      'COVERSTYL X51 COAL BLACK': { price_per_meter: 30, calculation_type: 'rol_per_meter' },
      'COVERSTYL U50 NERO MARQUINA': { price_per_meter: 17.98, calculation_type: 'rol_per_meter' },
      'COVERSTYL NH10 TERRAZZO MIXED BLUE': { price_per_meter: 20.67, calculation_type: 'rol_per_meter' },
      'COVERSTYL K1 BLACK MAT': { price_per_meter: 17, calculation_type: 'rol_per_meter' },
      'COVERSTYL NE81 CHARCOAL BLACK': { price_per_meter: 15.33, calculation_type: 'rol_per_meter' },
      'COVERSTYL B4 WEATHERED OAK': { price_per_meter: 18.48, calculation_type: 'rol_per_meter' },
      'COVERSTYL CT58 FADED GREY': { price_per_meter: 18.48, calculation_type: 'rol_per_meter' },
      'COVERSTYL AF08 WALNUT OAK': { price_per_meter: 18.48, calculation_type: 'rol_per_meter' },
      'COVERSTYL RM13 ALABASTER': { price_per_meter: 17, calculation_type: 'rol_per_meter' },
      'AVERY MPI 6021 ANTISLIP': { price_per_meter: 8.64, calculation_type: 'rol_per_meter' },
      'SPANDEX POOL85EXT': { price_per_meter: 29.55, calculation_type: 'rol_per_meter' },
    }
  },
  'flex': {
    items: {
      'FLOCK 110 YELLOW': { price_per_meter: 12.5, calculation_type: 'rol_per_meter' },
      'FLOCK 200 RED': { price_per_meter: 6.21, calculation_type: 'rol_per_meter' },
      'FLOCK 730 COOL GREY': { price_per_meter: 6.21, calculation_type: 'rol_per_meter' },
      'FLOCK 780 DARK GREY': { price_per_meter: 6.21, calculation_type: 'rol_per_meter' },
      'FLOCK 101 NEON YELLOW': { price_per_meter: 6.21, calculation_type: 'rol_per_meter' },
      'FLOCK 300 ROYAL BLUE': { price_per_meter: 6.21, calculation_type: 'rol_per_meter' },
      'FLOCK 001 WHITE': { price_per_meter: 6.21, calculation_type: 'rol_per_meter' },
      'FLOCK 180 ORANGE': { price_per_meter: 7.1, calculation_type: 'rol_per_meter' },
      'FLOCK 390 AQUA': { price_per_meter: 6.21, calculation_type: 'rol_per_meter' },
      'POLY TWILL  GOLD': { price_per_meter: 6.21, calculation_type: 'rol_per_meter' },
      'FLOCK 253 BERRY': { price_per_meter: 6.21, calculation_type: 'rol_per_meter' },
      'FLOCK 700 BLACK': { price_per_meter: 6.21, calculation_type: 'rol_per_meter' },
      'FLOCK 350 NAVY': { price_per_meter: 6.21, calculation_type: 'rol_per_meter' },
    }
  },
  'printfolie': {
    items: {
      'AVERY MPI 2000 1M37': { price_per_meter: 6.27, width_cm: 137, calculation_type: 'rol_per_meter' },
      'AVERY MPI 2000 1M60': { price_per_meter: 7.31, width_cm: 160, calculation_type: 'rol_per_meter' },
      'AVERY MPI 2004 1M37': { price_per_meter: 6.41, width_cm: 137, calculation_type: 'rol_per_meter' },
      'AVERY MPI 2006 1M37': { price_per_meter: 6.98, width_cm: 137, calculation_type: 'rol_per_meter' },
      'AVERY MPI 2020 MATT 1M37': { price_per_meter: 5.26, width_cm: 137, calculation_type: 'rol_per_meter' },
      'AVERY MPI 2040 TRANSP GLOSS 1M37': { price_per_meter: 6.26, width_cm: 137, calculation_type: 'rol_per_meter' },
      'AVERY MPI 2040 TRANSP GLOSS 1M50': { price_per_meter: 6.95, width_cm: 150, calculation_type: 'rol_per_meter' },
      'AVERY MPI 3000 1M37': { price_per_meter: 2.33, width_cm: 137, calculation_type: 'rol_per_meter' },
      'SPANDOEK MESH 1M60': { price_per_piece: 262.4, width_cm: 160, calculation_type: 'total_rol_per_meter' },
      'NESCHEN 1M37': { price_per_piece: 250.69, width_cm: 137, calculation_type: 'total_rol_per_meter' },
      'ONE WAY VISION 1M': { price_per_meter: 14.64, width_cm: 100, calculation_type: 'rol_per_meter' },
      'ONE WAY VISION 1M37': { price_per_meter: 20.05, width_cm: 137, calculation_type: 'rol_per_meter' },
      'AVERY MPI 1105 1M52': { price_per_meter: 13.24, width_cm: 152, calculation_type: 'rol_per_meter' },
      '3M TRANSPARANT CASTING 1M37': { price_per_piece: 435.8, width_cm: 137, calculation_type: 'total_rol_per_meter' },
      'SPANDOEK JET550 1M37': { price_per_piece: 213.98, width_cm: 137, calculation_type: 'total_rol_per_meter' },
      'AVERY MPI 1105 1M37': { price_per_meter: 11.77, calculation_type: 'rol_per_meter' },
      'AVERY DOL 2480 1M52': { price_per_meter: 4.99, calculation_type: 'rol_per_meter' },
      'AVERY DOL 1460 1M37': { price_per_meter: 11.8, calculation_type: 'rol_per_meter' },
      'AVERY DOL 1480 1M52': { price_per_meter: 13.24, calculation_type: 'rol_per_meter' },
      'AVERY DOL 1480 1M37': { price_per_meter: 11.93, calculation_type: 'rol_per_meter' },
      'AVERY DOL 1460 1M52': { price_per_meter: 13.24, calculation_type: 'rol_per_meter' },
      'AVERY DOL 2480 1M60': { price_per_meter: 5.25, calculation_type: 'rol_per_meter' },
      'AVERY DOL 2480 1M37': { price_per_meter: 11.93, calculation_type: 'rol_per_meter' },
      'AVERY DOL 2460 1M60': { price_per_meter: 5.18, calculation_type: 'rol_per_meter' },
      'AVERY DOL 2460 1M37': { price_per_meter: 4.43, calculation_type: 'rol_per_meter' },
      'AVERY DOL 2470 1M37': { price_per_meter: 5.09, calculation_type: 'rol_per_meter' },
      'HEXIS HI/TA WALL 1M37 VCSR101WG1': { price_per_meter: 15.59, calculation_type: 'rol_per_meter' },
      'HEXIS HI/TA LAMINAAT 1M37 PC30G2': { price_per_meter: 12.43, calculation_type: 'rol_per_meter' },
      'HEXIS VLOER LAMINAAT 1M37 GFLI130': { price_per_meter: 6.51, calculation_type: 'rol_per_meter' },
      'AVERY DOL 3460 1M37': { price_per_meter: 3.27, calculation_type: 'rol_per_meter' },
      'AVERY DOL 3460 1M60': { price_per_meter: 3.92, calculation_type: 'rol_per_meter' },
      'AVERY DOL 3480 1M60': { price_per_meter: 3.92, calculation_type: 'rol_per_meter' },
    }
  },
  'swf': {
    items: {
      'AVERY CB1550001 GREY': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY BP1140001 CARDINAL RED': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY HX20NEPB GREEN': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY AW7280008 KHAKI MATTE': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY CB151001 LIGHT BLUE': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY BM6110001 ORANGE-O': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY BM615001 YELLOW-O': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY AS1880001 CARBON FIBER BLACK': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY BJ1030003 GRAPHITE SATIN METALLIC': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY AW6720001 KHAKI SATIN': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY BO8450001 WHITE SNOW GLOSS PEARL': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY CB1520001 GLOSS BLUE': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY BP110001 RED O': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY CB1420001 GLOSS BLACK': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY LA8300001 MATTE BLACK': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY BP1660001 CHROME SILVER': { price_per_meter: 121.89, calculation_type: 'rol_per_meter' },
      'AVERY AV2090008 MATTE WHITE': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY CB1580001 GLOSS METALLIC GOLD': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'HEXIS 2087 GOLD': { price_per_meter: 81.55, calculation_type: 'rol_per_meter' },
      'AVERY BP1080001 ROCK GREY': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY AP2290001 MATTE GREY METALLIC': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
      'AVERY AS9120008 MATTE METALLIC GUNMETAL': { price_per_meter: 29.49, calculation_type: 'rol_per_meter' },
    }
  },
  'allerlei': {
    items: {
      'AVERY SURFACE CLEANER': { price_per_piece: 14.65, calculation_type: 'stuk' },
      'AVERY ADHESIVE REMOVER': { price_per_piece: 22.815, calculation_type: 'stuk' },
      'SCHILDERSTAPE': { price_per_piece: 2.69, calculation_type: 'stuk' },
      'ZWARTE DUCTAPE': { price_per_piece: 4.5, calculation_type: 'stuk' },
      'CASTAAR TAPE': { price_per_piece: 6.51, calculation_type: 'stuk' },
      'BRUINE TAPE': { price_per_piece: 1.12, calculation_type: 'stuk' },
      'BETON WEBER 25KG': { price_per_piece: 6.68 },
      'RAJA 43 X 30 X 35': { price_per_piece: 2.51 },
      'RAJA 31 X 22 X 30': { price_per_piece: 1.62 },
      'RBK 42 X 28 X 22': { price_per_piece: 1.3 },
      'PARASILICO': { price_per_piece: 7.4 },
      'XEAL PRO ZWART': { price_per_piece: 7.52 },
      'XTREME TACK WIT': { price_per_piece: 13.43 },
      'BISON KOMBI TURBO 2K': { price_per_piece: 7.81 },
      'SOUDASEAL SUPER TACK ZWART': { price_per_piece: 7.64 },
      'WD40 500ML': { price_per_piece: 9.99 },
      'MAX PRO WOOD-TACK BIO 500ML': { price_per_piece: 13.79 },
      'SOUDAL ACTIVATOR 500ML': { price_per_piece: 24.95 },
      'COVER STYL PRIMER+ 1L': { price_per_piece: 37.36 },
      'HEXIS EDGE SEAL 250ML': { price_per_piece: 21.25 },
      '3M PRIMER 94 236ML': { price_per_piece: 36.92 },
      'SOUDAFIX VE400-SF 280ML': { price_per_piece: 14.4 },
      'SOUDAL NATURAL STONE 290ML': { price_per_piece: 15.89 },
      'SOUDAL FIX ALL HIGH TACK 290ML': { price_per_piece: 9.25 },
      'ROL BLAUW KUISPAPIER': { price_per_piece: 6.21 },
      'XEAL PRO WIT': { price_per_piece: 7.52 },
    }
  },
  'buizen': {
    items: {
      'GRIJS ALVA': { price_per_piece: 21.75, calculation_type: 'stuk' },
      'LEUNINGDRAGERS GRIJS METAAL': { price_per_piece: 6.37, calculation_type: 'stuk' },
      'KOPPELSTUK GRIJS METAAL': { price_per_piece: 5.61, calculation_type: 'stuk' },
      'VOETSTUKKEN GRIJS METAAL': { price_per_piece: 2.49, calculation_type: 'stuk' },
      'LEUNINGDRAGERS ZWART METAAL': { price_per_piece: 5.25, calculation_type: 'stuk' },
      '90° ZWART METAAL': { price_per_piece: 5.77, calculation_type: 'stuk' },
      '90° GRIJS METAAL': { price_per_piece: 3.53, calculation_type: 'stuk' },
    }
  },
  'zandstraal': {
    items: {
      'ASLAN DRY APPLY 1M52': { price_per_meter: 18.16, calculation_type: 'rol_per_meter' },
      'HEXIS EDGED GLASS 1M23': { price_per_meter: 11.88, calculation_type: 'rol_per_meter' },
      'HEXIS EDGED GLASS 1M52': { price_per_meter: 12.1, calculation_type: 'rol_per_meter' },
      'HEXIS EDGED GLASS 1M50': { price_per_meter: 12.1, calculation_type: 'rol_per_meter' },
    }
  },
};

// Get default price for a collection
// If thickness is provided, will return the price for that specific thickness
// If itemName is provided, will return the price for that specific item (for stock collections)
export function getCollectionDefaults(collectionName, thickness = null, itemName = null) {
  const normalized = collectionName?.toLowerCase().trim();
  const collection = COLLECTION_DEFAULTS[normalized];
  
  if (!collection) {
    return {
      price_per_square_meter: 0,
      calculation_type: 'bord'
    };
  }
  
  // If collection has item-based pricing (for stock collections)
  if (collection.items && itemName) {
    const normalizedItemName = itemName.toUpperCase().trim();
    const itemData = collection.items[normalizedItemName];
    
    if (itemData) {
      return itemData;
    }
    
    // If item not found, return zero pricing
    return {
      price_per_square_meter: 0,
      price_per_piece: 0,
      price_per_meter: 0,
      calculation_type: collection.calculation_type || null
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
