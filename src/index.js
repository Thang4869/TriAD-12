import './config/products.config.js';
import './config/settings.config.js';

import './core/services/EventBus.js';
import './core/services/Storage.js';

import './shared/models/index.js';

import './core/utils/DomUtils.js';
import './shared/utils/helpers.js';
import './shared/utils/loader.js';

import './modules/toast/index.js';
import './modules/fly-to-cart/index.js';
import './modules/cart/index.js';
import './modules/products/index.js';
import './modules/modal/index.js';
import './modules/checkout/index.js';
import './modules/contact/index.js';
import './modules/notification/index.js';
import './modules/blog/index.js';
import './modules/reviews/index.js';

import { bootstrap } from './app/bootstrap.js';

document.addEventListener('DOMContentLoaded', bootstrap);