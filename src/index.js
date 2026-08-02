/**
 * Main Entry Point
 * 
 * Imports all modules and starts the application
 */
import './config/products.config.js';
import './config/settings.config.js';

// Shared services
import './shared/services/storage.service.js';
import './shared/services/event-bus.service.js';

// Shared models
import './shared/models/index.js';

// Shared utils
import './shared/utils/dom.utils.js';
import './shared/utils/helpers.utils.js';
import './shared/utils/loader.utils.js';

// Modules
import './modules/toast/index.js';
import './modules/fly-to-cart/index.js';
import './modules/cart/index.js';
import './modules/products/index.js';
import './modules/modal/index.js';
import './modules/checkout/index.js';

// App
import { bootstrap } from './app/bootstrap.js';

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', bootstrap);