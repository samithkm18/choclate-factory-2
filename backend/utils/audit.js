import AuditLog from '../models/AuditLog.js';

/**
 * Log an administrative or critical system action to the database.
 * @param {string|null} userId - Mongoose ObjectId string of the user performing the action
 * @param {string} action - The action string (e.g. 'USER_PROMOTION', 'PRODUCT_DELETE')
 * @param {string|object} details - Detailed descriptive JSON or string
 * @param {string|null} ip - IP address of the request
 */
export const logAction = async (userId, action, details = '', ip = '') => {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
    const log = new AuditLog({
      user_id: userId || null,
      action,
      details: detailsStr,
      ip_address: ip
    });
    await log.save();
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
