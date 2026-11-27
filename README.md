# ViveLink

Aplicación social con Express y PostgreSQL. GitHub guarda el código; Render ejecuta el servidor y Neon almacena la base de datos. GitHub Pages por sí solo no puede ejecutar el servidor ni la autenticación.

## Ejecutar en local

Requisitos: Node.js 22.13 o superior.

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` a `.env` y añade el correo y la contraseña privada del administrador. Usa una contraseña de al menos 12 caracteres:

   ```powershell
   Copy-Item .env.example .env
   ```

   Edita `.env` y completa `ADMIN_EMAIL` y `ADMIN_PASSWORD`. No compartas ni subas ese archivo.
3. Ejecuta `npm start` y abre <http://localhost:3000>. En desarrollo, la app usa `database.sqlite` y carga perfiles de demostración; las cuentas de demostración no son para producción.

Para comprobar la inicialización de la base de datos, ejecuta `npm test`.

## Publicar y obtener un enlace para usar la web

1. Crea un repositorio en GitHub y sube el código. Puedes mantener el repositorio privado. No incluyas `.env`, contraseñas, URLs privadas ni la base de datos local.
2. Crea una base PostgreSQL en [Neon](https://neon.tech/) y copia la URL de conexión.
3. En [Render](https://render.com/), selecciona **New > Blueprint** y conecta el repositorio para que lea `render.yaml`.
4. Cuando Render lo solicite, configura estos secretos/variables en el servicio:
   - `DATABASE_URL`: URL privada de Neon.
   - `ADMIN_EMAIL`: el correo que usarás para entrar como administrador.
   - `ADMIN_PASSWORD`: contraseña privada de al menos 12 caracteres. No la publiques ni la envíes por el chat.
5. Espera al despliegue. Render te dará una URL `https://...onrender.com`; ese es el enlace público de la web. El enlace del repositorio de GitHub no ejecuta la aplicación.

El servidor crea las tablas y la cuenta de administrador al arrancar. En producción no carga los perfiles de demostración y solo permite iniciar sesión con la cuenta administradora configurada. El registro público y la creación de cuentas desde **Administración** están desactivados en producción. La base de datos no se expone como archivo ni se entrega a cuentas normales. Para entrar, usa el correo definido en `ADMIN_EMAIL` y una contraseña fuerte de al menos 12 caracteres en `ADMIN_PASSWORD`; no compartas esos secretos.

### Si publicas la interfaz en Netlify

Netlify solo sirve los archivos de la interfaz; el inicio de sesión requiere también el servidor Express de Render y la base de datos PostgreSQL. Este proyecto configura Netlify para reenviar `/api/*` a `https://vivelink.onrender.com`. Despliega primero el servicio de Render definido en `render.yaml` y configura sus variables de producción. Si Render muestra un dominio distinto, actualiza el destino `to` en `netlify.toml` con la URL asignada por Render y vuelve a desplegar Netlify. El enlace de Netlify es el que compartes con los usuarios; no uses ese mismo enlace como URL del servidor.

Para una configuración gratuita, usa Neon para PostgreSQL y el plan gratuito de Render para el servidor. Render puede detener el servidor tras 15 minutos sin tráfico; la primera petición posterior puede tardar alrededor de un minuto mientras se reactiva. La base de datos gratuita de Render caduca a los 30 días, por eso estas instrucciones usan Neon en su lugar. El plan gratuito sirve para pruebas, pero no garantiza disponibilidad inmediata permanente.

Los usuarios autenticados pueden ver los perfiles públicos y publicaciones propios de la red social, pero no pueden consultar contraseñas ni correos de otras cuentas. Las contraseñas se guardan como hashes.

Para publicar un vídeo, escribe el texto del post y pega un enlace de YouTube en el campo opcional. Se mostrará el reproductor incrustado y un enlace directo a YouTube como alternativa.

Para escuchar el texto de los controles y elementos al pulsarlos, activa **Activar lectura** junto al selector de idioma. La lectura sigue el idioma seleccionado y la preferencia se conserva en este navegador.

Si necesitas migrar usuarios locales a Neon, `npm run migrate:postgres` omite las cuentas y publicaciones de demostración incluidas en la app.
