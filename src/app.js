const express = require('express');
const cors = require('cors'); // 1. Movido arriba
const bcrypt = require('bcrypt');
require('dotenv').config();
const db = require('./config/db');
const recoveryController = require('./controllers/recoveryController');
const passwordController = require('./controllers/passwordController');

const app = express();

// --- CONFIGURACIÓN GLOBAL (Debe ir ANTES de las rutas) ---
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['*'];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }

        if (corsOrigins.includes('*')) {
            callback(null, true);
            return;
        }

        const normalizedOrigin = origin.replace(/\/$/, '');
        const isAllowed = corsOrigins.some((allowedOrigin) => allowedOrigin.replace(/\/$/, '') === normalizedOrigin);

        callback(null, isAllowed);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json()); // ✅ Permite leer los datos JSON que envía React

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// --- RUTAS DE AUTENTICACIÓN ---

// 1. Registro: Guarda nombre, correo y contraseña en Docker
app.post('/api/auth/register', async (req, res) => {
    const { nombre, correo, password } = req.body;
    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        await db.query(
            'INSERT INTO usuarios (nombre, correo, password) VALUES ($1, $2, $3)', 
            [nombre, correo, passwordHash]
        );
        res.json({ message: "¡Usuario registrado con éxito en la base de datos!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al registrar: El correo ya existe o la tabla no existe." });
    }
});

// 2. Login: Verifica los datos para entrar a la "Página X"
app.post('/api/auth/login', async (req, res) => {
    const { correo, password } = req.body;
    try {
        const result = await db.query(
            'SELECT * FROM usuarios WHERE correo = $1', 
            [correo]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ message: "Correo o contraseña incorrectos." });
            return;
        }

        const usuario = result.rows[0];
        const passwordGuardada = usuario.password || '';
        let passwordValida = false;

        if (passwordGuardada.startsWith('$2a$') || passwordGuardada.startsWith('$2b$') || passwordGuardada.startsWith('$2y$')) {
            passwordValida = await bcrypt.compare(password, passwordGuardada);
        } else {
            passwordValida = passwordGuardada === password;

            if (passwordValida) {
                const saltRounds = 10;
                const nuevoHash = await bcrypt.hash(password, saltRounds);
                await db.query('UPDATE usuarios SET password = $1 WHERE id = $2', [nuevoHash, usuario.id]);
            }
        }

        if (!passwordValida) {
            res.status(401).json({ message: "Correo o contraseña incorrectos." });
            return;
        }

        res.json({ 
            message: "Inicio de sesión exitoso", 
            usuario: usuario.nombre 
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor al intentar loguear." });
    }
});

// --- RUTAS DE RECUPERACIÓN (RF-12) ---
app.post('/api/auth/recover', recoveryController.solicitarEnlace);
app.patch('/api/auth/reset-password', passwordController.cambiarPassword);

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`✅ Base de datos vinculada para el proyecto UV`);
});