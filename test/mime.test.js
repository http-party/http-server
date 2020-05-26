'use strict';

const test = require('tap').test;
const mime = require('mime');

test('mime package lookup', (t) => {
  t.plan(7);

  t.equal(mime.lookup('/path/to/file.css'), 'text/css');
  t.equal(mime.lookup('/path/to/file.js'), 'application/javascript');
  t.equal(mime.lookup('/path/to/file.mjs'), 'application/javascript');
  t.equal(mime.lookup('/path/to/file.txt'), 'text/plain');
  t.equal(mime.lookup('file.txt'), 'text/plain');
  t.equal(mime.lookup('.TXT'), 'text/plain');
  t.equal(mime.lookup('htm'), 'text/html');

  t.end();
});

test('custom definition of mime-type with the mime package', (t) => {
  t.plan(1);

  mime.define({
    'application/xml': ['opml'],
  });
  t.equal(mime.lookup('.opml'), 'application/xml');

  t.end();
});

test('custom definition of mime-type with a .types file', (t) => {
  t.plan(2);

  try {
    mime.load('test/public/custom_mime_type.types');
  } catch (e) {
    t.fail(e.message);
    t.end();
  }

  t.equal(mime.lookup('.opml'), 'application/foo'); // see public/custom_mime_type.types

  t.throws(mime.load.bind(mime, 'public/this_file_does_not_exist.types'));

  t.end();
});
