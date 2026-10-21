import { cpSync, existsSync, lstatSync, readdirSync, readlinkSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Next.js standalone output can contain absolute symlinks for external server
 * packages (for example `pg`). The Netlify Next plugin copies that output with
 * `verbatimSymlinks`, which fails on Windows unless Developer Mode is enabled.
 * Replacing each symlink with a real copy makes local `netlify deploy` work.
 * This is a no-op on Linux/macOS, where Netlify builds normally.
 */
if (process.platform !== 'win32') {
  process.exit(0);
}

const root = resolve('.next/standalone');
if (!existsSync(root)) {
  process.exit(0);
}

let replaced = 0;

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      const target = resolve(directory, readlinkSync(path));
      if (!existsSync(target)) {
        console.warn(`Skipping broken symlink: ${path} -> ${target}`);
        continue;
      }
      rmSync(path, { recursive: true, force: true });
      cpSync(target, path, { recursive: true, force: true, dereference: true });
      replaced += 1;
    } else if (entry.isDirectory()) {
      walk(path);
    }
  }
}

walk(root);
console.log(`Replaced ${replaced} standalone symlink(s) for Windows.`);
