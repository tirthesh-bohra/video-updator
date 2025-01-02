const schemas = {
  videos: {
    name: 'videos',
    columns: [
      { name: 'id', type: 'TEXT', primaryKey: true },
      { name: 'filename', type: 'TEXT', notNull: true },
      { name: 'size', type: 'INTEGER', notNull: true },
      { name: 'duration', type: 'INTEGER', notNull: true },
      { name: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    ],
    indexes: [
      { 
        name: 'idx_videos_filename', 
        columns: ['filename'], 
        unique: true 
      },
      { 
        name: 'idx_videos_created_at', 
        columns: ['created_at'] 
      }
    ]
  },
  shared_links: {
    name: 'shared_links',
    columns: [
      { name: 'id', type: 'TEXT', primaryKey: true },
      { name: 'video_id', type: 'TEXT', notNull: true },
      { name: 'expires_at', type: 'DATETIME', notNull: true },
      { name: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    ],
    indexes: [
      { 
        name: 'idx_shared_links_video_id', 
        columns: ['video_id'] 
      },
      { 
        name: 'idx_shared_links_expires_at', 
        columns: ['expires_at'] 
      },
      { 
        name: 'idx_shared_links_video_expiry', 
        columns: ['video_id', 'expires_at'] 
      }
    ],
    foreignKeys: [
      {
        column: 'video_id',
        reference: {
          table: 'videos',
          column: 'id'
        },
        onDelete: 'CASCADE'
      }
    ]
  }
};

module.exports = schemas;