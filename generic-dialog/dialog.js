import { EventTargetShim } from '../utils/EventTargetShim.js';
import '../generic-focus-trap.js';

const KEYCODE_ESC = 27;

/**
 * TODO:
 * when setting everything else as aria-hidden, check if something already has aria-hidden, if it does, dont touch it
 * same for resetting the aria-hidden
 * add media query to be fullscreen on mobile
 *
 * Maybe refactor to use a web component internally to remove a bunch of imperative code
 */

class Dialog extends EventTargetShim {
  constructor() {
    super();

    const style = document.createElement('style');
    style.innerHTML = `

    `;
    document.head.appendChild(style);
  }

  // eslint-disable-next-line
  open({ closeOnEscape = true, closeOnOutsideClick = true, invokerNode, content }) {
    this.__dialogOpen = true;
    this.__invokerNode = invokerNode;
    this.__closeOnEscape = closeOnEscape;
    this.__closeOnOutsideClick = closeOnOutsideClick;

    if (!invokerNode) {
      throw new Error(`
        No invoker node found. This is required to reset the focus when the dialog closes. 
        
        You can add an invoker node like so:
        dialog.open({
          invokerNode: /* reference to a node */
        });
      `);
    }

    if (this.__closeOnEscape) {
      window.addEventListener('keydown', this.__onKeyDown.bind(this), true);
    }

    [...document.body.children].forEach(node => {
      // check if something already has aria-hidden or not, if it has, dont change it
      node.setAttribute('aria-hidden', 'true');
      node.setAttribute('inert', '');
    });

    // backdrop
    const dialogOverlay = document.createElement('div');
    this.__dialogOverlay = dialogOverlay;
    dialogOverlay.id = '__dialogOverlay';
    dialogOverlay.style.width = '100vw';
    dialogOverlay.style.height = '100vh';
    dialogOverlay.style.display = 'flex';
    dialogOverlay.style.alignItems = 'center';
    dialogOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    dialogOverlay.style.position = 'fixed';
    dialogOverlay.style.top = '0';

    if (this.__closeOnOutsideClick) {
      this.__dialogOverlay.addEventListener('click', this.__onClick.bind(this), true);
    }

    const focusTrap = document.createElement('generic-focus-trap');
    focusTrap.style.marginLeft = 'auto';
    focusTrap.style.marginRight = 'auto';
    dialogOverlay.appendChild(focusTrap);

    // container
    const dialogContainer = document.createElement('div');
    dialogContainer.setAttribute('role', 'dialog');
    dialogContainer.style.width = 'auto';
    dialogContainer.style.height = 'auto';
    dialogContainer.style.backgroundColor = 'white';
    focusTrap.appendChild(dialogContainer);

    document.body.appendChild(dialogOverlay);

    dialogContainer.setAttribute('tabindex', '-1');
    dialogContainer.focus();
    dialogContainer.addEventListener('blur', () => {
      dialogContainer.removeAttribute('tabindex');
    });

    window.addEventListener('focusin', this.__onFocusIn.bind(this));

    // pass the dialog node here
    content(dialogContainer);
    this.dispatchEvent(new Event('dialog-opened'));
  }

  // eslint-disable-next-line
  close() {
    this.__dialogOpen = false;

    [...document.body.children].forEach(node => {
      node.removeAttribute('aria-hidden');
      node.removeAttribute('inert');
    });
    document.getElementById('__dialogOverlay').remove();

    this.__invokerNode.focus();
    this.__invokerNode = null;

    window.removeEventListener('focusin', this.__onFocusIn.bind(this));
    this.dispatchEvent(new Event('dialog-closed'));
  }

  __onKeyDown(e) {
    if (e.keyCode === KEYCODE_ESC && this.__dialogOpen && this.__closeOnEscape) {
      this.close();
      window.removeEventListener('keydown', this.__onKeyDown.bind(this), true);
    }
  }

  __onClick(e) {
    if (e.target === this.__dialogOverlay && this.__dialogOpen && this.__closeOnOutsideClick) {
      this.__dialogOverlay.removeEventListener('click', this.__onClick.bind(this), true);
      this.close();
    }
  }

  __onFocusIn() {
    if (this.__dialogOpen) {
      const focusable = this.__dialogOverlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstFocusable = focusable[0];

      if (!this.__dialogOverlay.contains(document.activeElement)) {
        firstFocusable.focus();
      }
    }
  }
}

export const dialog = new Dialog();
