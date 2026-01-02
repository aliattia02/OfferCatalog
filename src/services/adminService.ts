// src/services/adminService.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
} from 'firebase/storage';
import { getDbInstance, getStorageInstance } from '../config/firebase';
import { Catalogue } from '../types';

export interface CatalogueMetadata {
  titleAr: string;
  titleEn: string;
  storeId: string;
  storeName: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

/**
 * Upload a PDF catalogue to Firebase Storage
 * @param uri Local file URI
 * @param filename Filename for the PDF
 * @param onProgress Callback for upload progress
 * @returns Download URL of the uploaded file
 */
export const uploadCataloguePDF = async (
  uri: string,
  filename: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    const storage = getStorageInstance();
    
    // Fetch the file as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a reference to the file location
    const storageRef = ref(storage, `catalogues/${filename}`);

    // Create upload task
    const uploadTask: UploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress: UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          };
          
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Upload completed successfully, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('Error uploading catalogue PDF:', error);
    throw error;
  }
};

/**
 * Create a new catalogue entry in Firestore
 * @param metadata Catalogue metadata
 * @param pdfUrl PDF download URL
 * @returns Catalogue ID
 */
export const createCatalogue = async (
  metadata: CatalogueMetadata,
  pdfUrl: string
): Promise<string> => {
  try {
    const db = getDbInstance();
    const cataloguesRef = collection(db, 'catalogues');

    const catalogueData = {
      ...metadata,
      pdfUrl,
      pages: [], // Will be populated later if needed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(cataloguesRef, catalogueData);
    console.log('Catalogue created with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating catalogue:', error);
    throw error;
  }
};

/**
 * Update a catalogue entry in Firestore
 * @param catalogueId Catalogue ID
 * @param metadata Updated metadata
 */
export const updateCatalogue = async (
  catalogueId: string,
  metadata: Partial<CatalogueMetadata>
): Promise<void> => {
  try {
    const db = getDbInstance();
    const catalogueRef = doc(db, 'catalogues', catalogueId);

    await updateDoc(catalogueRef, {
      ...metadata,
      updatedAt: serverTimestamp(),
    });

    console.log('Catalogue updated:', catalogueId);
  } catch (error) {
    console.error('Error updating catalogue:', error);
    throw error;
  }
};

/**
 * Delete a catalogue and its PDF file
 * @param catalogueId Catalogue ID
 * @param pdfUrl PDF download URL
 */
export const deleteCatalogue = async (
  catalogueId: string,
  pdfUrl: string
): Promise<void> => {
  try {
    const db = getDbInstance();
    const storage = getStorageInstance();

    // Delete the PDF file from storage
    if (pdfUrl && pdfUrl.includes('firebase')) {
      const pdfRef = ref(storage, pdfUrl);
      await deleteObject(pdfRef);
    }

    // Delete the Firestore document
    const catalogueRef = doc(db, 'catalogues', catalogueId);
    await deleteDoc(catalogueRef);

    console.log('Catalogue deleted:', catalogueId);
  } catch (error) {
    console.error('Error deleting catalogue:', error);
    throw error;
  }
};

/**
 * Get all catalogues from Firestore
 * @returns Array of catalogues
 */
export const getAllCatalogues = async (): Promise<Catalogue[]> => {
  try {
    const db = getDbInstance();
    const cataloguesRef = collection(db, 'catalogues');
    const q = query(cataloguesRef, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const catalogues: Catalogue[] = [];

    querySnapshot.forEach((doc) => {
      catalogues.push({
        id: doc.id,
        ...doc.data(),
      } as Catalogue);
    });

    return catalogues;
  } catch (error) {
    console.error('Error getting catalogues:', error);
    throw error;
  }
};

/**
 * Get catalogues by store ID
 * @param storeId Store ID
 * @returns Array of catalogues
 */
export const getCataloguesByStore = async (storeId: string): Promise<Catalogue[]> => {
  try {
    const db = getDbInstance();
    const cataloguesRef = collection(db, 'catalogues');
    const q = query(
      cataloguesRef,
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const catalogues: Catalogue[] = [];

    querySnapshot.forEach((doc) => {
      catalogues.push({
        id: doc.id,
        ...doc.data(),
      } as Catalogue);
    });

    return catalogues;
  } catch (error) {
    console.error('Error getting catalogues by store:', error);
    throw error;
  }
};
