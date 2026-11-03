const assert = require('node:assert/strict');
const { test } = require('node:test');
const { resolve } = require('node:path');
const { renderFile } = require('ejs');
const template = resolve('app/pages/edit.ejs');

test('renders the edit form, stylesheet and visit count', async () => {
  const html = await renderFile(template, { redirectUrl: 'https://example.com', hitCount: 17 });
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /href="\/edit.css"/);
  assert.match(html, /method="post" action="\/edit"/);
  assert.match(html, /value="https:\/\/example.com"/);
  assert.match(html, /<strong>17<\/strong>/);
});

test('escapes saved URLs without interpreting their contents as template placeholders', async () => {
  const html = await renderFile(template, {
    redirectUrl: 'https://example.com/<%= hitCount %>?x=$&"<tag>\'',
    hitCount: 42,
  });
  assert.match(html, /value="https:\/\/example.com\/&lt;%= hitCount %&gt;\?x=\$&amp;(?:&quot;|&#34;)&lt;tag&gt;&#39;"/);
  assert.match(html, /<strong>42<\/strong>/);
  assert.doesNotMatch(html, /<tag>/);
});
