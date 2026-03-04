# Publicar API para acceso desde celular/PC

## ¿Qué puedo hacer yo y qué haces tú?
- Yo ya dejé el backend listo para producción (`.env`, CORS, DB, health check, `render.yaml`).
- Tú solo necesitas conectar tu cuenta (Render/Railway), porque no tengo acceso a tus credenciales.

## 1) Configurar variables
1. Copia `.env.example` a `.env`
2. Completa valores reales (`DB_*`, `SMTP_*`, `FRONTEND_URL`, `CORS_ORIGIN`)

## 2) Ejecutar local en red (misma WiFi)
```bash
npm install
npm start
```
- Encuentra tu IP local (ejemplo `192.168.1.20`)
- Desde celular usa: `http://192.168.1.20:3000/api/health`
- Si responde `{ "status": "ok" }`, ya está visible en la red local

## 3) Publicar en internet (recomendado: Render/Railway)
- Sube este backend a GitHub
- Crea servicio Web en Render o Railway
- Comando de inicio: `npm start`
- Configura variables de entorno desde el panel del proveedor
- Usa PostgreSQL gestionado del proveedor (o externa con `DB_SSL=true`)

### Opción rápida con Render Blueprint
- En Render: **New +** → **Blueprint**
- Selecciona tu repo (detectará `render.yaml` automáticamente)
- Completa variables `DB_*`, `SMTP_*`, `FRONTEND_URL`, `CORS_ORIGIN`
- Deploy

## 4) Conectar frontend
- Cambia la URL base del frontend a la URL pública del backend
- Ejemplo: `https://tu-api.onrender.com`
- Endpoint salud: `https://tu-api.onrender.com/api/health`

## 5) Seguridad mínima
- No subas `.env` a GitHub
- Mantén `SMTP_PASS` y `DB_PASSWORD` solo en variables de entorno
- Usa `CORS_ORIGIN` con dominio real del frontend (no `*` en producción)
