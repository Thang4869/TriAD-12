import { Logger } from "../../core/services/Logger.js";

export class ContactService {
  constructor() {
    this.retryCount = 0;
    this.maxRetries = 2;
    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setupForm());
    } else {
      this.setupForm();
    }
  }

  setupForm() {
    const form = document.getElementById("contact-form");
    if (!form) {
      if (this.retryCount === 0) {
        Logger.debug("Contact form not found, waiting...");
      }

      this.retryCount++;

      if (this.retryCount >= this.maxRetries) {
        Logger.warn(
          "Contact form not found after " +
            this.maxRetries +
            " retries. Aborting.",
        );
        return;
      }

      setTimeout(() => this.setupForm(), 500);
      return;
    }

    this.retryCount = 0;

    Logger.debug("Contact form found, setting up...");

    form.removeAttribute("onsubmit");

    form.addEventListener("submit", (event) => {
      this.handleSubmit(event);
    });

    Logger.info("Contact form ready!");
  }

  handleSubmit(event) {
    event.preventDefault();

    const name = document.getElementById("user_name")?.value.trim();
    const email = document.getElementById("user_email")?.value.trim();
    const subject = document.getElementById("user_subject")?.value.trim();
    const message = document.getElementById("user_message")?.value.trim();

    if (!name) {
      this.showStatus("Please enter your name.", "warning");
      document.getElementById("user_name")?.focus();
      return;
    }
    if (!email) {
      this.showStatus("Please enter your email.", "warning");
      document.getElementById("user_email")?.focus();
      return;
    }
    if (!this.isValidEmail(email)) {
      this.showStatus("Please enter a valid email address.", "warning");
      document.getElementById("user_email")?.focus();
      return;
    }
    if (!subject) {
      this.showStatus("Please enter a subject.", "warning");
      document.getElementById("user_subject")?.focus();
      return;
    }
    if (!message) {
      this.showStatus("Please enter your message.", "warning");
      document.getElementById("user_message")?.focus();
      return;
    }

    const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    const to = "TriAD@shop.vn";
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Logger.debug("Opening Gmail Web with:", gmailUrl);

    window.open(gmailUrl, "_blank");

    this.showStatus("Opening Gmail... Please check your browser.", "success");

    setTimeout(() => {
      const form = document.getElementById("contact-form");
      if (form) {
        form.reset();
      }
    }, 1000);
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  showStatus(message, type = "info") {
    const statusDiv = document.getElementById("form-status");
    if (!statusDiv) return;

    statusDiv.classList.remove("hidden");
    statusDiv.className = `text-center mt-4 p-3 rounded-lg ${
      type === "success"
        ? "text-green-600 bg-green-50"
        : type === "warning"
          ? "text-yellow-600 bg-yellow-50"
          : type === "error"
            ? "text-red-600 bg-red-50"
            : "text-blue-600 bg-blue-50"
    }`;
    statusDiv.textContent = message;

    clearTimeout(statusDiv._timeout);
    statusDiv._timeout = setTimeout(() => {
      statusDiv.classList.add("hidden");
    }, 5000);
  }
}
