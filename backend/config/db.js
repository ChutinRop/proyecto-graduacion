require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'chutingod13',
    database: process.env.DB_NAME     || 'zaculeu_db',
    port:     parseInt(process.env.DB_PORT || '5433'),
});

pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
});

module.exports = pool;
