import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase/firebaseConfig';

/**
 * Validates if a file is a PDF
 */
export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  // Check MIME type
  if (file.type !== 'application/pdf') {
    return {
      valid: false,
      error: 'Only PDF files are supported',
    };
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 50MB',
    };
  }

  return { valid: true };
}

/**
 * Uploads a PDF file to Firebase Storage
 */
export async function uploadPdfFile(
  userId: string,
  file: File
): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
  // Validate file
  const validation = validatePdfFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate unique file name
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}_${sanitizedFileName}`;
  const filePath = `documents/${userId}/${fileName}`;

  // Upload to Firebase Storage
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);

  // Get download URL
  const fileUrl = await getDownloadURL(storageRef);

  return {
    fileUrl,
    fileName: file.name,
    fileSize: file.size,
  };
}

/**
 * Deletes a file from Firebase Storage
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Validates file on the server side (for API routes)
 */
export function validatePdfBuffer(
  buffer: Buffer,
  mimeType: string,
  size: number
): { valid: boolean; error?: string } {
  // Check MIME type
  if (mimeType !== 'application/pdf') {
    return {
      valid: false,
      error: 'Only PDF files are supported',
    };
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 50MB',
    };
  }

  // Check PDF magic number (PDF files start with %PDF-)
  const pdfMagicNumber = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
  if (!buffer.subarray(0, 5).equals(pdfMagicNumber)) {
    return {
      valid: false,
      error: 'Invalid PDF file format',
    };
  }

  return { valid: true };
}
