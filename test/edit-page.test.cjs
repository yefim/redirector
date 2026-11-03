const assert = require('node:assert/strict');
const { test } = require('node:test');
const { renderEditPage } = require('../build/edit-page');

test('renders the edit form, stylesheet and visit count', async () => {
  const html = await renderEditPage('https://example.com', 17);
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /href="\/edit.css"/);
  assert.match(html, /method="post" action="\/edit"/);
  assert.match(html, /value="https:\/\/example.com"/);
  assert.match(html, /<strong>17<\/strong>/);
});

test('escapes saved URLs without interpreting their contents as template placeholders', async () => {
  const html = await renderEditPage('https://example.com/{{hitCount}}?x=$&"<tag>\'', 42);
  assert.match(html, /value="https:\/\/example.com\/\{\{hitCount\}\}\?x=\$&amp;&quot;&lt;tag&gt;&#39;"/);
  assert.match(html, /<strong>42<\/strong>/);
  assert.doesNotMatch(html, /<tag>/);
});
