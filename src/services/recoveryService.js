const nodemailer = require('nodemailer');
const db = require('../config/db'); 
const crypto = require('crypto');

// FUNCIÓN 1: Para enviar el correo
const procesarRecuperacion = async (correo) => {
    const userRes = await db.query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
    
    if (userRes.rows.length === 0) {
        return { status: 200, message: "Proceso iniciado" }; 
    }

    const userId = userRes.rows[0].id;
    const token = crypto.randomBytes(32).toString('hex'); 

    await db.query(
        'INSERT INTO tokens_restablecimiento (id_usuario, token, usado) VALUES ($1, $2, false)',
        [userId, token]
    );

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const enlace = `${frontendUrl}/?token=${token}`;

    try {
        await transporter.sendMail({
            from: `"Sistema Académico UV" <${process.env.SMTP_USER}>`,
            to: correo,
            subject: "Recuperación de Contraseña - Proyecto UV",
            html: `<p>Haz clic para cambiar tu clave: <a href="${enlace}">Cambiar contraseña</a></p>`
        });
        console.log(`📧 Correo enviado a ${correo}`);
        return { status: 200, message: "Enlace enviado" };
    } catch (error) {
        console.error("Error Nodemailer:", error);
        throw new Error("Error al enviar correo");
    }
};

// Servicio de recuperación: solo genera y envía enlace
module.exports = { 
    procesarRecuperacion
};