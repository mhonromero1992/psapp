/**
 * The app and the web version share one sample-data model. The web version (webapp/) is the
 * source; this copies the plain-TypeScript files that both read:
 *   npm run sync:webapp
 * Run it whenever webapp/src/data or webapp/src/lib/{format,random}.ts changes, then npm test.
 */
import {copyFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pairs = [
  ['webapp/src/data/types.ts', 'src/data/types.ts'],
  ['webapp/src/data/reference.ts', 'src/data/reference.ts'],
  ['webapp/src/data/generate.ts', 'src/data/generate.ts'],
  ['webapp/src/lib/format.ts', 'src/lib/format.ts'],
  ['webapp/src/lib/random.ts', 'src/lib/random.ts'],
];
for (const [from, to] of pairs) {
  if (!existsSync(root + from)) {
    console.error(`Not found: ${from}`);
    process.exit(1);
  }
  copyFileSync(root + from, root + to);
  console.log(`copied ${from} -> ${to}`);
}
