import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Comprehensive Secret & Credential Detection Patterns
const SECRET_PATTERNS = [
  { name: 'Google API Key (AIza...)', regex: /AIzaSy[A-Za-z0-9_-]{35}/ },
  { name: 'Google Cloud / Gemini API Token (AQ...)', regex: /AQ\.[A-Za-z0-9_-]{30,}/ },
  { name: 'Google Service Account Private Key', regex: /"private_key":\s*"-----BEGIN/ },
  { name: 'OpenAI Secret Key', regex: /sk-[A-Za-z0-9_-]{32,}/ },
  { name: 'Anthropic API Key', regex: /sk-ant-api[A-Za-z0-9_-]{32,}/ },
  { name: 'GitHub Personal Access Token', regex: /gh[pousr]_[A-Za-z0-9]{36,}/ },
  { name: 'AWS Access Key ID', regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: 'Private Key', regex: /-----BEGIN (RSA|EC|OPENSSH|PGP|DSA)?\s*PRIVATE KEY-----/ },
];

const FORBIDDEN_FILENAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'id_rsa',
  'id_ed25519',
]);

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.idea',
  'dist',
  'build',
  'target',
  'coverage',
  '.system_generated',
  '.mvn',
  'postgres_data',
]);

let hasError = false;
let scannedFileCount = 0;

function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const relativePath = path.relative(rootDir, fullPath);

      if (FORBIDDEN_FILENAMES.has(entry.name.toLowerCase())) {
        console.error(`❌ [CRITICAL SECURITY ALERT] Forbidden credential file staged:`);
        console.error(`   👉 File: ${relativePath}`);
        console.error(`   👉 Action: Remove from repository and add to .gitignore immediately.`);
        hasError = true;
      }

      // Check text file content for leaks
      const ext = path.extname(entry.name).toLowerCase();
      const textExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.java', '.xml', '.yml', '.yaml', '.sql', '.md', '.html', '.sh', '.cmd', '.bat'];
      if (textExtensions.includes(ext) || entry.name.startsWith('.env')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          scannedFileCount++;

          for (const pattern of SECRET_PATTERNS) {
            if (pattern.regex.test(content)) {
              console.error(`❌ [CRITICAL SECURITY ALERT] Potential secret detected:`);
              console.error(`   👉 Type: ${pattern.name}`);
              console.error(`   👉 File: ${relativePath}`);
              console.error(`   👉 Action: Remove secret from source and use environment variables.`);
              hasError = true;
            }
          }
        } catch {
          // Ignore binary or unreadable files
        }
      }
    }
  }
}

console.log('🛡️  Running Comprehensive Secret & Credential Leak Scanner...');
scanDirectory(rootDir);

if (hasError) {
  console.error('\n❌ Security check FAILED. Please resolve the critical alerts above before committing.');
  process.exit(1);
} else {
  console.log(`✅ Security check PASSED: Scanned ${scannedFileCount} files. No secrets or forbidden credentials found.\n`);
}
