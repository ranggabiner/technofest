import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const scannedRoots = ["src/app", "src/components"];
const sourceExtensions = new Set([".css", ".ts", ".tsx"]);

const arbitraryTypographyPatterns = [
  /text-\[(?:0\.92em|\d+px)\]/,
  /leading-\[[^\]]+\]/,
  /tracking-\[[^\]]+\]/,
  /tracking-\[-/,
  /font-\[var\(--font-landing-serif\)\]/,
  /Playfair_Display/,
  /Fraunces/,
  /font-fraunces/,
];

describe("typography standardization", () => {
  const sourceFiles = scannedRoots.flatMap((root) => listSourceFiles(join(projectRoot, root)));

  it("does not use arbitrary typography classes or page-local display fonts", () => {
    const violations = sourceFiles.flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");
      return arbitraryTypographyPatterns.flatMap((pattern) => {
        const matches = source.match(new RegExp(pattern.source, "g")) ?? [];
        return matches.map((match) => `${relative(projectRoot, filePath)}: ${match}`);
      });
    });

    expect(violations).toEqual([]);
  });

  it("uses an all-sans product typography system", () => {
    const violations = sourceFiles.flatMap((filePath) => {
      const relativePath = relative(projectRoot, filePath);
      const source = readFileSync(filePath, "utf8");
      return source.includes("font-serif") ? [relativePath] : [];
    });

    expect(violations).toEqual([]);
  });
});

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) return listSourceFiles(path);
    if (!stats.isFile()) return [];
    if (path.includes(".test.")) return [];
    if (!sourceExtensions.has(path.slice(path.lastIndexOf(".")))) return [];

    return [path];
  });
}
