import { Logger } from "../../core/services/Logger.js";
import { eventBus } from "../../core/services/EventBus.js";
import { EVENTS } from "../../shared/constants/Events.js";

export class ErrorHandler {
  constructor(toastService) {
    this.toast = toastService;
    this._watch();
    Logger.debug("ErrorHandler initialized");
  }

  _watch() {
    window.addEventListener("error", (e) => {
      Logger.error("Uncaught error:", e.error || e.message);
      this.toast?.error(
        "Something went wrong",
        "Please try again or refresh the page.",
      );
      eventBus.emit(EVENTS.APP_ERROR, { error: e.error || e.message });
    });

    window.addEventListener("unhandledrejection", (e) => {
      Logger.error("Unhandled rejection:", e.reason);
      this.toast?.error("Error", "An unexpected error occurred.");
      eventBus.emit(EVENTS.APP_ERROR, { error: e.reason });
    });
  }
}
