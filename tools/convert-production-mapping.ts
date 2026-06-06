#!/usr/bin/env bun

/**
 * production_JP_to_EN.json を翻訳JSONに一括変換するスクリプト
 */

import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

interface TranslationFile {
    goods: Record<string, string>;
    ui: Record<string, string>;
    regions: Record<string, string>;
    populationTiers: Record<string, string>;
    modifiers: Record<string, string>;
}

async function convertProductionMapping() {
    try {
        // production_JP_to_EN.json を読み込み
        const mappingPath = resolve(__dirname, '../production_JP_to_EN.json');
        const mappingContent = await readFile(mappingPath, 'utf-8');

        // 末尾の }; を削除し、行末のカンマを削除してJSONとして解析可能にする
        let cleanedContent = mappingContent
            .replace(/\s*}\s*;.*$/, '}')  // 末尾の }; を削除
            .replace(/,\s*}/g, '}')         // 末尾のカンマを削除
            .replace(/,\s*\n\s*}/g, '\n}'); // 改行がある場合も対応

        const mapping: Record<string, string> = JSON.parse(cleanedContent);

        console.log(`[Convert] Loaded ${Object.keys(mapping).length} entries from production_JP_to_EN.json`);

        // 既存の翻訳ファイルを読み込み
        const enPath = resolve(__dirname, '../src/i18n/locales/en.json');
        const jaPath = resolve(__dirname, '../src/i18n/locales/ja.json');

        const enData: TranslationFile = JSON.parse(await readFile(enPath, 'utf-8'));
        const jaData: TranslationFile = JSON.parse(await readFile(jaPath, 'utf-8'));

        let addedCount = 0;

        // production_JP_to_EN.json のすべてのエントリを追加
        for (const [japanese, english] of Object.entries(mapping)) {
            // 英語キーをトリミング（余分なスペースを削除）
            const cleanEnglish = english.trim();
            const cleanJapanese = japanese.trim();

            // 既に存在する場合はスキップ
            if (enData.goods[cleanEnglish] && jaData.goods[cleanEnglish]) {
                continue;
            }

            // 英語名を Title Case に変換（例: "iron_ore" → "Iron Ore"）
            const displayName = cleanEnglish
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            enData.goods[cleanEnglish] = displayName;
            jaData.goods[cleanEnglish] = cleanJapanese;
            addedCount++;

            console.log(`  Added: ${cleanEnglish} → EN: "${displayName}", JA: "${cleanJapanese}"`);
        }

        // アルファベット順にソート
        const sortedEnGoods = Object.keys(enData.goods)
            .sort()
            .reduce((acc, key) => {
                acc[key] = enData.goods[key];
                return acc;
            }, {} as Record<string, string>);

        const sortedJaGoods = Object.keys(jaData.goods)
            .sort()
            .reduce((acc, key) => {
                acc[key] = jaData.goods[key];
                return acc;
            }, {} as Record<string, string>);

        enData.goods = sortedEnGoods;
        jaData.goods = sortedJaGoods;

        // ファイルに書き戻し
        await writeFile(enPath, JSON.stringify(enData, null, 2), 'utf-8');
        await writeFile(jaPath, JSON.stringify(jaData, null, 2), 'utf-8');

        console.log(`\n[Convert] ✅ Successfully added ${addedCount} new entries`);
        console.log(`[Convert] Total entries: ${Object.keys(enData.goods).length}`);
        console.log(`[Convert] Updated files:`);
        console.log(`  - ${enPath}`);
        console.log(`  - ${jaPath}`);

    } catch (error) {
        console.error('[Convert] ❌ Error:', error);
        process.exit(1);
    }
}

convertProductionMapping();
