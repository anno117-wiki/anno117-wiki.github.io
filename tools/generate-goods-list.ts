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
 * Determine category based on good ID
 * Categories decided by user: food, fashion, culture, construction
 */
function determineCategory(id: string): string {
  // Food (14 items)
  const foodItems = [
    'beer', 'bird_tongues_in_aspic', 'bread', 'cheese', 'cockles', 'eels',
    'garum', 'olive_oil', 'oysters_with_caviar', 'porridge', 'roast_beef',
    'sardines', 'sausages', 'wine'
  ];

  // Fashion (16 items)
  const fashionItems = [
    'brooches', 'clan_shields', 'cloaks', 'drinking_horns', 'fur_hats',
    'handmirrors', 'necklaces', 'pileus', 'reed_shoes', 'sandals',
    'standing_lyres', 'togas', 'torcs', 'trousers', 'tunics', 'wigs'
  ];

  // Culture (6 items)
  const cultureItems = [
    'amphorae', 'chariots', 'fine_glass', 'loungers', 'soap', 'writing_tablets'
  ];

  // Construction (12 items)
  const constructionItems = [
    'armour', 'concrete', 'granite', 'horses', 'marble', 'mosaics',
    'rope', 'sails', 'tiles', 'timber', 'wattle_&_daub', 'weapons'
  ];

  if (foodItems.includes(id)) return 'food';
  if (fashionItems.includes(id)) return 'fashion';
  if (cultureItems.includes(id)) return 'culture';
  if (constructionItems.includes(id)) return 'construction';

  // Default fallback
  console.warn(`[Generate] Unknown category for item: ${id}, defaulting to 'culture'`);
  return 'culture';
}

function processFile(node: ProductionNode, filename: string, goodsMap: Map<string, Good>) {
    if (!node.id) return;

    // Process the root item (the product of this file)
    const id = node.id;
    let regions = node.region || [];
    // If filename contains '_albion', force regions to ['Celtic']
    if (filename.includes('_albion')) {
      regions = ['Celtic'];
    }
    const displayName = node.name || toDisplayName(id);

    let good = goodsMap.get(id);
    if (!good) {
        good = {
            displayName,
            id,
            icon: node.icon || id,
            regions: [],
            files: {},
            category: determineCategory(id),
            startOfChain: node.start_of_chain || false
        };
        goodsMap.set(id, good);
    } else {
        // Update startOfChain if this file has it set to true
        if (node.start_of_chain && !good.startOfChain) {
            good.startOfChain = true;
        }
    }

    // Update regions and files for this good (since this file defines a recipe for it)
    // Merge regions
    for (const region of regions) {
        if (!good.regions.includes(region)) {
            good.regions.push(region);
        }
    }
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
    const productionsDir = resolve(__dirname, "../src/assets/productions");
    const outputPath = join(productionsDir, "list.json");

    formatConsoleLog(`Scanning directory: ${productionsDir}`);

    // Read all JSON files from productions directory
    const files = await readdir(productionsDir);
    const jsonFiles = files.filter(
      (file) => file.endsWith(".json") && file !== "list.json"
    );

    formatConsoleLog(`Found ${jsonFiles.length} production files`);

    // Collect all goods
    const allGoods = new Map<string, Good>();

    for (const file of jsonFiles) {
      const filePath = join(productionsDir, file);

      try {
        const content = await readFile(filePath, "utf-8");
        const production: ProductionNode = JSON.parse(content);
        processFile(production, file, allGoods);
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
    formatConsoleLog(`Error generating goods list:`, true);
    process.exit(1);
  }
}

// Execute the function when run directly
if (import.meta.main) {
  await generateGoodsList({ showList: true, devmode: true });
}
