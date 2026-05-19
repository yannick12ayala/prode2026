# Prode Mundial 2026

Aplicación web para pronósticos del Mundial 2026. Desarrollada por la Secretaría de Seguridad de Pilar.

## Características

- **Para Empleados**: Cargar pronósticos, ver ranking, participar en competencia
- **Para RR.HH.**: Dashboard administrativo, cargar resultados, gestionar participantes
- **Puntuación**: +3 pts por marcador exacto, +1 pt por resultado correcto

## Tecnología

- Frontend: HTML5, CSS3, JavaScript vanilla
- Backend: Supabase (PostgreSQL)
- Hosting: Vercel

## Estructura

```
prode2026/
├── index.html      # Interfaz principal
├── app.js          # Lógica de la aplicación
├── db.js           # Conexión a Supabase
├── data.js         # Datos del torneo
├── empleados.js    # Lista de empleados
├── style.css       # Estilos
└── logo-mundial2026.png
```

## Deploy en Vercel

1. Conecta tu repositorio GitHub a Vercel
2. Agrega variables de entorno si es necesario
3. Deploy automático en cada push

## Variables de Entorno

Las variables de Supabase están hardcodeadas en `db.js`:
- `SUPABASE_URL`
- `SUPABASE_KEY`

## Licencia

Uso interno - Secretaría de Seguridad Pilar
