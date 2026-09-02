/**
 * Cloudinary Integration with Client-Side Fallback for Storelly OS
 * Cloud Name: o2pfmu7m
 * Upload Preset: ml_default
 */

export const CLOUDINARY_CLOUD_NAME = 'dxbkgx6tl';
export const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
export const CLOUDINARY_API_KEY = '618932888682632';
export const CLOUDINARY_API_SECRET = 'NwVtyH9n3GJDgeTXivGga1O6diY';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Compress an image file to a lightweight data URL in the browser
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

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, then jpeg
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
 * Upload a File or Blob directly to Cloudinary using the unsigned preset,
 * with automatic fallback to high-quality compressed Base64 Data URL.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  onProgress?: (percent: number) => void
): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('api_key', CLOUDINARY_API_KEY);

    const cloudUrl = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.timeout = 12000; // 12 seconds timeout

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
            // fallback
          }
        }
        reject(new Error(`Cloudinary upload returned status ${xhr.status}`));
      };

      xhr.ontimeout = () => reject(new Error('Cloudinary upload timed out'));
      xhr.onerror = () => reject(new Error('Network error during image upload'));

      xhr.send(formData);
    });

    return cloudUrl;
  } catch (cloudErr) {
    console.warn('Cloudinary upload skipped or failed, using high-res local image compression fallback:', cloudErr);
    // Instant seamless fallback to browser-based compressed image
    const localDataUrl = await compressImageToDataUrl(file);
    if (onProgress) onProgress(100);
    return localDataUrl;
  }
}

/**
 * Validate image URL or data URI
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Permanently delete a digital file or image from Cloudinary storage bucket.
 * This is called when a file/image is replaced or the product is deleted to save storage costs.
 */
export async function deleteImageFromStorage(urlOrPublicId: string, resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'): Promise<void> {
  if (!urlOrPublicId || urlOrPublicId.startsWith('data:')) return; // Data URLs don't consume bucket storage
  
  try {
    let publicId = urlOrPublicId;
    if (urlOrPublicId.includes('cloudinary.com')) {
      const match = urlOrPublicId.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
      if (match && match[1]) {
        publicId = match[1];
      }
    }
    
    await fetch('/api/digital/delete-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId, resourceType }),
    });
    console.log(`[Storage Cleanup] Deleted file from Cloudinary: ${publicId}`);
  } catch (err) {
    console.warn('Failed to delete file from Cloudinary:', err);
  }
}

/**
 * Upload any digital file (PDF, ZIP, Video, Audio, Doc, etc.) to Cloudinary
 * using backend signing with local client fallback.
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
  // Format file size
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
  if (file.type.startsWith('video/')) resourceType = 'video';
  else if (file.type.startsWith('audio/')) resourceType = 'video';
  else if (file.type.startsWith('image/')) resourceType = 'image';
  else resourceType = 'raw';

  try {
    // 1. Request signature from server
    let signData: any = null;
    try {
      const signRes = await fetch('/api/digital/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paramsToSign: {
            folder: 'digital_products',
          },
        }),
      });
      if (signRes.ok) {
        signData = await signRes.json();
      }
    } catch {
      // Ignore signing error and fallback to preset
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${signData?.cloudName || CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    const formData = new FormData();
    formData.append('file', file);

    if (signData && signData.signature) {
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp.toString());
      formData.append('signature', signData.signature);
      formData.append('folder', 'digital_products');
    } else {
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('api_key', CLOUDINARY_API_KEY);
    }

    const uploadResult = await new Promise<{ url: string; publicId?: string; format?: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl, true);
      xhr.timeout = 60000; // 60s for larger digital files

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
            // parse error
          }
        }
        reject(new Error(`Upload failed with status ${xhr.status}`));
      };

      xhr.ontimeout = () => reject(new Error('File upload timed out'));
      xhr.onerror = () => reject(new Error('Network error uploading file'));
      xhr.send(formData);
    });

    return {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      format: uploadResult.format,
      fileSize,
      fileName,
    };
  } catch (err) {
    console.warn('Direct upload failed, using in-memory data URL fallback:', err);
    // Read as Data URL fallback for offline / demo mode
    const dataUrl = await new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

    if (onProgress) onProgress(100);

    return {
      url: dataUrl,
      fileSize,
      fileName,
    };
  }
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

