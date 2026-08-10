// src/shared/services/logger.service.js

function isDebugEnabled() {
    if (typeof window === 'undefined') return false;

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const fromUrl = urlParams.get('debug') === 'true';
        const fromStorage = window.localStorage.getItem('debug') === 'true';
        return fromUrl || fromStorage;
    } catch (error) {
        return false;
    }
}

const debugEnabled = isDebugEnabled();

export const logger = {
    debug: (...args) => {
        if (!debugEnabled) return;
        console.debug('[DEBUG]', ...args);
    },
    info: (...args) => console.info('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    group: (label, fn) => {
        if (!debugEnabled) return;
        console.group(label);
        fn();
        console.groupEnd();
    }
};