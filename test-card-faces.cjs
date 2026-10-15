'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { setCardFace } = require('./card-faces.js');

function fixture() {
  const events = [];
  const face = name => ({
    inert: false, attributes: {},
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this.attributes[key]; },
    querySelector() { return { focus() { events.push(name); } }; }
  });
  const front = face('front');
  const back = face('back');
  const card = {
    flipped: false,
    classList: { toggle(_name, value) { card.flipped = value; } },
    querySelector(selector) { return selector === '.card-back' ? back : front; }
  };
  return { card, front, back, events };
}

test('initial back face cannot receive keyboard input or appear in the accessible tree', () => {
  const { card, front, back, events } = fixture();
  setCardFace(card, false);
  assert.equal(front.inert, false);
  assert.equal(front.attributes['aria-hidden'], undefined);
  assert.equal(back.inert, true);
  assert.equal(back.attributes['aria-hidden'], 'true');
  assert.deepEqual(events, []);
});

test('opening rules and returning restores the correct face and focus', () => {
  const { card, front, back, events } = fixture();
  setCardFace(card, false);
  setCardFace(card, true, true);
  assert.equal(card.flipped, true);
  assert.equal(back.inert, false);
  assert.equal(front.inert, true);
  assert.equal(front.attributes['aria-hidden'], 'true');
  assert.equal(back.attributes['aria-hidden'], undefined);
  setCardFace(card, false, true);
  assert.equal(card.flipped, false);
  assert.equal(front.inert, false);
  assert.equal(back.inert, true);
  assert.deepEqual(events, ['back', 'front']);
});

test('an incomplete card reports a usable error instead of changing another card', () => {
  const warnings = [];
  const original = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    assert.throws(() => setCardFace({ querySelector: () => null }, true), /Both card faces/);
    assert.equal(warnings.length, 1);
  } finally { console.warn = original; }
});
