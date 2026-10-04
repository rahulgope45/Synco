import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
for (const name of ['caveman', 'brainstorm', 'feature-context', 'sync-spike']) {
  const destination = new URL(`.agents/skills/${name}/`, root);
  await mkdir(destination, { recursive: true });
  await copyFile(new URL(`skills/${name}/SKILL.md`, root), new URL('SKILL.md', destination));
  console.log(`Installed ${name}: ${fileURLToPath(destination)}`);
}
