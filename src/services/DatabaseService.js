/**
 * DatabaseService - SQLite database operations for anonymous statistics
 * Author: andreas@siglochconsulting.com
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DATABASE_PATH || './data/pitrain.db';
  }

  async initialize() {
    try {
      // Ensure data directory exists
      const dbDir = path.dirname(this.dbPath);
      await fs.mkdir(dbDir, { recursive: true });

      return new Promise((resolve, reject) => {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            console.error('❌ Database connection failed:', err);
            reject(err);
            return;
          }
          
          console.log(`📁 Connected to SQLite database: ${this.dbPath}`);
          this.createTables()
            .then(resolve)
            .catch(reject);
        });
      });
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        duration INTEGER NOT NULL,
        kpi_scores TEXT NOT NULL,
        word_count INTEGER,
        overall_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        evaluation_id INTEGER,
        type TEXT NOT NULL,
        count INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(evaluation_id) REFERENCES evaluations(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aggregate_date TEXT NOT NULL,
        avg_scores TEXT NOT NULL,
        total_count INTEGER NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of queries) {
      await this.runQuery(query);
    }
    
    console.log('✅ Database tables created/verified');
  }

  runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  getQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  allQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async storeEvaluation(data) {
    try {
      const { duration, kpi_scores, proposals, word_count, timestamp } = data;
      
      // Calculate overall score from KPIs
      const kpiValues = Object.values(kpi_scores);
      const overallScore = kpiValues.reduce((sum, kpi) => {
        const kpiTotal = Object.values(kpi).reduce((s, v) => s + v, 0);
        return sum + (kpiTotal / Object.keys(kpi).length);
      }, 0) / kpiValues.length;

      const result = await this.runQuery(
        `INSERT INTO evaluations (timestamp, duration, kpi_scores, word_count, overall_score) 
         VALUES (?, ?, ?, ?, ?)`,
        [timestamp, duration, JSON.stringify(kpi_scores), word_count, overallScore]
      );

      // Store proposal counts
      const proposalCounts = {};
      proposals.forEach(p => {
        proposalCounts[p.type] = (proposalCounts[p.type] || 0) + 1;
      });

      for (const [type, count] of Object.entries(proposalCounts)) {
        await this.runQuery(
          `INSERT INTO proposals (evaluation_id, type, count) VALUES (?, ?, ?)`,
          [result.id, type, count]
        );
      }

      console.log(`📊 Stored evaluation ${result.id} with ${proposals.length} proposals`);
      return result.id;
    } catch (error) {
      console.error('❌ Failed to store evaluation:', error);
      throw error;
    }
  }

  async getStatistics() {
    try {
      const totalEvaluations = await this.getQuery(
        'SELECT COUNT(*) as count FROM evaluations'
      );

      const avgScores = await this.getQuery(`
        SELECT 
          AVG(overall_score) as avg_overall,
          AVG(word_count) as avg_words,
          duration
        FROM evaluations 
        GROUP BY duration
      `);

      const recentEvaluations = await this.allQuery(`
        SELECT duration, overall_score, word_count, timestamp 
        FROM evaluations 
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      const proposalStats = await this.allQuery(`
        SELECT type, SUM(count) as total_count 
        FROM proposals 
        GROUP BY type 
        ORDER BY total_count DESC
      `);

      return {
        totalEvaluations: totalEvaluations?.count || 0,
        avgScores: avgScores || null,
        recentEvaluations,
        proposalStats,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get statistics:', error);
      throw error;
    }
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err);
          } else {
            console.log('📁 Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = DatabaseService;