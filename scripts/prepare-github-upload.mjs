import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve('.');
const targetUpload = path.resolve('github-upload');
const desktopUpload = path.resolve('..', 'Ankylo-GitHub-Upload');

const IGNORE_PATTERNS = [
  'node_modules',
  'target',
  'dist',
  'dist-ssr',
  'build',
  'test videos',
  '.git',
  '.tsbuildinfo',
  'github-upload',
  'Ankylo-GitHub',
  'Ankylo-GitHub-Upload',
];

function shouldIgnore(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  return IGNORE_PATTERNS.some((pattern) => {
    return (
      normalized === pattern ||
      normalized.startsWith(pattern + '/') ||
      normalized.includes('/' + pattern + '/') ||
      normalized.endsWith(pattern)
    );
  });
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const relPath = path.relative(projectRoot, srcPath);

    if (shouldIgnore(relPath)) {
      continue;
    }

    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Creating clean GitHub upload directories...');
[targetUpload, desktopUpload].forEach((folder) => {
  if (fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true, force: true });
  }
  fs.mkdirSync(folder, { recursive: true });
});

// Copy all clean files to targetUpload/All-Files and desktopUpload
copyRecursive(projectRoot, path.join(targetUpload, 'All-Clean-Project-Files'));
copyRecursive(projectRoot, desktopUpload);

// Create batch 1 (Root configs + frontend src)
const batch1 = path.join(targetUpload, 'Batch-1-Root-And-Frontend');
fs.mkdirSync(batch1, { recursive: true });

// Copy root files
const rootEntries = fs.readdirSync(projectRoot, { withFileTypes: true });
for (const entry of rootEntries) {
  if (!entry.isDirectory() && !shouldIgnore(entry.name)) {
    fs.copyFileSync(path.join(projectRoot, entry.name), path.join(batch1, entry.name));
  }
}
// Copy src directory
copyRecursive(path.join(projectRoot, 'src'), path.join(batch1, 'src'));

// Create batch 2 (src-tauri, launcher, scripts)
const batch2 = path.join(targetUpload, 'Batch-2-Backend-And-Scripts');
fs.mkdirSync(batch2, { recursive: true });
['src-tauri', 'launcher', 'scripts'].forEach((dir) => {
  if (fs.existsSync(path.join(projectRoot, dir))) {
    copyRecursive(path.join(projectRoot, dir), path.join(batch2, dir));
  }
});

// Create 1-click batch script for git push in both locations
const batContent = `@echo off
title Push Ankylo to GitHub
echo ========================================================
echo       Ankylo Video Player - Automatic GitHub Pusher
echo ========================================================
echo.
echo Make sure you have created a repository on github.com:
echo e.g. https://github.com/ashwaqahmed56/ankylo
echo.
set /p REPO_URL="Enter your GitHub repository URL (or press Enter for https://github.com/ashwaqahmed56/ankylo.git): "
if "%REPO_URL%"=="" set REPO_URL=https://github.com/ashwaqahmed56/ankylo.git

echo.
echo Initializing Git and staging clean files...
cd /d "%~dp0"
if not exist ".git" (
    git init
    git branch -M main
)
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git add .
git commit -m "Initial commit: Ankylo universal interactive video player"
echo.
echo Pushing to GitHub (%REPO_URL%)...
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo SUCCESS! Your code has been uploaded to GitHub!
    echo ========================================================
) else (
    echo ========================================================
    echo If push failed, try:
    echo 1. Make sure the repository exists on GitHub
    echo 2. Run: git push -u origin main --force
    echo ========================================================
)
pause
`;

fs.writeFileSync(path.join(projectRoot, 'PUSH_TO_GITHUB.bat'), batContent, 'utf-8');
fs.writeFileSync(path.join(targetUpload, 'PUSH_TO_GITHUB.bat'), batContent, 'utf-8');
fs.writeFileSync(path.join(desktopUpload, 'PUSH_TO_GITHUB.bat'), batContent, 'utf-8');

// Create README instructions in upload folders
const readmeContent = `# How to Upload to GitHub

You have 2 easy options:

---

### Option 1 (Recommended & Fastest - 1 Click):
Double-click \`PUSH_TO_GITHUB.bat\` in this folder or in your main Ankylo project.
It uses Git directly, uploads all files in 3 seconds, and has **NO 100-file limit**!

---

### Option 2 (Drag & Drop via GitHub Website):
GitHub website only allows **100 files at a time**.
We have pre-split the clean project into 2 batches for you:

1. Go to your GitHub repository -> click **"Add file"** -> **"Upload files"**.
2. Drag and drop all contents of **\`Batch-1-Root-And-Frontend\`** (~50 files).
   Click **"Commit changes"**.
3. Click **"Add file"** -> **"Upload files"** again.
   Drag and drop all contents of **\`Batch-2-Backend-And-Scripts\`** (~80 files).
   Click **"Commit changes"**.

Done! All unnecessary junk (node_modules, target, dist, build, test videos) has been excluded.
`;

fs.writeFileSync(path.join(targetUpload, 'INSTRUCTIONS.txt'), readmeContent, 'utf-8');
fs.writeFileSync(path.join(desktopUpload, 'INSTRUCTIONS.txt'), readmeContent, 'utf-8');

console.log('Prepared clean GitHub upload folders successfully!');
