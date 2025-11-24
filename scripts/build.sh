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
    rm -rf "$CLIENT_DIST"
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
    mkdir -p "$CLIENT_DIST"

    echo "   - Less -> CSS"
    # (falls du später clean-css einbindest, kommt das hier rein)
    npx lessc "$CLIENT_SRC/styles/main.less" "$CLIENT_DIST/main.css"

    echo "   - JS -> Bundle + Minify"
    npx esbuild "$CLIENT_SRC/js/main.js" \
      --bundle \
      --minify \
      --sourcemap \
      --outfile="$CLIENT_DIST/main.js"

    echo "   - index.html kopieren"
    cp "$CLIENT_SRC/index.html" "$CLIENT_DIST/index.html"

    echo "   - Assets kopieren"
    if [ -d "$CLIENT_SRC/assets" ]; then
      mkdir -p "$CLIENT_DIST/assets"
      cp -R "$CLIENT_SRC/assets/." "$CLIENT_DIST/assets/"
    fi

    echo ">> build fertig"
    ;;

  start)
    echo ">> start (debug + server)"
    # Debug-Build erstellen (bricht bei Lint-/Build-Fehlern ab)
    sh "$ROOT_DIR/scripts/build.sh" debug

    echo ">> Server starten (Port 8080)"
    node "$ROOT_DIR/server/src/server.js" 8080
    ;;

  *)
    echo "Benutzung: sh scripts/build.sh {clean|lint|debug|build|start}"
    exit 1
    ;;
esac
