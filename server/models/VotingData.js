import { db } from '../db/index.js';
import { logger } from '../utils/logger.js';

export const VotingData = {
  create: async (data) => {
    try {
      const result = await db.query(
        `INSERT INTO voting_data 
         (place_id, votes_count, male_voters, female_voters, date, submitted_by_user_id, submitted_by_role, submitted_by_place_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          data.placeId,
          data.votesCount,
          data.maleVoters,
          data.femaleVoters,
          data.date,
          data.submittedBy.userId,
          data.submittedBy.role,
          data.submittedBy.placeName
        ]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating voting data:', error);
      throw error;
    }
  },

  find: async (query = {}) => {
    try {
      let sql = 'SELECT * FROM voting_data';
      const values = [];
      const conditions = [];

      if (query.date) {
        conditions.push('date = $' + (values.length + 1));
        values.push(query.date);
      }

      if (query.placeId) {
        conditions.push('place_id = $' + (values.length + 1));
        values.push(query.placeId);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY created_at DESC';

      const result = await db.query(sql, values);
      return result.rows;
    } catch (error) {
      logger.error('Error finding voting data:', error);
      throw error;
    }
  },

  aggregate: async (pipeline) => {
    try {
      // Simple aggregation for now - can be expanded based on needs
      const result = await db.query(`
        SELECT 
          SUM(votes_count) as total_votes,
          SUM(male_voters) as total_male,
          SUM(female_voters) as total_female
        FROM voting_data
        ${pipeline.date ? 'WHERE date = $1' : ''}
      `, pipeline.date ? [pipeline.date] : []);

      return result.rows;
    } catch (error) {
      logger.error('Error aggregating voting data:', error);
      throw error;
    }
  }
};