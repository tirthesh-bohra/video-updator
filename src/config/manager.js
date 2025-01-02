const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const schemas = require('./schema');

class DatabaseManager {
    constructor() {
      this.db = null;
      this.dbPath = path.join(__dirname, '../../database.sqlite');
    }
  
    generateCreateTableSQL(schema) {
      const columns = schema.columns.map(col => {
        let def = `${col.name} ${col.type}`;
        if (col.primaryKey) def += ' PRIMARY KEY';
        if (col.notNull) def += ' NOT NULL';
        if (col.default) def += ` DEFAULT ${col.default}`;
        return def;
      });
  
      const foreignKeys = (schema.foreignKeys || []).map(fk => {
        return `FOREIGN KEY (${fk.column}) REFERENCES ${fk.reference.table}(${fk.reference.column})` +
          (fk.onDelete ? ` ON DELETE ${fk.onDelete}` : '');
      });
  
      let sql = `
        CREATE TABLE IF NOT EXISTS ${schema.name} (
          ${[...columns, ...foreignKeys].join(',\n        ')}
        );
      `;

      if (schema.indexes) {
        const indexStatements = schema.indexes.map(index => {
          const unique = index.unique ? 'UNIQUE' : '';
          return `
            CREATE ${unique} INDEX IF NOT EXISTS ${index.name} 
            ON ${schema.name} (${index.columns.join(', ')});
          `;
        });
        sql += indexStatements.join('\n');
      }
  
      return sql;
    }

    async getTableIndexes(tableName) {
      return new Promise((resolve, reject) => {
        this.db.all(
          `SELECT name, sql FROM sqlite_master 
           WHERE type='index' AND tbl_name=? AND name NOT LIKE 'sqlite_autoindex%'`,
          [tableName],
          (err, rows) => {
            if (err) reject(err);
            resolve(rows);
          }
        );
      });
    }

    async createIndex(tableName, index) {
      const unique = index.unique ? 'UNIQUE' : '';
      const sql = `CREATE ${unique} INDEX IF NOT EXISTS ${index.name} 
                   ON ${tableName} (${index.columns.join(', ')})`;
      await this.run(sql);
    }

    async updateTableIndexes(schema) {
      if (!schema.indexes) return;
  
      const existingIndexes = await this.getTableIndexes(schema.name);
      const existingIndexNames = existingIndexes.map(idx => idx.name);
  
      for (const index of schema.indexes) {
        if (!existingIndexNames.includes(index.name)) {
          console.log(`Creating index ${index.name} on ${schema.name}`);
          await this.createIndex(schema.name, index);
        }
      }

      for (const existingIndex of existingIndexes) {
        if (!schema.indexes.some(idx => idx.name === existingIndex.name)) {
          console.log(`Dropping obsolete index ${existingIndex.name} from ${schema.name}`);
          await this.run(`DROP INDEX IF EXISTS ${existingIndex.name}`);
        }
      }
    }
  
    async tableExists(tableName) {
      return new Promise((resolve, reject) => {
        this.db.get(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [tableName],
          (err, row) => {
            if (err) reject(err);
            resolve(!!row);
          }
        );
      });
    }
  
    async getTableInfo(tableName) {
      return new Promise((resolve, reject) => {
        this.db.all(
          `PRAGMA table_info(${tableName})`,
          (err, rows) => {
            if (err) reject(err);
            resolve(rows);
          }
        );
      });
    }
  
    async updateTableSchema(schema) {
      const tableExists = await this.tableExists(schema.name);
      
      if (!tableExists) {
        console.log(`Creating table and indexes: ${schema.name}`);
        const sql = this.generateCreateTableSQL(schema);
        
        await this.run('BEGIN TRANSACTION');
        try {
          for (const statement of sql.split(';').filter(s => s.trim())) {
            await this.run(statement);
          }
          await this.run('COMMIT');
          console.log(`Successfully created table and indexes: ${schema.name}`);
        } catch (error) {
          await this.run('ROLLBACK');
          console.error(`Error creating table ${schema.name}:`, error);
          throw error;
        }
      } else {
        console.log(`Updating existing table: ${schema.name}`);
        
        await this.run('BEGIN TRANSACTION');
        try {
          const currentColumns = await this.getTableInfo(schema.name);
          const currentColumnNames = currentColumns.map(col => col.name);
          
          for (const column of schema.columns) {
            if (!currentColumnNames.includes(column.name)) {
              console.log(`Adding column ${column.name} to ${schema.name}`);
              let alterSql = `ALTER TABLE ${schema.name} ADD COLUMN ${column.name} ${column.type}`;
              
              if (column.notNull && column.default) {
                alterSql += ` DEFAULT ${column.default} NOT NULL`;
              } else if (column.notNull) {
                alterSql += ` DEFAULT ''`;
              } else if (column.default) {
                alterSql += ` DEFAULT ${column.default}`;
              }
              
              await this.run(alterSql);
            }
          }
    
          const existingIndexes = await this.getTableIndexes(schema.name);
          const existingIndexNames = existingIndexes.map(idx => idx.name);

          for (const existingIndex of existingIndexes) {
            if (!schema.indexes?.some(idx => idx.name === existingIndex.name)) {
              console.log(`Dropping obsolete index ${existingIndex.name} from ${schema.name}`);
              await this.run(`DROP INDEX IF EXISTS ${existingIndex.name}`);
            }
          }

          if (schema.indexes) {
            for (const index of schema.indexes) {
              if (!existingIndexNames.includes(index.name)) {
                console.log(`Creating index ${index.name} on ${schema.name}`);
                const unique = index.unique ? 'UNIQUE' : '';
                await this.run(`
                  CREATE ${unique} INDEX IF NOT EXISTS ${index.name} 
                  ON ${schema.name} (${index.columns.join(', ')})
                `);
              }
            }
          }
    
          await this.run('COMMIT');
          console.log(`Successfully updated table and indexes: ${schema.name}`);
        } catch (error) {
          await this.run('ROLLBACK');
          console.error(`Error updating table ${schema.name}:`, error);
          throw error;
        }
      }
    }
  
    async initialize() {
      return new Promise((resolve, reject) => {
        this.db = new sqlite3.Database(this.dbPath, async (err) => {
          if (err) {
            console.error('Error opening database:', err);
            reject(err);
            return;
          }
  
          try {
            await this.run('PRAGMA foreign_keys = ON');
            await this.run('PRAGMA journal_mode = WAL');
            await this.run('PRAGMA synchronous = NORMAL');
            await this.run('PRAGMA cache_size = -2000');

            for (const schema of Object.values(schemas)) {
              await this.updateTableSchema(schema);
            }
  
            console.log('Database initialization completed');
            resolve(this.db);
          } catch (error) {
            console.error('Error during database initialization:', error);
            reject(error);
          }
        });
      });
    }
  
    async run(sql, params = []) {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    }
  
    async close() {
      if (this.db) {
        return new Promise((resolve, reject) => {
          this.db.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    }

    async get(sql, params = []) {
      return new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }

    async all(sql, params = []) {
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }

    getDatabase() {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      return this;
    }
}

module.exports = DatabaseManager;