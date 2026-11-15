const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export class DialogAccessibilityService {
  constructor(root = document) {
    this.root = root;
    this.activeDialog = null;
    this.restoreTarget = null;

    this.observer = new MutationObserver(() => this._syncActiveDialog());
    this.observer.observe(this.root.body, {
      attributes: true,
      attributeFilter: ["class", "aria-hidden"],
      subtree: true,
    });

    this._handleKeydown = this._handleKeydown.bind(this);
    this.root.addEventListener("keydown", this._handleKeydown, true);
    this._syncActiveDialog();
  }

  _getOpenDialogs() {
    return [
      ...this.root.querySelectorAll('[role="dialog"][aria-modal="true"]'),
    ].filter(
      (dialog) =>
        dialog.getAttribute("aria-hidden") !== "true" &&
        !dialog.hasAttribute("hidden") &&
        !dialog.closest(".hidden"),
    );
  }

  _getFocusableElements(dialog) {
    return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
      (element) =>
        !element.hasAttribute("hidden") &&
        !element.closest(".hidden") &&
        element.getAttribute("aria-hidden") !== "true" &&
        element.getClientRects().length > 0,
    );
  }

  _syncActiveDialog() {
    const dialogs = this._getOpenDialogs();
    const nextDialog = dialogs.at(-1) || null;

    if (nextDialog === this.activeDialog) return;

    if (!this.activeDialog && nextDialog) {
      this.restoreTarget =
        this.root.activeElement instanceof HTMLElement
          ? this.root.activeElement
          : null;
    }

    this.activeDialog = nextDialog;

    if (nextDialog) {
      requestAnimationFrame(() => {
        if (this.activeDialog !== nextDialog) return;
        const [firstFocusable] = this._getFocusableElements(nextDialog);
        (firstFocusable || nextDialog).focus();
      });
      return;
    }

    if (this.restoreTarget?.isConnected) {
      this.restoreTarget.focus();
    }
    this.restoreTarget = null;
  }

  _handleKeydown(event) {
    if (event.key !== "Tab" || !this.activeDialog) return;

    const focusableElements = this._getFocusableElements(this.activeDialog);
    if (focusableElements.length === 0) {
      event.preventDefault();
      this.activeDialog.focus();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const focusIsOutside = !this.activeDialog.contains(this.root.activeElement);

    if (event.shiftKey && (this.root.activeElement === first || focusIsOutside)) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (this.root.activeElement === last || focusIsOutside)
    ) {
      event.preventDefault();
      first.focus();
    }
  }
}
