// utils/loader.js

/**
 * Load HTML component vào element
 */
export async function loadComponent(elementId, filePath, callback = null) {
    try {
        console.log(`Loading: ${filePath}`);
        
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        const element = document.getElementById(elementId);
        
        if (element) {
            element.innerHTML = html;
            console.log(`Loaded: ${filePath} (${html.length} bytes)`);
            if (callback) callback();
            return html;
        } else {
            console.warn(`Element #${elementId} not found for ${filePath}`);
            return null;
        }
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
        return null;
    }
}

/**
 * Load nhiều components cùng lúc
 */
export async function loadComponents(components) {
    const results = [];
    for (const config of components) {
        const result = await loadComponent(
            config.elementId,
            config.filePath,
            config.callback
        );
        results.push({ ...config, success: !!result });
    }
    return results;
}

/**
 * Load component và inject vào DOM tại vị trí chỉ định
 */
export function injectComponent(selector, filePath, position = 'afterbegin') {
    fetch(filePath)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
        })
        .then(html => {
            const target = document.querySelector(selector);
            if (target) {
                target.insertAdjacentHTML(position, html);
                console.log(`Injected: ${filePath}`);
            } else {
                console.warn(`Selector not found: ${selector}`);
            }
        })
        .catch(err => console.error('Error injecting component:', err));
}