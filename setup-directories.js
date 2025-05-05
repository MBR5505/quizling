const fs = require('fs');
const path = require('path');

// List of directories that should exist
const requiredDirectories = [
  'public',
  'public/css',
  'public/js',
  'views',
  'views/layouts',
  'views/partials',
  'views/auth',
  'views/user',
  'views/admin',
  'views/quiz',
  'views/errors',
  'controllers',
  'models',
  'routes',
  'middleware'
];

// Create any missing directories
for (const dir of requiredDirectories) {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
}

console.log("All required directories have been checked/created.");
