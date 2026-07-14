import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { BlockTemplate } from "./types";

const file = path.join(process.cwd(), "data", "block-templates.json");

export async function getBlockTemplates(): Promise<BlockTemplate[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as BlockTemplate[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}
