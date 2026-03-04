const recoveryService = require('../services/recoveryService');

const solicitarEnlace = async (req, res) => {
    try {
        const { correo } = req.body;

        // 1. Validación de entrada
        if (!correo) {
            return res.status(400).json({ message: "El correo es obligatorio." });
        }

        // 2. Procesar la recuperación (Genera el token en la DB de Docker)
        const resultado = await recoveryService.procesarRecuperacion(correo);

        // 3. Respuesta al usuario
        if (resultado.status >= 500) {
            return res.status(resultado.status).json({
                message: resultado.message || 'Error al enviar correo de recuperación.'
            });
        }

        return res.status(resultado.status).json({ 
            message: "Si el correo está registrado, recibirás un enlace de recuperación en breve." 
        });
        
    } catch (error) {
        console.error("Error en Controller:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
};

module.exports = { solicitarEnlace };