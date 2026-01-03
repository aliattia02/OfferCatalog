// src/data/catalogueRegistry.ts
// Registry of all PDF catalogues - add new files here! 

import { Platform } from 'react-native';
import type { Catalogue } from '../types';
import { 
  parseCatalogueFilename, 
  createCatalogueFromParsed,
  getCatalogueStatus,
  type CatalogueStatus 
} from '../utils/catalogueUtils';

/**
 * List of all PDF files in public/catalogues (for web) and assets/catalogues (for native)
 * 
 * ⚠️ IMPORTANT: When you add a new PDF file, add its filename here!
 * 
 * Naming convention:  {storeName}_{startDate}_{endDate}.pdf
 * Example: kazyon_2025-12-23_2026-01-29.pdf
 */
export const PDF_FILES: string[] = [
  // Add your PDF filenames here: 
  'kazyon_2025-12-23_2026-1-29.pdf',
  'catalogue_92b7a97e_1765366806.pdf',
  
  // Add more files as needed: 
  // 'carrefour_2025-12-20_2025-12-27.pdf',
  // 'hyperone_2025-12-15_2025-12-22.pdf',
];

/**
 * Extended Catalogue type with status
 */
export interface CatalogueWithStatus extends Catalogue {
  status: CatalogueStatus;
  parsedInfo: ReturnType<typeof parseCatalogueFilename>;
}

/**
 * Get all catalogues from the registry
 */
export const getAllCatalogues = (): CatalogueWithStatus[] => {
  return PDF_FILES.map((filename, index) => {
    const parsed = parseCatalogueFilename(filename);
    const catalogue = createCatalogueFromParsed(parsed, index);
    const status = getCatalogueStatus(parsed. startDate, parsed. endDate);
    
    return {
      ...catalogue,
      status,
      parsedInfo: parsed,
    };
  });
};

/**
 * Get active catalogues only
 */
export const getActiveCatalogues = (): CatalogueWithStatus[] => {
  return getAllCatalogues().filter(c => c.status === 'active');
};

/**
 * Get upcoming catalogues
 */
export const getUpcomingCatalogues = (): CatalogueWithStatus[] => {
  return getAllCatalogues().filter(c => c. status === 'upcoming');
};

/**
 * Get expired catalogues
 */
export const getExpiredCatalogues = (): CatalogueWithStatus[] => {
  return getAllCatalogues().filter(c => c.status === 'expired');
};

/**
 * Get catalogues grouped by status
 */
export const getCataloguesGroupedByStatus = () => {
  const all = getAllCatalogues();
  
  return {
    active: all.filter(c => c.status === 'active'),
    upcoming: all.filter(c => c. status === 'upcoming'),
    expired: all.filter(c => c.status === 'expired'),
    all,
  };
};

/**
 * Get catalogues by store
 */
export const getCataloguesByStore = (storeId: string): CatalogueWithStatus[] => {
  return getAllCatalogues().filter(c => c.storeId === storeId);
};

/**
 * Get a single catalogue by ID
 */
export const getCatalogueById = (id:  string): CatalogueWithStatus | undefined => {
  return getAllCatalogues().find(c => c.id === id);
};

// Export for backward compatibility
export const catalogues = getAllCatalogues();