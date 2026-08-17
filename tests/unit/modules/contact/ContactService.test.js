import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ContactService } from "../../../../src/modules/contact/ContactService.js";

vi.mock("../../../../src/core/services/Logger.js", () => ({
  Logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ContactService", () => {
  let service;
  let LoggerMock;
  let originalOpen;

  beforeEach(async () => {
    const { Logger } = await import(
      "../../../../src/core/services/Logger.js"
    );
    LoggerMock = Logger;
    LoggerMock.debug.mockClear();
    LoggerMock.info.mockClear();
    LoggerMock.warn.mockClear();
    LoggerMock.error.mockClear();

    originalOpen = window.open;
    window.open = vi.fn();

    document.body.innerHTML = `
      <form id="contact-form">
        <input id="user_name" />
        <input id="user_email" />
        <input id="user_subject" />
        <textarea id="user_message"></textarea>
        <div id="form-status"></div>
      </form>
    `;

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.open = originalOpen;
    document.body.innerHTML = "";
    Object.defineProperty(document, "readyState", {
      value: "complete",
      configurable: true,
    });
    localStorage.removeItem("debug");
  });

  describe("constructor and init", () => {
    it("should call setupForm directly if document is not loading", () => {
      Object.defineProperty(document, "readyState", {
        value: "complete",
        configurable: true,
      });
      const setupSpy = vi.spyOn(ContactService.prototype, "setupForm");
      service = new ContactService();
      expect(setupSpy).toHaveBeenCalled();
    });

    it("should add DOMContentLoaded listener if document is loading", () => {
      Object.defineProperty(document, "readyState", {
        value: "loading",
        configurable: true,
      });
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      service = new ContactService();
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "DOMContentLoaded",
        expect.any(Function),
      );
    });
  });

  describe("setupForm", () => {
    it("should retry if form not found, and abort after max retries", () => {
      document.body.innerHTML = "";
      service = new ContactService();
      service.retryCount = 0;
      const setTimeoutSpy = vi.spyOn(global, "setTimeout");

      service.setupForm();
      expect(LoggerMock.debug).toHaveBeenCalledWith(
        "Contact form not found, waiting...",
      );
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
      expect(service.retryCount).toBe(1);

      service.setupForm();
      expect(service.retryCount).toBe(2);
      expect(LoggerMock.warn).toHaveBeenCalledWith(
        "Contact form not found after 2 retries. Aborting.",
      );
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    });

    it("should set up form when form exists", () => {
      service = new ContactService();
      service.retryCount = 2;
      const form = document.getElementById("contact-form");
      const removeAttributeSpy = vi.spyOn(form, "removeAttribute");
      const addEventListenerSpy = vi.spyOn(form, "addEventListener");

      service.setupForm();

      expect(service.retryCount).toBe(0);
      expect(LoggerMock.debug).toHaveBeenCalledWith(
        "Contact form found, setting up...",
      );
      expect(removeAttributeSpy).toHaveBeenCalledWith("onsubmit");
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "submit",
        expect.any(Function),
      );
      expect(LoggerMock.info).toHaveBeenCalledWith("Contact form ready!");
    });
  });

  describe("handleSubmit", () => {
    let form;
    let nameInput, emailInput, subjectInput, messageInput;

    beforeEach(() => {
      form = document.getElementById("contact-form");
      nameInput = document.getElementById("user_name");
      emailInput = document.getElementById("user_email");
      subjectInput = document.getElementById("user_subject");
      messageInput = document.getElementById("user_message");
      service = new ContactService();
      service.setupForm();
    });

    it("should prevent default form submission", () => {
      const event = new Event("submit", { cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");
      form.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should show warning and focus name if name is missing", () => {
      const showStatusSpy = vi.spyOn(service, "showStatus");
      const focusSpy = vi.spyOn(nameInput, "focus");
      nameInput.value = "";
      form.dispatchEvent(new Event("submit"));
      expect(showStatusSpy).toHaveBeenCalledWith(
        "Please enter your name.",
        "warning",
      );
      expect(focusSpy).toHaveBeenCalled();
    });

    it("should show warning and focus email if email is missing", () => {
      const showStatusSpy = vi.spyOn(service, "showStatus");
      const focusSpy = vi.spyOn(emailInput, "focus");
      nameInput.value = "John";
      emailInput.value = "";
      form.dispatchEvent(new Event("submit"));
      expect(showStatusSpy).toHaveBeenCalledWith(
        "Please enter your email.",
        "warning",
      );
      expect(focusSpy).toHaveBeenCalled();
    });

    it("should show warning and focus email if email is invalid", () => {
      const showStatusSpy = vi.spyOn(service, "showStatus");
      const focusSpy = vi.spyOn(emailInput, "focus");
      nameInput.value = "John";
      emailInput.value = "invalid";
      form.dispatchEvent(new Event("submit"));
      expect(showStatusSpy).toHaveBeenCalledWith(
        "Please enter a valid email address.",
        "warning",
      );
      expect(focusSpy).toHaveBeenCalled();
    });

    it("should show warning and focus subject if subject is missing", () => {
      const showStatusSpy = vi.spyOn(service, "showStatus");
      const focusSpy = vi.spyOn(subjectInput, "focus");
      nameInput.value = "John";
      emailInput.value = "john@example.com";
      subjectInput.value = "";
      form.dispatchEvent(new Event("submit"));
      expect(showStatusSpy).toHaveBeenCalledWith(
        "Please enter a subject.",
        "warning",
      );
      expect(focusSpy).toHaveBeenCalled();
    });

    it("should show warning and focus message if message is missing", () => {
      const showStatusSpy = vi.spyOn(service, "showStatus");
      const focusSpy = vi.spyOn(messageInput, "focus");
      nameInput.value = "John";
      emailInput.value = "john@example.com";
      subjectInput.value = "Subject";
      messageInput.value = "";
      form.dispatchEvent(new Event("submit"));
      expect(showStatusSpy).toHaveBeenCalledWith(
        "Please enter your message.",
        "warning",
      );
      expect(focusSpy).toHaveBeenCalled();
    });

    it("should open Gmail, show success, and reset form on valid submission", () => {
      const showStatusSpy = vi.spyOn(service, "showStatus");
      const resetSpy = vi.spyOn(form, "reset");

      nameInput.value = "John Doe";
      emailInput.value = "john@example.com";
      subjectInput.value = "Test Subject";
      messageInput.value = "Hello world";

      form.dispatchEvent(new Event("submit"));

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(
          "https://mail.google.com/mail/?view=cm&fs=1&to=TriAD%40shop.vn&su=Test%20Subject&body=Name%3A%20John%20Doe%0AEmail%3A%20john%40example.com%0A%0AMessage%3A%0AHello%20world",
        ),
        "_blank",
      );
      expect(LoggerMock.debug).toHaveBeenCalledWith(
        "Opening Gmail Web with:",
        expect.any(String),
      );
      expect(showStatusSpy).toHaveBeenCalledWith(
        "Opening Gmail... Please check your browser.",
        "success",
      );

      vi.advanceTimersByTime(1000);
      expect(resetSpy).toHaveBeenCalled();
    });

    it("should not reset form if form no longer exists after timeout", () => {
      const resetSpy = vi.spyOn(form, "reset");
      nameInput.value = "John";
      emailInput.value = "john@example.com";
      subjectInput.value = "Subject";
      messageInput.value = "Message";
      form.dispatchEvent(new Event("submit"));
      form.remove();
      vi.advanceTimersByTime(1000);
      expect(resetSpy).not.toHaveBeenCalled();
    });
  });

  describe("isValidEmail", () => {
    beforeEach(() => {
      service = new ContactService();
    });

    it("should return true for valid email addresses", () => {
      expect(service.isValidEmail("test@example.com")).toBe(true);
      expect(service.isValidEmail("a.b@c.co")).toBe(true);
    });

    it("should return false for invalid email addresses", () => {
      expect(service.isValidEmail("invalid")).toBe(false);
      expect(service.isValidEmail("")).toBe(false);
    });
  });

  describe("showStatus", () => {
    let statusDiv;

    beforeEach(() => {
      service = new ContactService();
      statusDiv = document.getElementById("form-status");
    });

    it("should do nothing if statusDiv is not found", () => {
      statusDiv.remove();
      expect(() => service.showStatus("test")).not.toThrow();
    });

    it("should display success message with green styling", () => {
      service.showStatus("Success", "success");
      expect(statusDiv.textContent).toBe("Success");
      expect(statusDiv.className).toContain("text-green-600");
      expect(statusDiv.className).toContain("bg-green-50");
      expect(statusDiv.classList.contains("hidden")).toBe(false);
    });

    it("should display warning message with yellow styling", () => {
      service.showStatus("Warning", "warning");
      expect(statusDiv.className).toContain("text-yellow-600");
      expect(statusDiv.className).toContain("bg-yellow-50");
    });

    it("should display error message with red styling", () => {
      service.showStatus("Error", "error");
      expect(statusDiv.className).toContain("text-red-600");
      expect(statusDiv.className).toContain("bg-red-50");
    });

    it("should display info message with blue styling (default)", () => {
      service.showStatus("Info");
      expect(statusDiv.className).toContain("text-blue-600");
      expect(statusDiv.className).toContain("bg-blue-50");
    });

    it("should hide status after 5 seconds and clear previous timeout", () => {
      service.showStatus("Test");
      expect(statusDiv.classList.contains("hidden")).toBe(false);
      vi.advanceTimersByTime(5000);
      expect(statusDiv.classList.contains("hidden")).toBe(true);
    });
  });
});