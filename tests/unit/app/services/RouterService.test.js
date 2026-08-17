import { describe, it, expect, vi, beforeEach } from "vitest";
import { RouterService } from "../../../../src/app/services/RouterService.js";

describe("RouterService", () => {
  let router;

  describe("constructor and rootPath detection", () => {
    it("should detect root as './' when not in /pages/", () => {
      delete window.location;
      window.location = { pathname: "/" };
      router = new RouterService();
      expect(router.rootPath).toBe("./");
    });

    it("should detect root as '../' when in /pages/", () => {
      delete window.location;
      window.location = { pathname: "/pages/about.html" };
      router = new RouterService();
      expect(router.rootPath).toBe("../");
    });
  });

  describe("fixHeaderLinks", () => {
    beforeEach(() => {
      router = new RouterService();
      router.rootPath = "./";
    });

    it("should fix links based on root './'", () => {
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

    it("should fix links based on root '../'", () => {
      router.rootPath = "../";
      document.body.innerHTML = `
        <div id="header-container">
          <a href="./">Home</a>
          <a href="./pages/about.html">About</a>
          <a href="pages/contact.html">Contact</a>
        </div>
      `;
      router.fixHeaderLinks();
      const links = document.querySelectorAll("a");
      expect(links[0].getAttribute("href")).toBe("../");
      expect(links[1].getAttribute("href")).toBe("../pages/about.html");
      expect(links[2].getAttribute("href")).toBe("../pages/contact.html");
    });

    it("should handle links with missing href (no href attribute)", () => {
      document.body.innerHTML = `
        <div id="header-container">
          <a>No href</a>
          <a href="./">Home</a>
        </div>
      `;
      expect(() => router.fixHeaderLinks()).not.toThrow();
      const links = document.querySelectorAll("a");
      expect(links[0].getAttribute("href")).toBeNull();
      expect(links[1].getAttribute("href")).toBe("./");
    });
  });

  describe("fixContentLinks", () => {
    describe("with root './'", () => {
      beforeEach(() => {
        router = new RouterService();
        router.rootPath = "./";
      });

      it("should fix image src for images/ prefix", () => {
        document.body.innerHTML = `<div id="page-content"><img src="images/1.jpg"></div>`;
        router.fixContentLinks();
        const img = document.querySelector("img");
        expect(img.getAttribute("src")).toBe("./images/1.jpg");
      });

      it("should fix image src for ../images/ prefix", () => {
        document.body.innerHTML = `<div id="page-content"><img src="../images/2.jpg"></div>`;
        router.fixContentLinks();
        const img = document.querySelector("img");
        expect(img.getAttribute("src")).toBe("./images/2.jpg");
      });

      it("should fix image src for ./images/ prefix", () => {
        document.body.innerHTML = `<div id="page-content"><img src="./images/3.jpg"></div>`;
        router.fixContentLinks();
        const img = document.querySelector("img");
        expect(img.getAttribute("src")).toBe("./images/3.jpg");
      });

      it("should handle images with empty or missing src", () => {
        document.body.innerHTML = `
          <div id="page-content">
            <img src="">
            <img>
          </div>
        `;
        expect(() => router.fixContentLinks()).not.toThrow();
        const imgs = document.querySelectorAll("img");
        expect(imgs[0].getAttribute("src")).toBe("");
        expect(imgs[1].getAttribute("src")).toBeNull();
      });

      it("should fix links for pages/ prefix", () => {
        document.body.innerHTML = `<div id="page-content"><a href="pages/blog.html">Blog</a></div>`;
        router.fixContentLinks();
        const link = document.querySelector("a");
        expect(link.getAttribute("href")).toBe("pages/blog.html");
      });

      it("should fix links for ./pages/ prefix", () => {
        document.body.innerHTML = `<div id="page-content"><a href="./pages/about.html">About</a></div>`;
        router.fixContentLinks();
        const link = document.querySelector("a");
        expect(link.getAttribute("href")).toBe("pages/about.html");
      });

      it("should leave external, mailto, anchor links unchanged", () => {
        document.body.innerHTML = `
          <div id="page-content">
            <a href="https://external.com">External</a>
            <a href="mailto:test@example.com">Email</a>
            <a href="#section">Anchor</a>
            <a href="javascript:void(0)">JS</a>
            <a href="tel:123">Phone</a>
          </div>
        `;
        router.fixContentLinks();
        const links = document.querySelectorAll("a");
        expect(links[0].getAttribute("href")).toBe("https://external.com");
        expect(links[1].getAttribute("href")).toBe("mailto:test@example.com");
        expect(links[2].getAttribute("href")).toBe("#section");
        expect(links[3].getAttribute("href")).toBe("javascript:void(0)");
        expect(links[4].getAttribute("href")).toBe("tel:123");
      });

      it("should handle links with empty or missing href", () => {
        document.body.innerHTML = `
          <div id="page-content">
            <a href="">Empty</a>
            <a>Missing</a>
          </div>
        `;
        expect(() => router.fixContentLinks()).not.toThrow();
        const links = document.querySelectorAll("a");
        expect(links[0].getAttribute("href")).toBe("");
        expect(links[1].getAttribute("href")).toBeNull();
      });
    });

    describe("with root '../'", () => {
      beforeEach(() => {
        router = new RouterService();
        router.rootPath = "../";
      });

      it("should fix image src for images/ prefix", () => {
        document.body.innerHTML = `<div id="page-content"><img src="images/1.jpg"></div>`;
        router.fixContentLinks();
        const img = document.querySelector("img");
        expect(img.getAttribute("src")).toBe("../images/1.jpg");
      });

      it("should leave ../images/ prefix unchanged", () => {
        document.body.innerHTML = `<div id="page-content"><img src="../images/2.jpg"></div>`;
        router.fixContentLinks();
        const img = document.querySelector("img");
        expect(img.getAttribute("src")).toBe("../images/2.jpg");
      });

      it("should fix image src for ./images/ prefix to ../images/", () => {
        document.body.innerHTML = `<div id="page-content"><img src="./images/3.jpg"></div>`;
        router.fixContentLinks();
        const img = document.querySelector("img");
        expect(img.getAttribute("src")).toBe("../images/3.jpg");
      });

      it("should fix links for pages/ prefix by removing pages/", () => {
        document.body.innerHTML = `<div id="page-content"><a href="pages/blog.html">Blog</a></div>`;
        router.fixContentLinks();
        const link = document.querySelector("a");
        expect(link.getAttribute("href")).toBe("blog.html");
      });

      it("should fix links for ./pages/ prefix by removing ./pages/", () => {
        document.body.innerHTML = `<div id="page-content"><a href="./pages/about.html">About</a></div>`;
        router.fixContentLinks();
        const link = document.querySelector("a");
        expect(link.getAttribute("href")).toBe("about.html");
      });

      it("should leave other links unchanged (non-matching)", () => {
        document.body.innerHTML = `
          <div id="page-content">
            <a href="products.html">Products</a>
            <a href="./contact.html">Contact</a>
          </div>
        `;
        router.fixContentLinks();
        const links = document.querySelectorAll("a");
        expect(links[0].getAttribute("href")).toBe("products.html");
        expect(links[1].getAttribute("href")).toBe("./contact.html");
      });
    });
  });

  describe("resolve", () => {
    beforeEach(() => {
      router = new RouterService();
      router.rootPath = "./";
    });

    it("should return absolute path as is", () => {
      expect(router.resolve("/absolute/path")).toBe("/absolute/path");
    });

    it("should prepend rootPath to relative paths", () => {
      expect(router.resolve("test.js")).toBe("./test.js");
      router.rootPath = "../";
      expect(router.resolve("test.js")).toBe("../test.js");
    });
  });

  describe("branch coverage - fixHeaderLinks", () => {
    it("should handle href === './' when root is '../'", () => {
      router = new RouterService();
      router.rootPath = "../";
      document.body.innerHTML = `
        <div id="header-container">
          <a href="./">Home</a>
        </div>
      `;
      router.fixHeaderLinks();
      const link = document.querySelector("a");
      expect(link.getAttribute("href")).toBe("../");
    });

    it("should handle href starting with './pages/' when root is '../'", () => {
      router = new RouterService();
      router.rootPath = "../";
      document.body.innerHTML = `
        <div id="header-container">
          <a href="./pages/about.html">About</a>
        </div>
      `;
      router.fixHeaderLinks();
      const link = document.querySelector("a");
      expect(link.getAttribute("href")).toBe("../pages/about.html");
    });

    it("should handle href starting with 'pages/' when root is '../'", () => {
      router = new RouterService();
      router.rootPath = "../";
      document.body.innerHTML = `
        <div id="header-container">
          <a href="pages/contact.html">Contact</a>
        </div>
      `;
      router.fixHeaderLinks();
      const link = document.querySelector("a");
      expect(link.getAttribute("href")).toBe("../pages/contact.html");
    });

    it("should handle href starting with './' (other) when root is '../'", () => {
      router = new RouterService();
      router.rootPath = "../";
      document.body.innerHTML = `
        <div id="header-container">
          <a href="./products.html">Products</a>
        </div>
      `;
      router.fixHeaderLinks();
      const link = document.querySelector("a");
      expect(link.getAttribute("href")).toBe("../products.html");
    });
  });

  describe("branch coverage - fixContentLinks", () => {
    it("should handle image src with 'images/' prefix when root is '../'", () => {
      router = new RouterService();
      router.rootPath = "../";
      document.body.innerHTML = `<div id="page-content"><img src="images/1.jpg"></div>`;
      router.fixContentLinks();
      const img = document.querySelector("img");
      expect(img.getAttribute("src")).toBe("../images/1.jpg");
    });

    it("should handle image src with '../images/' prefix when root is './'", () => {
      router = new RouterService();
      router.rootPath = "./";
      document.body.innerHTML = `<div id="page-content"><img src="../images/2.jpg"></div>`;
      router.fixContentLinks();
      const img = document.querySelector("img");
      expect(img.getAttribute("src")).toBe("./images/2.jpg");
    });

    it("should handle image src with './images/' prefix when root is '../'", () => {
      router = new RouterService();
      router.rootPath = "../";
      document.body.innerHTML = `<div id="page-content"><img src="./images/3.jpg"></div>`;
      router.fixContentLinks();
      const img = document.querySelector("img");
      expect(img.getAttribute("src")).toBe("../images/3.jpg");
    });

    it("should handle link href with 'pages/' prefix when root is './'", () => {
      router = new RouterService();
      router.rootPath = "./";
      document.body.innerHTML = `<div id="page-content"><a href="pages/blog.html">Blog</a></div>`;
      router.fixContentLinks();
      const link = document.querySelector("a");
      expect(link.getAttribute("href")).toBe("pages/blog.html");
    });

    it("should handle link href with './pages/' prefix when root is '../'", () => {
      router = new RouterService();
      router.rootPath = "../";
      document.body.innerHTML = `<div id="page-content"><a href="./pages/about.html">About</a></div>`;
      router.fixContentLinks();
      const link = document.querySelector("a");
      expect(link.getAttribute("href")).toBe("about.html");
    });
  });
});