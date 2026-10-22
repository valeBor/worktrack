import { copyFileSync, writeFileSync } from 'node:fs';

const carpeta = 'dist/worktrack/browser';

copyFileSync(
  `${carpeta}/index.csr.html`,
  `${carpeta}/index.html`
);

writeFileSync(
  `${carpeta}/.htaccess`,
  `RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /index.csr.html [L]
`
);