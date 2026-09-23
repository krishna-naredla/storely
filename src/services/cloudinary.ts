/**
 * Cloudinary Media Storage Service for Storelly OS
 * Handles signed and authorized media uploads, client-side preprocessing, and CDN asset deletion.
 *
 * Architecture:
 * - Media files (images, banners, logos, digital products) -> Cloudinary CDN
 * - Metadata and URLs -> Firestore
 * - Firebase Storage is NOT used.
 * - Persistent Data URLs are NOT permitted.
 */

import { auth } from '../config/firebase';

export const CLOUDINARY_CLOUD_NAME = 'dxbkgx6tl';
export const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
export const CLOUDINARY_API_KEY = '618932888682632';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Optional browser-side image compression preprocessing before uploading to Cloudinary.
 * Takes a File or Blob, resizes large dimensions (max 1600x1600), and returns a compressed Blob or File.
 * This saves bandwidth and upload time. It NEVER returns or stores a Data URL.
 */
export async function compressImageForUpload(
  file: File | Blob,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<Blob | File> {
  // If not an image (or if SVG/GIF/animated), return original file untouched
  if ('type' in file && file.type && !file.type.startsWith('image/')) {
    return file;
  }
  if ('type' in file && (file.type === 'image/svg+xml' || file.type === 'image/gif')) {
    return file;
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || (!window.createImageBitmap && !window.Image)) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // If image is already smaller than max dimensions and under 1.5MB, keep original
        if (width <= maxWidth && height <= maxHeight && file.size < 1.5 * 1024 * 1024) {
          resolve(file);
          return;
        }

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const fileName = 'name' in file ? (file as File).name.replace(/\.[^/.]+$/, '.webp') : 'image.webp';
              resolve(new File([blob], fileName, { type: blob.type || 'image/webp' }));
            } else {
              resolve(file);
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Temporary in-memory helper for immediate visual preview prior to upload completion.
 * @deprecated Do NOT save return value to Firestore database.
 */
export async function compressImageToDataUrl(
  file: File | Blob,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl);
        } catch {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        }
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a File or Blob to Cloudinary CDN.
 * Uses authenticated server signing with fallback to configured upload preset.
 * Strictly returns canonical HTTPS Cloudinary URL.
 * NEVER returns Data URL or Firebase Storage URL. Throws error on failure.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  onProgress?: (percent: number) => void,
  folder: string = 'storelly/media'
): Promise<string> {
  // 1. Preprocess with client-side compression (outputs WebP/JPEG Blob, NOT Data URL)
  const preparedFile = await compressImageForUpload(file);

  // 2. Determine resource type
  let resourceType = 'image';
  if ('type' in preparedFile && preparedFile.type) {
    if (preparedFile.type.startsWith('video/') || preparedFile.type.startsWith('audio/')) {
      resourceType = 'video';
    } else if (!preparedFile.type.startsWith('image/')) {
      resourceType = 'raw';
    }
  }

  // 3. Request signed authorization from Storelly backend
  let signData: any = null;
  try {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;

    const signRes = await fetch('/api/cloudinary/sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        paramsToSign: {
          folder,
        },
      }),
    });

  if (signRes.ok) {
      signData = await signRes.json();
    } else {
      const errorMsg = await signRes.text();
      throw new Error(`Failed to get Cloudinary signature: ${errorMsg}`);
    }
  } catch (err: any) {
    throw new Error(`Cloudinary authorization failed: ${err.message}`);
  }

  const cloudName = signData.cloudName || CLOUDINARY_CLOUD_NAME;
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', preparedFile);

  if (signData.signed && signData.signature) {
    formData.append('api_key', signData.apiKey);
    formData.append('timestamp', signData.timestamp.toString());
    formData.append('signature', signData.signature);
    if (folder) formData.append('folder', folder);
  } else {
    throw new Error('Cloudinary secure signing failed: server returned unsigned payload.');
  }

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);
    xhr.timeout = 30000; // 30 seconds

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response: CloudinaryUploadResult = JSON.parse(xhr.responseText);
          if (response.secure_url) {
            resolve(response.secure_url);
            return;
          }
        } catch {
          // JSON parse failed
        }
      }
      try {
        const errorJson = JSON.parse(xhr.responseText);
        reject(new Error(errorJson?.error?.message || `Cloudinary upload failed with status ${xhr.status}`));
      } catch {
        reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
      }
    };

    xhr.ontimeout = () => reject(new Error('Cloudinary upload timed out. Please check your internet connection.'));
    xhr.onerror = () => reject(new Error('Network error uploading media to Cloudinary.'));

    xhr.send(formData);
  });
}

/**
 * Validate image URL or data URI
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  // We strictly require HTTPS URLs (ideally Cloudinary) and explicitly disallow data URIs for storage
  if (trimmed.startsWith('data:image/')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Permanently delete a digital file or image from Cloudinary storage.
 * Called when a file/image is replaced or the product is deleted to save storage costs.
 */
export async function deleteCloudinaryAsset(
  urlOrPublicId: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<void> {
  if (!urlOrPublicId || urlOrPublicId.startsWith('data:')) return;

  try {
    let publicId = urlOrPublicId;
    if (urlOrPublicId.includes('cloudinary.com')) {
      const match = urlOrPublicId.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
      if (match && match[1]) {
        publicId = match[1];
      }
    }

    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    await fetch('/api/digital/delete-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ publicId, resourceType }),
    });
    console.log(`[Cloudinary Cleanup] Deleted asset: ${publicId}`);
  } catch (err) {
    console.warn('Failed to delete asset from Cloudinary:', err);
  }
}

// Backward-compatible alias for existing code
export const deleteImageFromStorage = deleteCloudinaryAsset;

/**
 * Upload any digital file (PDF, ZIP, Video, Audio, Doc, etc.) to Cloudinary
 * using backend signing with entitlement verification.
 * Strictly returns canonical HTTPS Cloudinary URL and metadata.
 * NEVER returns Data URL or Firebase Storage URL. Throws error on failure.
 */
export async function uploadDigitalFileToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{
  url: string;
  publicId?: string;
  fileSize: string;
  fileName: string;
  format?: string;
}> {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileSize = formatBytes(file.size);
  const fileName = file.name;

  // Determine resource type
  let resourceType = 'auto';
  if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
    resourceType = 'video';
  } else if (file.type.startsWith('image/')) {
    resourceType = 'image';
  } else {
    resourceType = 'raw';
  }

  // 1. Request signed upload credentials from server
  let signData: any = null;
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  try {
    const signRes = await fetch('/api/digital/sign-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        paramsToSign: {
          folder: 'storelly/digital_products',
        },
      }),
    });
    if (signRes.ok) {
      signData = await signRes.json();
    } else {
      const errorMsg = await signRes.text();
      throw new Error(`Failed to get Digital Cloudinary signature: ${errorMsg}`);
    }
  } catch (err: any) {
    throw new Error(`Digital file authorization failed: ${err.message}`);
  }

  const cloudName = signData.cloudName || CLOUDINARY_CLOUD_NAME;
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);

  if (signData.signed && signData.signature) {
    formData.append('api_key', signData.apiKey);
    formData.append('timestamp', signData.timestamp.toString());
    formData.append('signature', signData.signature);
    formData.append('folder', 'storelly/digital_products');
  } else {
    throw new Error('Cloudinary secure signing failed for digital product.');
  }

  const uploadResult = await new Promise<{ url: string; publicId?: string; format?: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);
    xhr.timeout = 120000; // 2 minutes for larger digital files

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({
            url: res.secure_url || res.url,
            publicId: res.public_id,
            format: res.format,
          });
          return;
        } catch {
          // parse failed
        }
      }
      try {
        const errorJson = JSON.parse(xhr.responseText);
        reject(new Error(errorJson?.error?.message || `Digital file upload failed with status ${xhr.status}`));
      } catch {
        reject(new Error(`Digital file upload failed with status ${xhr.status}`));
      }
    };

    xhr.ontimeout = () => reject(new Error('Digital product upload timed out. Please check your connection.'));
    xhr.onerror = () => reject(new Error('Network error uploading digital product to Cloudinary.'));
    xhr.send(formData);
  });

  return {
    url: uploadResult.url,
    publicId: uploadResult.publicId,
    format: uploadResult.format,
    fileSize,
    fileName,
  };
}

/**
 * Optimize Cloudinary URL by inserting auto-format & auto-quality flags
 */
export function getOptimizedImageUrl(url?: string, width = 600): string {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`);
  }
  return url;
}
