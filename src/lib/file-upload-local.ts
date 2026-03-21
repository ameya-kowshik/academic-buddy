import { writeFile, mkdir, unlink, access } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { constants } from 'fs';

/**
 * Local file storage implementation for development
 * Stores files in the public/uploads directory
 */

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'documents');

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
      console.log('[Local Storage] Created upload directory:', UPLOAD_DIR);
    }
    
    // Verify directory is writable
    await access(UPLOAD_DIR, constants.W_OK);
  } catch (error) {
    console.error('[Local Storage] Failed to create/access upload directory:', error);
    throw new Error(`Upload directory not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload file to local storage
 */
export async function uploadFileToLocalStorage(
  userId: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    console.log('[Local Storage] Starting upload:', fileName);
    
    await ensureUploadDir();
    
    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${userId}_${timestamp}_${sanitizedFileName}`;
    const filePath = join(UPLOAD_DIR, filename);
    
    console.log('[Local Storage] Writing file to:', filePath);
    
    // Write file to disk
    await writeFile(filePath, buffer);
    
    // Verify file was written
    if (!existsSync(filePath)) {
      throw new Error('File was not written to disk');
    }
    
    // Return public URL
    const publicUrl = `/uploads/documents/${filename}`;
    
    console.log('[Local Storage] File uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('[Local Storage] Upload error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload file to local storage: ${error.message}`);
    }
    throw new Error('Failed to upload file to local storage');
  }
}

/**
 * Delete file from local storage
 */
export async function deleteFileFromLocalStorage(fileUrl: string): Promise<void> {
  try {
    console.log('[Local Storage] Starting deletion for URL:', fileUrl);
    
    // Extract filename from URL
    const filename = fileUrl.split('/').pop();
    if (!filename) {
      console.error('[Local Storage] Invalid file URL - no filename found');
      throw new Error('Invalid file URL');
    }
    
    console.log('[Local Storage] Extracted filename:', filename);
    
    const filePath = join(UPLOAD_DIR, filename);
    console.log('[Local Storage] Full file path:', filePath);
    
    // Check if file exists before deleting
    if (existsSync(filePath)) {
      console.log('[Local Storage] File exists, deleting...');
      await unlink(filePath);
      
      // Verify deletion
      if (existsSync(filePath)) {
        throw new Error('File still exists after deletion attempt');
      }
      
      console.log('[Local Storage] File deleted successfully:', filename);
    } else {
      console.warn('[Local Storage] File not found at path:', filePath);
      console.warn('[Local Storage] Skipping deletion - file may have been already deleted');
    }
  } catch (error) {
    console.error('[Local Storage] Delete error:', error);
    
    // Provide detailed error message
    if (error instanceof Error) {
      throw new Error(`Failed to delete file from local storage: ${error.message}`);
    }
    throw new Error('Failed to delete file from local storage: Unknown error');
  }
}
