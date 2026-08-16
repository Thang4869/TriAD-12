import { describe, it, expect, vi, beforeEach } from "vitest";
import { RouterService } from "../../../../src/app/services/RouterService.js";

describe("RouterService", () => {
  let router;

  beforeEach(() => {
    delete window.location;
    window.location = { pathname: "/" };
    router = new RouterService();
  });

  it("should detect root path", () => {
    expect(router.rootPath).toBe("./");
    window.location.pathname = "/pages/about.html";
    const router2 = new RouterService();
    expect(router2.rootPath).toBe("../");
  });

  it("should fix header links", () => {
    document.body.innerHTML = `
      <div id="header-container">
        <a href="./">Home</a>
        <a href="./pages/about.html">About</a>
        <a href="pages/contact.html">Contact</a>
        <a href="./products.html">Products</a>
      </div>
      <footer>
        <a href="./privacy.html">Privacy</a>
      </footer>
    `;
    router.fixHeaderLinks();
    const links = document.querySelectorAll("a");
    expect(links[0].getAttribute("href")).toBe("./");
    expect(links[1].getAttribute("href")).toBe("./pages/about.html");
    expect(links[2].getAttribute("href")).toBe("./pages/contact.html");
    expect(links[3].getAttribute("href")).toBe("./products.html");
    expect(links[4].getAttribute("href")).toBe("./privacy.html");
  });

  it("should fix content links when root is ./", () => {
    router.rootPath = "./";
    document.body.innerHTML = `
      <div id="page-content">
        <img src="images/1.jpg">
        <a href="pages/blog.html">Blog</a>
        <a href="./pages/about.html">About</a>
        <a href="https://external.com">External</a>
      </div>
    `;
    router.fixContentLinks();
    const img = document.querySelector("img");
    expect(img.src).toContain("/images/1.jpg");
    const links = document.querySelectorAll("a");
    expect(links[0].href).toContain("/pages/blog.html");
    expect(links[1].href).toContain("/pages/about.html");
    expect(links[2].href).toBe("https://external.com/");
  });

  it("should fix content links when root is ../", () => {
    router.rootPath = "../";
    document.body.innerHTML = `
      <div id="page-content">
        <img src="../images/1.jpg">
        <a href="pages/blog.html">Blog</a>
        <a href="./pages/about.html">About</a>
      </div>
    `;
    router.fixContentLinks();
    const img = document.querySelector("img");
    expect(img.src).toContain("/images/1.jpg");
    const links = document.querySelectorAll("a");
    expect(links[0].href).toContain("/blog.html");
    expect(links[1].href).toContain("/about.html");
  });

  it("should resolve path", () => {
    expect(router.resolve("test.js")).toBe("./test.js");
    router.rootPath = "../";
    expect(router.resolve("test.js")).toBe("../test.js");
  });

  it('should fixContentLinks: handle root "./" with various link types', () => {
    router.rootPath = "./";
    document.body.innerHTML = `
      <div id="page-content">
        <a href="pages/blog.html">Blog</a>
        <a href="./pages/about.html">About</a>
        <a href="contact.html">Contact</a>
        <a href="#">#anchor</a>
        <a href="mailto:test@example.com">Email</a>
      </div>
    `;
    router.fixContentLinks();
    const links = document.querySelectorAll("a");
    expect(links[0].href).toContain("/pages/blog.html");
    expect(links[1].href).toContain("/pages/about.html");
    expect(links[2].href).toContain("/contact.html");
    // anchor and mailto should remain unchanged
    expect(links[3].href).toContain("#");
    expect(links[4].href).toContain("mailto:");
  });

  it("should fixContentLinks: handle images with various src", () => {
    router.rootPath = "../";
    document.body.innerHTML = `
      <div id="page-content">
        <img src="images/1.jpg">
        <img src="../images/2.jpg">
        <img src="./images/3.jpg">
      </div>
    `;
    router.fixContentLinks();
    const imgs = document.querySelectorAll("img");
    expect(imgs[0].getAttribute("src")).toBe("../images/1.jpg");
    expect(imgs[1].getAttribute("src")).toBe("../images/2.jpg");
    expect(imgs[2].getAttribute("src")).toBe("../images/3.jpg");
  });

  it("resolve should return path unchanged if absolute", () => {
    expect(router.resolve("/absolute/path")).toBe("/absolute/path");
  });
});
