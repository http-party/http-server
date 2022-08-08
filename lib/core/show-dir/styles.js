'use strict';

const icons = require('./icons.json');

const IMG_SIZE = 16;

let css = `i.icon { display: block; height: ${IMG_SIZE}px; width: ${IMG_SIZE}px; }\n`;
css += 'table tr { white-space: nowrap; }\n';
css += 'td.perms {}\n';
css += 'td.file-size { text-align: right; padding-left: 1em; }\n';
css += 'td.display-name { padding-left: 1em; }\n';
css += `
@media (prefers-color-scheme: dark) {
  body {
    background-color: #303030;
    color: #efefef;
  }
  a {
    color: #ffff11;
  }
}
`;

Object.keys(icons).forEach((key) => {
  css += `i.icon-${key} {\n`;
  css += `  background-image: url("data:image/png;base64,${icons[key]}");\n`;
  css += '}\n\n';
});

exports.icons = icons;
exports.css = css;
