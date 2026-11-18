# Marc Gruau — portfolio

Web estática sin dependencias. Contenido en `data/*.json` y en `build.mjs`; estilos y scripts en `src/`; imágenes, fuentes y CV en `public/`.

    node build.mjs            # genera dist/ para el dominio propio
    SITE_URL=https://USUARIO.github.io/REPO BASE_PATH=/REPO/ node build.mjs   # mientras viva en github.io

Vista previa local: `python3 -m http.server 4173 --directory dist`
