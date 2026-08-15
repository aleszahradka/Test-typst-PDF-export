const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const binDir = path.join(__dirname, '..', 'bin');
const targetBinary = path.join(binDir, process.platform === 'win32' ? 'typst.exe' : 'typst');

if (fs.existsSync(targetBinary)) {
  console.log('Typst binary already present at', targetBinary);
  process.exit(0);
}

fs.mkdirSync(binDir, { recursive: true });

const platform = process.platform;
const arch = process.arch;

console.log(`Downloading Typst CLI binary for ${platform}-${arch}...`);

let assetName = '';
if (platform === 'linux' && arch === 'x64') {
  assetName = 'typst-x86_64-unknown-linux-musl.tar.xz';
} else if (platform === 'linux' && arch === 'arm64') {
  assetName = 'typst-aarch64-unknown-linux-musl.tar.xz';
} else if (platform === 'darwin' && arch === 'arm64') {
  assetName = 'typst-aarch64-apple-darwin.tar.gz';
} else if (platform === 'darwin' && arch === 'x64') {
  assetName = 'typst-x86_64-apple-darwin.tar.gz';
} else if (platform === 'win32') {
  assetName = 'typst-x86_64-pc-windows-msvc.zip';
} else {
  assetName = 'typst-x86_64-unknown-linux-musl.tar.xz';
}

const version = 'v0.15.1';
const url = `https://github.com/typst/typst/releases/download/${version}/${assetName}`;

try {
  if (assetName.endsWith('.tar.xz') || assetName.endsWith('.tar.gz')) {
    const flag = assetName.endsWith('.tar.xz') ? '-xJ' : '-xz';
    execSync(`curl -sL "${url}" | tar ${flag} --strip-components=1 -C "${binDir}"`, { stdio: 'inherit' });
  } else if (assetName.endsWith('.zip')) {
    const zipPath = path.join(binDir, 'typst.zip');
    execSync(`curl -sL "${url}" -o "${zipPath}" && unzip -o "${zipPath}" -d "${binDir}" && rm "${zipPath}"`, { stdio: 'inherit' });
  }

  if (fs.existsSync(targetBinary)) {
    fs.chmodSync(targetBinary, 0o755);
    console.log('Typst CLI binary downloaded successfully.');
  } else {
    console.warn('Warning: Typst binary was extracted, but not found at expected path:', targetBinary);
  }
} catch (err) {
  console.error('Error downloading Typst binary:', err.message);
}
