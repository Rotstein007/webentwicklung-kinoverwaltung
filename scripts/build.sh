#!/bin/sh
# Build-Skript für Kinoverwaltung

set -e  # bei Fehler abbrechen

CMD="$1"

# Projektroot bestimmen
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

CLIENT_SRC="$ROOT_DIR/client/src"
CLIENT_DIST="$ROOT_DIR/client/dist"

case "$CMD" in
  clean)
    echo ">> clean"
    rm -rf "$CLIENT_DIST" "$ROOT_DIR/node_modules"
    ;;

  lint)
    echo ">> lint (semistandard)"
    # Alle Client- und Server-JS-Dateien prüfen
    npx semistandard "client/src/js/**/*.js" "server/src/**/*.js"
    ;;

  debug)
    echo ">> debug (Entwicklung: nicht minifiziert)"

    # Lint – bei Fehlern wird durch set -e abgebrochen
    npx semistandard "client/src/js/**/*.js" "server/src/**/*.js"

    echo ">> Client-Build (debug)"
    rm -rf "$CLIENT_DIST"
    mkdir -p "$CLIENT_DIST"

    echo "   - Less -> CSS"
    npx lessc "$CLIENT_SRC/styles/main.less" "$CLIENT_DIST/main.css"

    echo "   - JS -> Bundle"
    npx esbuild "$CLIENT_SRC/js/main.js" \
      --bundle \
      --sourcemap \
      --outfile="$CLIENT_DIST/main.js"

    echo "   - index.html kopieren"
    cp "$CLIENT_SRC/index.html" "$CLIENT_DIST/index.html"

    echo "   - Public kopieren"
    if [ -d "$ROOT_DIR/client/public" ]; then
      cp -R "$ROOT_DIR/client/public/." "$CLIENT_DIST/"
    fi

    echo "   - Assets kopieren"
    if [ -d "$CLIENT_SRC/assets" ]; then
      mkdir -p "$CLIENT_DIST/assets"
      cp -R "$CLIENT_SRC/assets/." "$CLIENT_DIST/assets/"
    fi

    echo ">> debug fertig"
    ;;

  build)
    echo ">> build (Produktion: minifiziert)"

    # Lint – bei Fehlern wird durch set -e abgebrochen
    npx semistandard "client/src/js/**/*.js" "server/src/**/*.js"

    echo ">> Client-Build (build)"
    rm -rf "$CLIENT_DIST"
    mkdir -p "$CLIENT_DIST"

    echo "   - Less -> CSS"
    npx lessc --clean-css "$CLIENT_SRC/styles/main.less" "$CLIENT_DIST/main.css"

    echo "   - JS -> Bundle + Terser"
    TMP_JS="$CLIENT_DIST/main.tmp.js"
    npx esbuild "$CLIENT_SRC/js/main.js" \
      --bundle \
      --outfile="$TMP_JS"

    npx terser "$TMP_JS" \
      --compress \
      --mangle \
      --output "$CLIENT_DIST/main.js"

    rm -f "$TMP_JS"

    echo "   - index.html kopieren"
    cp "$CLIENT_SRC/index.html" "$CLIENT_DIST/index.html"

    echo "   - Public kopieren"
    if [ -d "$ROOT_DIR/client/public" ]; then
      cp -R "$ROOT_DIR/client/public/." "$CLIENT_DIST/"
    fi

    echo "   - Assets kopieren"
    if [ -d "$CLIENT_SRC/assets" ]; then
      mkdir -p "$CLIENT_DIST/assets"
      cp -R "$CLIENT_SRC/assets/." "$CLIENT_DIST/assets/"
    fi

    echo ">> build fertig"
    ;;

  start)
    echo ">> start (server)"
    if [ ! -f "$CLIENT_DIST/index.html" ] || [ ! -f "$CLIENT_DIST/main.js" ] || [ ! -f "$CLIENT_DIST/main.css" ]; then
      echo "!! client/dist fehlt. Bitte zuerst 'npm run debug' oder 'npm run build' ausführen."
      exit 1
    fi

    echo ">> Server starten (Port 8080)"
    node "$ROOT_DIR/server/src/server.js" 8080
    ;;

  *)
    echo "Benutzung: sh scripts/build.sh {clean|lint|debug|build|start}"
    exit 1
    ;;
esac
