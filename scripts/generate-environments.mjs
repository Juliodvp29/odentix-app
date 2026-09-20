// Generates src/environments/environment.ts and environment.prod.ts from
// environment variables when they are missing (e.g. on Vercel, where the
// real files are git-ignored and never checked out). Existing files are
// never overwritten. Fails loudly instead of building with a wrong URL.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const dir = join(process.cwd(), 'src', 'environments');

const targets = [
  {
    file: join(dir, 'environment.prod.ts'),
    apiUrl: process.env['ODENTIX_API_URL'],
  },
  {
    file: join(dir, 'environment.ts'),
    apiUrl: process.env['ODENTIX_API_URL_DEV'] ?? 'http://localhost:8081/api/v1',
  },
];

let failed = false;

for (const target of targets) {
  if (existsSync(target.file)) {
    console.log(`environments: ${target.file} already exists, skipping.`);
    continue;
  }
  if (!target.apiUrl) {
    console.error(
      `environments: ${target.file} is missing and ODENTIX_API_URL is not set. ` +
        `Set the environment variable or provide the file.`,
    );
    failed = true;
    continue;
  }
  mkdirSync(dirname(target.file), { recursive: true });
  writeFileSync(
    target.file,
    `// Generated at build time - do not edit by hand. See environment.example.ts.\nexport const environment = {\n  apiUrl: '${target.apiUrl}',\n};\n`,
  );
  console.log(`environments: generated ${target.file}.`);
}

if (failed) {
  process.exit(1);
}
