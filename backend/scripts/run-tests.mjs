import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (entry.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const root = resolve(process.cwd(), 'src');
const testFiles = walk(root);

if (!testFiles.length) {
  console.log('No test files found.');
  process.exit(0);
}

const quotedFiles = testFiles.map((file) => `"${file}"`).join(' ');
const command = `npx tsx --test ${quotedFiles}`;
const result = spawnSync(command, { stdio: 'inherit', shell: true });
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
