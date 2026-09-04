/**
 * Image Service for Storelly OS
 * Handles client-side Canvas image resizing (max 800x800, 80% quality) and Cloudinary CDN uploads for logos and banners.
 */

export const CLOUDINARY_CLOUD_NAME = 'dxbkgx6tl';
export const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
export const CLOUDINARY_API_KEY = '618932888682632';

/**
 * Compress and resize an image file using the browser's Canvas API
 * Resizes to a maximum of 800px width/height and compresses to 80% quality before Base64 encoding.
 */
export async function compressImageToDataUrl(
  file: File | Blob,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
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
 * Upload a File to Cloudinary (Cloud Name: dxbkgx6tl)
 * Ensures it is strictly used for logos and banners.
 */
export async function uploadLogoOrBannerToCloudinary(
  file: File,
  assetType: 'logo' | 'banner',
  onProgress?: (percent: number) => void
): Promise<string> {
  if (assetType !== 'logo' && assetType !== 'banner') {
    throw new Error('Cloudinary uploads are restricted strictly to store logos and banners.');
  }

  // Request signature from server for secure upload
  let signData: any = null;
  try {
    const signRes = await fetch('/api/digital/sign-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paramsToSign: {
          folder: 'store_assets',
        },
      }),
    });
    if (signRes.ok) {
      signData = await signRes.json();
    }
  } catch (err) {
    console.warn('Failed to fetch signature', err);
  }

  const cloudName = signData?.cloudName || CLOUDINARY_CLOUD_NAME;
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  
  if (signData && signData.signature) {
    formData.append('api_key', signData.apiKey);
    formData.append('timestamp', signData.timestamp.toString());
    formData.append('signature', signData.signature);
    formData.append('folder', 'store_assets');
  } else {
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('api_key', CLOUDINARY_API_KEY);
  }

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.timeout = 15000;

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
          const response = JSON.parse(xhr.responseText);
          if (response.secure_url) {
            resolve(response.secure_url);
            return;
          }
        } catch {
          // fallback
        }
      }
      reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
    };

    xhr.ontimeout = () => reject(new Error('Cloudinary upload timed out'));
    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));

    xhr.send(formData);
  }).catch(async (err) => {
    console.warn('Cloudinary upload error, falling back to compressed local data URL:', err);
    return await compressImageToDataUrl(file, 800, 800, 0.8);
  });
}
