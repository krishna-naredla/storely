/**
 * Image Service for Storelly OS
 * Unified proxy to Cloudinary media architecture.
 */

export {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_API_KEY,
  compressImageForUpload,
  compressImageToDataUrl,
  uploadToCloudinary,
  uploadDigitalFileToCloudinary,
  deleteCloudinaryAsset,
  deleteImageFromStorage,
  isValidImageUrl,
  getOptimizedImageUrl,
} from './cloudinary';

import { uploadToCloudinary } from './cloudinary';

/**
 * Upload a File to Cloudinary (used by store logos, banners, etc.)
 */
export async function uploadLogoOrBannerToCloudinary(
  file: File,
  _assetType: 'logo' | 'banner' = 'logo',
  onProgress?: (percent: number) => void
): Promise<string> {
  return await uploadToCloudinary(file, onProgress, 'storelly/branding');
}
