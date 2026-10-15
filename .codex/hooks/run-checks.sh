#!/bin/sh
set -eu

# PostToolUse は標準入力を読み切ってから Lint・整形・型検査、Stop は加えてテストを順に実行する。
# 失敗した段階で後続を中止し、stdout の JSON に失敗したコマンドと診断内容、stderr に検査結果を出力する。
# Stop の初回失敗では継続を要求し、stop_hook_active が true の再試行後は通知だけを返す。
event=${1-}
set -- lint:fix format:fix check
checks='npm run lint:fix / npm run format:fix / npm run check'
stop_hook_active=false

case "$event" in
    post-tool-use)
        cat > /dev/null
        ;;
    stop)
        set -- "$@" test
        checks="$checks / npm run test"
        stop_hook_active=$(mise exec -- node -e 'process.stdout.write(String(JSON.parse(require("node:fs").readFileSync(0, "utf8")).stop_hook_active === true))') || exit 1
        ;;
    *)
        printf '%s\n' 'Usage: sh .codex/hooks/run-checks.sh post-tool-use|stop' >&2
        exit 1
        ;;
esac

cd "$(dirname "$0")/../.."

output_file=$(mktemp)
trap 'rm -f "$output_file"' 0

for command in "$@"; do
    if mise exec -- npm run "$command" > "$output_file" 2>&1; then
        cat "$output_file" >&2
    else
        cat "$output_file" >&2
        mise exec -- node - "$command" "$output_file" "$stop_hook_active" <<'JS'
const [command, outputFile, stopHookActive] = process.argv.slice(2);
const diagnostics = require('node:fs').readFileSync(outputFile, 'utf8').trim();
const failure = `検査失敗: npm run ${command}\n${diagnostics}`;
const output = stopHookActive === 'true'
    ? { systemMessage: `再試行後も${failure}\n自動継続は要求しません。` }
    : { decision: 'block', reason: `${failure}\n修正し、再実行してください。` };
process.stdout.write(`${JSON.stringify(output)}\n`);
JS
        exit 0
    fi
done

printf '{"systemMessage":"検査成功: %s"}\n' "$checks"
