// Ghép các phần trong src/ thành một file index.html duy nhất
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src');
const shell = fs.readFileSync(path.join(dir, 'shell.html'), 'utf8').replace(/\r\n/g, '\n'); // chuẩn hoá về LF: vài file nguồn còn CRLF
const only = process.env.ONLY ? process.env.ONLY.split(',') : null; // ví dụ ONLY=00,05,06,07,99
const parts = fs.readdirSync(dir).filter((f) => /^\d\d-.*\.js$/.test(f) && (!only || only.includes(f.slice(0, 2)))).sort();
const js = parts.map((f) => `// ----- ${f} -----\n` + fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n').trim()).join('\n\n');
const out = shell.replace('//@@MODULES@@', () => js);
fs.writeFileSync(path.join(__dirname, process.env.OUT || 'index.html'), out);
console.log('index.html:', parts.join(', '), '→', (out.length / 1024).toFixed(1), 'KB');
