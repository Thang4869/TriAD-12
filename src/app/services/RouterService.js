import { Logger } from '../../core/services/Logger.js';

export class RouterService {
  constructor() {
    this.rootPath = this._getRootPath();
    Logger.debug(`RouterService initialized with root: ${this.rootPath}`);
  }

  _getRootPath() {
    const pathname = window.location.pathname;
    if (pathname.includes('/pages/')) {
      return '../';
    }
    return './';
  }

fixHeaderLinks() {
  const root = this.rootPath;
  const allLinks = document.querySelectorAll('#header-container a, footer a');

  allLinks.forEach(link => {
    let href = link.getAttribute('href');
    if (!href) return;

    if (href === './') {
      link.setAttribute('href', root);
      return;
    }

    if (href.startsWith('./pages/')) {
      const path = href.replace('./pages/', '');
      link.setAttribute('href', `${root}pages/${path}`);
      return;
    }

    if (href.startsWith('pages/')) {
      link.setAttribute('href', `${root}${href}`);
      return;
    }

    if (href.startsWith('./')) {
      link.setAttribute('href', `${root}${href.substring(2)}`);
      return;
    }
  });

  Logger.debug('Header links fixed.');
}

  fixContentLinks() {
    const root = this.rootPath;

    document.querySelectorAll('#page-content img').forEach(img => {
      let src = img.getAttribute('src');
      if (!src) return;

      if (src.startsWith('images/')) {
        img.src = root === './' ? `./${src}` : `../${src}`;
      } else if (src.startsWith('../images/')) {
        img.src = root === './' ? src.replace('../', './') : src;
      }
    });

    document.querySelectorAll('#page-content a').forEach(link => {
      let href = link.getAttribute('href');
      if (!href) return;

      if (href.match(/^(https?|#|mailto|javascript|tel)/i)) return;

      if (href.startsWith('pages/')) {
        if (root === './') {
          link.href = href;
        } else if (root === '../') {
          link.href = href.replace('pages/', '');
        }
      } else if (href.startsWith('./pages/')) {
        if (root === './') {
          link.href = href.replace('./', '');
        } else if (root === '../') {
          link.href = href.replace('./pages/', '');
        }
      }
    });

    Logger.debug('Content links fixed.');
  }

  resolve(path) {
    if (path.startsWith('/')) return path;
    return this.rootPath + path;
  }
}