import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary only if credentials are set
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary Storage Service Configured Successfully.');
} else {
  console.log('Cloudinary credentials missing. Defaulting to Local folder uploads.');
}

/**
 * Uploads a local file to Cloudinary.
 * @param {string} localFilePath - Path to the local file saved by multer.
 * @param {string} resourceType - 'image', 'video', or 'auto'.
 * @returns {Promise<string|null>} Secure URL if uploaded to Cloudinary, null otherwise.
 */
export const uploadToCloudinary = async (localFilePath, resourceType = 'auto') => {
  if (!isCloudinaryConfigured) {
    return null;
  }
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      localFilePath,
      { resource_type: resourceType, folder: 'manis_chocolate_factory' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error details:', error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
  });
};

/**
 * Attempts to delete an asset from Cloudinary based on its URL.
 * @param {string} url - Secure URL of the Cloudinary asset.
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (url) => {
  if (!isCloudinaryConfigured || !url || !url.includes('res.cloudinary.com')) {
    return;
  }
  try {
    // Extract public ID from URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v12345/folder/public_id.jpg
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const publicIdWithExt = lastPart.split('.')[0];
    
    // Check if there is folder name
    const folderIdx = parts.indexOf('manis_chocolate_factory');
    let publicId = publicIdWithExt;
    if (folderIdx !== -1) {
      publicId = 'manis_chocolate_factory/' + publicIdWithExt;
    }

    const resourceType = url.includes('/video/') ? 'video' : 'image';

    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`Cloudinary Asset Deleted: ${publicId}`);
  } catch (err) {
    console.error('Error deleting Cloudinary asset:', err);
  }
};
