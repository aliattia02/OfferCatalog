// src/services/adminService.ts
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Catalogue } from '../types';

export interface CatalogueMetadata {
  titleAr: string;
  titleEn: string;
  storeId: string;
  storeName: string;
  startDate: string;
  endDate: string;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

/**
 * Create a new catalogue entry in Firestore
 * NOTE: This is now simplified - the actual upload and conversion
 * happens in CatalogueUploadForm.tsx
 */
export const createCatalogue = async (
  metadata: CatalogueMetadata,
  pdfUrl: string,
  coverImageUrl: string,
  pages: Array<{ pageNumber: number; imageUrl: string; offers?: string[] }>
): Promise<string> => {
  try {
    const catalogueData = {
      storeId: metadata.storeId,
      storeName: metadata.storeName,
      titleAr: metadata.titleAr,
      titleEn: metadata.titleEn,
      startDate: metadata.startDate,
      endDate: metadata.endDate,
      coverImage: coverImageUrl,
      pdfUrl: pdfUrl,
      pages: pages,
      totalPages: pages.length,
      pdfProcessed: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'catalogues'), catalogueData);
    console.log('✅ Catalogue created with ID:', docRef.id);

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating catalogue:', error);
    throw error;
  }
};

/**
 * Delete a catalogue and all its associated files
 */
export const deleteCatalogue = async (catalogueId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting catalogue:', catalogueId);

    // Delete Firestore document
    await deleteDoc(doc(db, 'catalogues', catalogueId));
    console.log('✅ Deleted Firestore document');

    // Try to delete PDF file
    try {
      const pdfRef = ref(storage, `catalogues/${catalogueId}.pdf`);
      await deleteObject(pdfRef);
      console.log('✅ Deleted PDF file');
    } catch (error) {
      console.log('⚠️ PDF file not found or already deleted');
    }

    // Try to delete cover image
    try {
      const coverRef = ref(storage, `catalogue-covers/${catalogueId}.jpg`);
      await deleteObject(coverRef);
      console.log('✅ Deleted cover image');
    } catch (error) {
      console.log('⚠️ Cover image not found or already deleted');
    }

    // Try to delete all page images
    try {
      const pagesRef = ref(storage, `catalogue-pages/${catalogueId}`);
      const pagesList = await listAll(pagesRef);

      await Promise.all(
        pagesList.items.map(item => deleteObject(item))
      );

      console.log(`✅ Deleted ${pagesList.items.length} page images`);
    } catch (error) {
      console.log('⚠️ Page images not found or already deleted');
    }

    console.log('✅ Catalogue deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting catalogue:', error);
    throw error;
  }
};

/**
 * Get all catalogues from Firestore
 */
export const getAllCatalogues = async (): Promise<Catalogue[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'catalogues'));

    const catalogues: Catalogue[] = [];
    querySnapshot.forEach((doc) => {
      catalogues.push({
        id: doc.id,
        ...doc.data(),
      } as Catalogue);
    });

    return catalogues;
  } catch (error) {
    console.error('❌ Error fetching catalogues:', error);
    throw error;
  }
};

/**
 * Upload a blob/file to Firebase Storage
 * Generic helper function
 */
export const uploadFileToStorage = async (
  path: string,
  file: Blob | File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);

    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    throw error;
  }
};