const { Pool } = require('pg');

// Configuración alineada con tu contenedor Docker
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'uv_recovery_db',
    password: process.env.DB_PASSWORD || 'admin123',
    port: Number(process.env.DB_PORT) || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Verificación de conexión
pool.on('connect', () => {
    console.log('✅ Conectado a la base de datos en Docker');
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};