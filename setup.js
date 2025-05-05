const fs = require('fs');
const path = require('path');

// Necessary directories for the application
const directories = [
  'public',
  'public/css',
  'public/js',
  'public/images',
  'views',
  'views/layouts',
  'views/partials',
  'views/auth',
  'views/user',
  'views/admin',
  'views/quiz',
  'views/errors',
  'routes',
  'controllers',
  'models',
  'middleware'
];

console.log('Checking directory structure...');

// Create directories if they don't exist
directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(fullPath, { recursive: true });
  } else {
    console.log(`Directory exists: ${dir}`);
  }
});

console.log('Directory structure check complete!');
