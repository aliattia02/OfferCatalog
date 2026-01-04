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
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
  UploadTaskSnapshot,
  StorageError,
} from 'firebase/storage';
import { getDbInstance, getStorageInstance } from '../config/firebase';
import { Catalogue } from '../types';
import { Platform } from 'react-native';

export interface CatalogueMetadata {
  titleAr: string;
  titleEn: string;
  storeId: string;
  storeName: string;
  startDate: string;
  endDate: string;
  coverImage?:  string;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage:  number;
}

// Toggle between GitHub (local) and Firebase Storage
const USE_GITHUB_STORAGE = true; // Set to false when you upgrade to Firebase Blaze

/**
 * Upload a PDF catalogue (GitHub/Local version for development)
 * @param uri Local file URI
 * @param filename Filename for the PDF
 * @param onProgress Callback for upload progress
 * @returns Download URL of the uploaded file
 */
export const uploadCataloguePDFLocal = async (
  uri: string,
  filename: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    console.log('📁 Using GitHub/Local storage (temporary solution)');
    console.log('📄 File to upload:', filename);
    console.log('📍 Source URI:', uri);

    // Simulate upload progress
    if (onProgress) {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress({
          bytesTransferred: i,
          totalBytes: 100,
          percentage: i,
        });
      }
    }

    // Return the public URL path
    // This assumes you'll manually copy the file to public/catalogues/
    const publicUrl = `/catalogues/${filename}`;

    console.log('✅ File path generated:', publicUrl);
    console.log('⚠️  IMPORTANT:  Manually copy your PDF to:  public/catalogues/' + filename);

    return publicUrl;
  } catch (error) {
    console.error('❌ Local upload error:', error);
    throw error;
  }
};

/**
 * Upload a PDF catalogue to Firebase Storage (for future use)
 * @param uri Local file URI
 * @param filename Filename for the PDF
 * @param onProgress Callback for upload progress
 * @returns Download URL of the uploaded file
 */
export const uploadCataloguePDFFirebase = async (
  uri:  string,
  filename: string,
  onProgress?: (progress:  UploadProgress) => void
): Promise<string> => {
  try {
    console.log('🔥 Using Firebase Storage');
    const storage = getStorageInstance();

    // Fetch the file as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a reference to the file location
    const storageRef = ref(storage, `catalogues/${filename}`);

    // Create upload task
    const uploadTask:  UploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          // Track upload progress
          const progress:  UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          };

          if (onProgress) {
            onProgress(progress);
          }
        },
        (error: StorageError) => {
          console.error('Firebase upload error:', error);
          reject(error);
        },
        async () => {
          // Upload completed successfully, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('✅ File uploaded to Firebase:', downloadURL);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('❌ Firebase upload error:', error);
    throw error;
  }
};

/**
 * Main upload function - switches between local and Firebase
 */
export const uploadCataloguePDF = async (
  uri: string,
  filename: string,
  onProgress?:  (progress: UploadProgress) => void
): Promise<string> => {
  if (USE_GITHUB_STORAGE) {
    return uploadCataloguePDFLocal(uri, filename, onProgress);
  } else {
    return uploadCataloguePDFFirebase(uri, filename, onProgress);
  }
};

/**
 * Create a new catalogue entry in Firestore
 * @param metadata Catalogue metadata
 * @param pdfUrl URL to the PDF file
 * @returns Catalogue ID
 */
export const createCatalogue = async (
  metadata:  CatalogueMetadata,
  pdfUrl: string
): Promise<string> => {
  try {
    const db = getDbInstance();
    const cataloguesRef = collection(db, 'catalogues');

    const catalogueData = {
      ...metadata,
      pdfUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(cataloguesRef, catalogueData);
    console.log('✅ Catalogue created with ID:', docRef.id);

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating catalogue:', error);
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

    const catalogues: Catalogue[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id:  doc.id,
        titleAr: data.titleAr,
        titleEn: data. titleEn,
        storeId: data.storeId,
        storeName: data.storeName,
        startDate: data.startDate,
        endDate: data.endDate,
        pdfUrl: data.pdfUrl,
        coverImage: data. coverImage,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    console.log('✅ Fetched catalogues:', catalogues. length);
    return catalogues;
  } catch (error) {
    console.error('❌ Error fetching catalogues:', error);
    throw error;
  }
};

/**
 * Delete a catalogue (local version doesn't delete the actual file)
 * @param catalogueId Catalogue document ID
 * @param pdfUrl URL of the PDF to delete
 */
export const deleteCatalogueLocal = async (
  catalogueId: string,
  pdfUrl: string
): Promise<void> => {
  try {
    console.log('🗑️  Deleting catalogue (local mode)');

    // Delete from Firestore
    const db = getDbInstance();
    await deleteDoc(doc(db, 'catalogues', catalogueId));

    console.log('✅ Catalogue deleted from Firestore');
    console.log('⚠️  Note: PDF file still exists at:', pdfUrl);
    console.log('⚠️  Manually delete if needed:  public' + pdfUrl);
  } catch (error) {
    console.error('❌ Error deleting catalogue:', error);
    throw error;
  }
};

/**
 * Delete a catalogue from Firebase (for future use)
 * @param catalogueId Catalogue document ID
 * @param pdfUrl URL of the PDF to delete
 */
export const deleteCatalogueFirebase = async (
  catalogueId: string,
  pdfUrl: string
): Promise<void> => {
  try {
    console.log('🗑️  Deleting catalogue from Firebase');

    // Delete from Firestore
    const db = getDbInstance();
    await deleteDoc(doc(db, 'catalogues', catalogueId));

    // Delete from Storage if it's a Firebase URL
    if (pdfUrl && pdfUrl.includes('firebasestorage.googleapis.com')) {
      const storage = getStorageInstance();
      const fileRef = ref(storage, pdfUrl);
      await deleteObject(fileRef);
      console.log('✅ File deleted from Firebase Storage');
    }

    console.log('✅ Catalogue deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting catalogue:', error);
    throw error;
  }
};

/**
 * Main delete function - switches between local and Firebase
 */
export const deleteCatalogue = async (
  catalogueId: string,
  pdfUrl: string
): Promise<void> => {
  if (USE_GITHUB_STORAGE) {
    return deleteCatalogueLocal(catalogueId, pdfUrl);
  } else {
    return deleteCatalogueFirebase(catalogueId, pdfUrl);
  }
};

/**
 * Update catalogue metadata
 * @param catalogueId Catalogue document ID
 * @param updates Partial catalogue data to update
 */
export const updateCatalogue = async (
  catalogueId: string,
  updates:  Partial<CatalogueMetadata>
): Promise<void> => {
  try {
    const db = getDbInstance();
    const catalogueRef = doc(db, 'catalogues', catalogueId);

    await updateDoc(catalogueRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Catalogue updated successfully');
  } catch (error) {
    console.error('❌ Error updating catalogue:', error);
    throw error;
  }
};
