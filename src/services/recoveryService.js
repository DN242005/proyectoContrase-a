const nodemailer = require('nodemailer');
const db = require('../config/db'); 
const crypto = require('crypto');

// FUNCIÓN 1: Para enviar el correo
const procesarRecuperacion = async (correo) => {
    const correoNormalizado = String(correo || '').trim().toLowerCase();
    const userRes = await db.query('SELECT id FROM usuarios WHERE correo = $1', [correoNormalizado]);
    
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
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const enlace = `${frontendUrl}/?token=${token}`;

    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            throw new Error('SMTP no configurado en variables de entorno.');
        }

        await transporter.sendMail({
            from: `"Sistema Académico UV" <${process.env.SMTP_USER}>`,
            to: correoNormalizado,
            subject: "Recuperación de Contraseña - Proyecto UV",
            html: `<p>Haz clic para cambiar tu clave: <a href="${enlace}">Cambiar contraseña</a></p>`
        });
        console.log(`📧 Correo enviado a ${correoNormalizado}`);
        return { status: 200, message: "Enlace enviado" };
    } catch (error) {
        console.error("Error Nodemailer:", error);

        await db.query(
            'DELETE FROM tokens_restablecimiento WHERE token = $1',
            [token]
        );

        return { status: 500, message: "Error al enviar correo" };
    }
};

// Servicio de recuperación: solo genera y envía enlace
module.exports = { 
    procesarRecuperacion
};