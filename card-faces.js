/* A rotated-away face must also leave keyboard navigation and the accessibility tree. */
(function (root) {
  'use strict';

  function setCardFace(card, showBack, moveFocus = false) {
    try {
      const front = card.querySelector('.card-face:not(.card-back)');
      const back = card.querySelector('.card-back');
      if (!front || !back) throw Error('Both card faces are required.');
      const active = showBack ? back : front;
      const inactive = showBack ? front : back;
      active.inert = false;
      active.removeAttribute('aria-hidden');
      card.classList.toggle('flipped', showBack);
      if (moveFocus) {
        const target = active.querySelector(
          'button:not([disabled]):not(.hidden), [role="button"], input:not([disabled]), select:not([disabled]), summary'
        );
        target?.focus({ preventScroll: true });
      }
      inactive.inert = true;
      inactive.setAttribute('aria-hidden', 'true');
    } catch (error) {
      console.warn('Card face change failed', error);
      throw error;
    }
  }

  const api = { setCardFace };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CombatCardFaces = api;
})(typeof globalThis === 'object' ? globalThis : this);
