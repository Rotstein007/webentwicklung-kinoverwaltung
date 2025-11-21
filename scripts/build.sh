#!/bin/sh
# Build-Skript

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
    echo ">> lint"
    npx semistandard "$CLIENT_SRC/js/"*.js "$ROOT_DIR/server/src/"*.js
    ;;

  debug)
    echo ">> debug"
    # Lint
    npx semistandard "$CLIENT_SRC/js/"*.js "$ROOT_DIR/server/src/"*.js

    mkdir -p "$CLIENT_DIST"

    echo "   - Less -> CSS"
    npx lessc "$CLIENT_SRC/styles/main.less" "$CLIENT_DIST/main.css"

    echo "   - JS -> Bundle"
    npx esbuild "$CLIENT_SRC/js/main.js" \
      --bundle \
      --outfile="$CLIENT_DIST/main.js"

    echo "   - index.html kopieren"
    cp "$CLIENT_SRC/index.html" "$CLIENT_DIST/index.html"
    ;;

  build)
    echo ">> build (minified)"
    # Lint
    npx semistandard "$CLIENT_SRC/js/"*.js "$ROOT_DIR/server/src/"*.js

    mkdir -p "$CLIENT_DIST"

    echo "   - Less -> CSS"
    npx lessc "$CLIENT_SRC/styles/main.less" "$CLIENT_DIST/main.css"

    echo "   - JS -> Bundle + Minify"
    npx esbuild "$CLIENT_SRC/js/main.js" \
      --bundle \
      --minify \
      --outfile="$CLIENT_DIST/main.js"

    echo "   - index.html kopieren"
    cp "$CLIENT_SRC/index.html" "$CLIENT_DIST/index.html"
    ;;

  start)
    echo ">> start (debug + server)"
    sh "$ROOT_DIR/scripts/build.sh" debug
    node "$ROOT_DIR/server/src/server.js" 8080
    ;;

  *)
    echo "Benutzung: sh scripts/build.sh {clean|lint|debug|build|start}"
    exit 1
    ;;
esac
