import { db } from '../db/index.js';
import { logger } from '../utils/logger.js';

export const VotingDate = {
  find: async () => {
    try {
      const result = await db.query(
        'SELECT * FROM voting_dates ORDER BY date ASC'
      );
      return result.rows;
    } catch (error) {
      logger.error('Error finding voting dates:', error);
      throw error;
    }
  },

  findOne: async (query) => {
    try {
      const result = await db.query(
        'SELECT * FROM voting_dates WHERE date = $1',
        [query.date]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding voting date:', error);
      throw error;
    }
  },

  findOneAndUpdate: async (query, update) => {
    try {
      const result = await db.query(
        `UPDATE voting_dates 
         SET is_active = $1, is_complete = $2, updated_at = CURRENT_TIMESTAMP
         WHERE date = $3
         RETURNING *`,
        [update.isActive, update.isComplete, query.date]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating voting date:', error);
      throw error;
    }
  },

  updateMany: async (query, update) => {
    try {
      const result = await db.query(
        `UPDATE voting_dates 
         SET is_active = $1
         WHERE date != $2
         RETURNING *`,
        [update.$set.isActive, query.date.$ne]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error updating voting dates:', error);
      throw error;
    }
  }
};