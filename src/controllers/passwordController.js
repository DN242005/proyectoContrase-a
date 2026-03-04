const db = require('../config/db');
const bcrypt = require('bcrypt');

const cambiarPassword = async (req, res) => {
    const { token, nuevaPassword } = req.body;

    // Validación básica de entrada
    if (!token || !nuevaPassword) {
        return res.status(400).json({ message: "Token y nueva contraseña son requeridos." });
    }

    try {
        // 1. Buscamos el token. Quitamos 'AND expiracion > NOW()' temporalmente 
        // para evitar errores de zona horaria entre Docker y tu PC.
        const result = await db.query(
            'SELECT * FROM tokens_restablecimiento WHERE token = $1 AND usado = FALSE', 
            [token]
        );

        // 2. Si no hay resultados, es porque el token no existe o ya se usó
        if (result.rows.length === 0) {
            return res.status(400).json({ message: "El enlace es inválido o ya fue utilizado." });
        }

        const tokenData = result.rows[0];
        
        // 3. Verificación manual de expiración (opcional pero más segura)
        const ahora = new Date();
        if (tokenData.expiracion < ahora) {
             return res.status(400).json({ message: "El enlace ha expirado." });
        }

        const idUsuario = tokenData.id_usuario;

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(nuevaPassword, saltRounds);

        // 4. Actualizar la password del usuario
        const updateResult = await db.query(
            'UPDATE usuarios SET password = $1 WHERE id = $2',
            [passwordHash, idUsuario]
        );

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ message: "No se encontró el usuario para actualizar la contraseña." });
        }

        // 5. Marcar como usado inmediatamente (Regla de un solo uso)
        await db.query(
            'UPDATE tokens_restablecimiento SET usado = TRUE WHERE token = $1',
            [token]
        );

        console.log(`✅ Éxito: Password actualizada para usuario ID: ${idUsuario}`);

        return res.json({ message: "¡Tu contraseña ha sido actualizada con éxito!" });

    } catch (error) {
        console.error("❌ Error en cambiarPassword:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
};

module.exports = { cambiarPassword };