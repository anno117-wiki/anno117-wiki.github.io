#!/usr/bin/env bun

/**
 * Generate list.json with all goods from Anno 117 production chains
 * This script scans production JSON files and extracts unique goods with their display names, IDs, and icons
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";

interface Good {
  displayName: string;
  id: string;
  icon: string;
  regions: string[];
  files: Record<string, string>; // filename -> regions
  category: string;
  startOfChain?: boolean;
}

interface ProductionNode {
  id?: string;
  name?: string;
  type?: string;
  icon?: string;
  input?: ProductionNode[];
  fuel?: ProductionNode[];
  start_of_chain?: boolean;
  region?: string[];
}

/**
 * Convert ID to display name (e.g., "wood_cutter" -> "Wood Cutter")
 */
function toDisplayName(id: string): string {
  return id
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Determine category based on good ID.
 * カテゴリ分類は現行list.json（食料/建設/ファッション/文化/中間品/原材料の6分類、手動メンテ）を
 * 一次情報源として引き継ぐ。新規商品IDのみ警告を出し、暫定で'culture'にフォールバックする
 * （このハードコード4分類だけを見ると6分類のresource/intermediateが欠落し誤判定するため）。
 */
function loadExistingGoods(existingListPath: string): Array<{ id: string; category: string; icon: string }> {
  try {
    const content = require("fs").readFileSync(existingListPath, "utf-8");
    const parsed = JSON.parse(content) as { goods?: Array<{ id: string; category: string; icon: string }> };
    return parsed.goods || [];
  } catch {
    return [];
  }
}

function determineCategory(id: string, categoryMap: Map<string, string>): string {
  const known = categoryMap.get(id);
  if (known) return known;

  console.warn(`[Generate] Unknown category for item: ${id}, defaulting to 'culture'`);
  return 'culture';
}

function processFile(node: ProductionNode, filename: string, goodsMap: Map<string, Good>, categoryMap: Map<string, string>, iconMap: Map<string, string>, isRoot = true, inheritedRegions: string[] = []) {
    if (!node.id) return;

    // Process this node's good (root = the file's main product, nested = intermediate/resource
    // ingredients that have no standalone production file of their own, e.g. wheat inside bread.json)
    const id = node.id;
    // If filename contains '_albion', force regions to ['Celtic']. Otherwise use this node's own
    // region if present (root nodes), or fall back to the region inherited from the file's root
    // (nested ingredients have no `region` field of their own).
    let regions = filename.includes('_albion') ? ['Celtic'] : (node.region || inheritedRegions);
    const displayName = node.name || toDisplayName(id);

    let good = goodsMap.get(id);
    if (!good) {
        good = {
            displayName,
            id,
            icon: node.icon || iconMap.get(id) || id,
            regions: [],
            files: {},
            category: determineCategory(id, categoryMap),
            startOfChain: node.start_of_chain || false
        };
        goodsMap.set(id, good);
    } else {
        // Update startOfChain if this file has it set to true
        if (node.start_of_chain && !good.startOfChain) {
            good.startOfChain = true;
        }
    }

    // Merge regions (nested ingredients inherit the region of the chain they appear in)
    for (const region of regions) {
        if (!good.regions.includes(region)) {
            good.regions.push(region);
        }
    }

    // Recurse into ingredients first so their `files` mapping (if any, set below) isn't
    // clobbered by this node's own file mapping. Ingredients inherit this node's region.
    for (const input of node.input || []) {
        processFile(input, filename, goodsMap, categoryMap, iconMap, false, regions);
    }

    // Only the file's root product maps to a standalone production file. Nested ingredients
    // (wheat, flour, etc.) have no file of their own and must keep `files` empty.
    if (!isRoot) return;

    // Add file mapping: region keys with file names
    const simpleFilename = filename.replace('.json', '');
    for (const region of regions) {
      const regionKey = region.toLowerCase();
      if (good.files[regionKey] !== simpleFilename) {
        good.files[regionKey] = simpleFilename;
      }
    }
}

function formatConsoleLog(text: string, error = false): void {
  console.log((error ? Bun.color("#dc7979", "ansi-16m") + "[Production List / ERROR] " : Bun.color("#fee5ca", "ansi-16m") + "[Production List] ") + Bun.color("#c7ad90", "ansi") + text);
};


/**
 * Main function to generate the goods list
 */
export default async function generateGoodsList({showList = true, devmode = true}) {
  try {
    const productionsDir = resolve(__dirname, "../packages/shared/public/productions");
    const outputPath = join(productionsDir, "list.json");

    formatConsoleLog(`Scanning directory: ${productionsDir}`);

    // 既存list.json（手動メンテのcategory/icon）を引き継ぐ
    const existingGoods = loadExistingGoods(outputPath);
    const categoryMap = new Map(existingGoods.map((g) => [g.id, g.category]));
    const iconMap = new Map(existingGoods.map((g) => [g.id, g.icon]));

    // Read all JSON files from productions directory
    const files = await readdir(productionsDir);
    const jsonFiles = files.filter(
      (file) => file.endsWith(".json") && file !== "list.json" && file !== "item-compatibility.json"
    );

    formatConsoleLog(`Found ${jsonFiles.length} production files`);

    // Collect all goods
    const allGoods = new Map<string, Good>();

    for (const file of jsonFiles) {
      const filePath = join(productionsDir, file);

      try {
        const content = await readFile(filePath, "utf-8");
        const production: ProductionNode = JSON.parse(content);
        processFile(production, file, allGoods, categoryMap, iconMap);
      } catch (error) {
        formatConsoleLog(`Could not process ${file}`, true);
      }
    }

    // Convert to array and sort by display name
    const goodsList = Array.from(allGoods.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );

    // Write to list.json
    const output = {
      README: "This file contains all productions from Anno 117: Pax Romana.",
      generated: new Date().toISOString(),
      count: goodsList.length,
      goods: goodsList,
    };

    if (devmode) {
      // pretty print with 2 spaces indentation
      await writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");
    } else {
      // minified version for production use
      await writeFile(outputPath, JSON.stringify(output), "utf-8");
    }

    formatConsoleLog(
      `Successfully generated list.json with ${goodsList.length} goods`
    );
    formatConsoleLog(`Output: ${outputPath}`);
    if (!showList) return;
    formatConsoleLog(`Goods found:`);
    goodsList.forEach((good) => {
      console.log(`   - ${good.displayName} (${good.id})`);
    });
  } catch (error) {
    formatConsoleLog(`Error generating goods list: ${error}`, true);
    process.exit(1);
  }
}

// Execute the function when run directly
if (import.meta.main) {
  await generateGoodsList({ showList: true, devmode: true });
}
