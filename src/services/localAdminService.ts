// src/services/localAdminService. ts
// Local admin service for development - saves catalogues locally without Firebase

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Catalogue } from '../types';

const LOCAL_CATALOGUES_KEY = 'local_catalogues';

export interface LocalCatalogueMetadata {
  id: string;
  titleAr: string;
  titleEn: string;
  storeId: string;
  storeName: string;
  startDate: string;
  endDate: string;
  pdfFileName: string;
  pdfUrl: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate a unique ID for catalogues
 */
const generateId = (): string => {
  return `catalogue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate PDF filename from metadata
 * Format: {storeId}_{startDate}_{endDate}.pdf
 */
export const generatePdfFilename = (storeId: string, startDate:  string, endDate: string): string => {
  const cleanStartDate = startDate.replace(/\//g, '-');
  const cleanEndDate = endDate.replace(/\//g, '-');
  return `${storeId}_${cleanStartDate}_${cleanEndDate}.pdf`;
};

/**
 * Get all local catalogues from AsyncStorage
 */
export const getLocalCatalogues = async (): Promise<LocalCatalogueMetadata[]> => {
  try {
    const data = await AsyncStorage.getItem(LOCAL_CATALOGUES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error getting local catalogues:', error);
    return [];
  }
};

/**
 * Save a new catalogue locally
 * Note: The actual PDF file must be manually copied to public/catalogues/
 */
export const createLocalCatalogue = async (
  metadata: {
    titleAr: string;
    titleEn: string;
    storeId: string;
    storeName: string;
    startDate: string;
    endDate:  string;
  },
  pdfFileName: string
): Promise<LocalCatalogueMetadata> => {
  try {
    const catalogues = await getLocalCatalogues();
    
    const newCatalogue: LocalCatalogueMetadata = {
      id: generateId(),
      ...metadata,
      pdfFileName,
      pdfUrl: `/catalogues/${pdfFileName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    catalogues.unshift(newCatalogue);
    await AsyncStorage.setItem(LOCAL_CATALOGUES_KEY, JSON.stringify(catalogues));

    console.log('[LocalAdmin] Catalogue created:', newCatalogue. id);
    return newCatalogue;
  } catch (error) {
    console.error('Error creating local catalogue:', error);
    throw error;
  }
};

/**
 * Delete a catalogue from local storage
 */
export const deleteLocalCatalogue = async (catalogueId: string): Promise<void> => {
  try {
    const catalogues = await getLocalCatalogues();
    const filtered = catalogues.filter(c => c.id !== catalogueId);
    await AsyncStorage.setItem(LOCAL_CATALOGUES_KEY, JSON.stringify(filtered));
    console.log('[LocalAdmin] Catalogue deleted:', catalogueId);
  } catch (error) {
    console.error('Error deleting local catalogue:', error);
    throw error;
  }
};

/**
 * Convert local catalogues to app Catalogue format
 */
export const convertToAppCatalogues = (localCatalogues: LocalCatalogueMetadata[]): Catalogue[] => {
  return localCatalogues.map(local => ({
    id: local. id,
    storeId: local.storeId,
    titleAr: local.titleAr,
    titleEn: local.titleEn,
    startDate: local.startDate,
    endDate: local.endDate,
    coverImage: '', // Will use placeholder
    pdfUrl: local.pdfUrl,
    pages: [],
  }));
};

/**
 * Instructions for manually adding PDFs
 */
export const getUploadInstructions = (pdfFileName: string): string => {
  return `
📁 لإضافة ملف PDF: 

1. انسخ ملف PDF إلى المجلد التالي:
   public/catalogues/${pdfFileName}

2. أعد تشغيل التطبيق (npm start)

3. سيظهر الكتالوج في التطبيق تلقائياً

⚠️ ملاحظة:  اسم الملف يجب أن يكون بالضبط: 
   ${pdfFileName}
  `.trim();
};

/**
 * Check if a PDF file exists (web only)
 */
export const checkPdfExists = async (pdfFileName: string): Promise<boolean> => {
  if (Platform.OS !== 'web') {
    return true; // Can't check on native, assume it exists
  }
  
  try {
    const response = await fetch(`/catalogues/${pdfFileName}`, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Update the catalogue registry file content
 * Returns the content that should be added to catalogueRegistry.ts
 */
export const getRegistryUpdateCode = async (): Promise<string> => {
  const catalogues = await getLocalCatalogues();
  const fileNames = catalogues.map(c => `  '${c.pdfFileName}',`).join('\n');
  
  return `
// Add these to PDF_FILES array in src/data/catalogueRegistry.ts:
export const PDF_FILES:  string[] = [
${fileNames}
];
  `.trim();
};