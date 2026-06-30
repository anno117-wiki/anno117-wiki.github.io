#!/usr/bin/env bash
# check-unused-icons.sh
# packages/shared/public/icons/ 配下の PNG/WebP が
# apps/ および packages/ のソースコードから参照されているか確認する

set -euo pipefail

ICONS_DIR="packages/shared/public/icons"
SEARCH_DIRS=("apps" "packages")
SEARCH_EXTS=("*.ts" "*.vue" "*.md" "*.json")

echo "=== アイコン未使用チェック ==="
echo "対象: $ICONS_DIR"
echo ""

unused=()
used=()

# 全 PNG/WebP を再帰的に列挙
while IFS= read -r filepath; do
    filename=$(basename "$filepath")
    stem="${filename%.*}"  # 拡張子なしのファイル名

    # ソースコード内でステム名を検索（拡張子なしで照合）
    found=false
    for dir in "${SEARCH_DIRS[@]}"; do
        for ext in "${SEARCH_EXTS[@]}"; do
            if grep -rql "$stem" "$dir" --include="$ext" 2>/dev/null; then
                found=true
                break 2
            fi
        done
    done

    if $found; then
        used+=("$filename")
    else
        unused+=("$filename")
    fi
done < <(find "$ICONS_DIR" -type f \( -name "*.png" -o -name "*.webp" \) | sort)

echo "--- 使用中（${#used[@]} 件）---"
for f in "${used[@]}"; do
    echo "  [OK] $f"
done

echo ""
echo "--- 未使用候補（${#unused[@]} 件）---"
if [ ${#unused[@]} -eq 0 ]; then
    echo "  （未使用ファイルなし）"
else
    for f in "${unused[@]}"; do
        echo "  [??] $f"
    done
fi

echo ""
echo "合計: 使用中 ${#used[@]} 件 / 未使用候補 ${#unused[@]} 件"
