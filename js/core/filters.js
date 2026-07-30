// core/filters.js
import { getFiltersStorage, setFiltersStorage } from '../utils/storage.js';
import { formatPrice } from '../utils/helpers.js';
import { debounce } from '../utils/dom.js';

let filteredProducts = [];
let filterState = getFiltersStorage();
let allProducts = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 12;
let isLoading = false;

window.filterState = filterState;

export function initFilters(products) {
    allProducts = products;
    filteredProducts = [...products];
    applyFiltersFromState();
}

export function searchProducts(keyword) {
    filterState.keyword = keyword.trim();
    saveFilterState();
    applyFilters();
}

export function applyFilters() {
    const { keyword, minPrice, maxPrice } = filterState;
    
    filteredProducts = allProducts.filter(product => {
        const matchKeyword = !keyword || 
            product.name.toLowerCase().includes(keyword.toLowerCase()) ||
            product.color.toLowerCase().includes(keyword.toLowerCase());
        const matchPrice = product.price >= minPrice && product.price <= maxPrice;
        return matchKeyword && matchPrice;
    });
    
    sortProducts();
}

export function sortProducts() {
    const { sort } = filterState;
    
    switch (sort) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
    }
    
    currentPage = 1;
    renderProducts();
}

// core/filters.js - phần renderProducts

export function renderProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) {
        console.error('Product grid not found!');
        return;
    }
    
    console.log(`🔄 Rendering ${filteredProducts.length} products...`);
    
    const end = currentPage * ITEMS_PER_PAGE;
    const items = filteredProducts.slice(0, end);
    
    if (currentPage === 1) {
        grid.innerHTML = '';
    }
    
    if (items.length === 0 && currentPage === 1) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <i class="ph ph-magnifying-glass text-6xl text-gray-300"></i>
                <p class="mt-4 text-gray-500">Không tìm thấy sản phẩm</p>
                <button id="clear-search-btn" class="mt-4 text-brand-accent hover:underline">
                    Clear filters
                </button>
            </div>
        `;
        document.getElementById('clear-search-btn')?.addEventListener('click', resetFilters);
        updateProductCount(0);
        updateLoadMore(false);
        return;
    }
    
    items.forEach((product, index) => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });
    
    console.log(`Rendered ${items.length} products`);
    
    const hasMore = filteredProducts.length > currentPage * ITEMS_PER_PAGE;
    updateLoadMore(hasMore);
    updateProductCount(filteredProducts.length);
}

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden';
    div.innerHTML = `
        <div onclick="window.openProductModal(${product.id})" class="cursor-pointer">
            <div class="bg-gray-50 p-8 relative overflow-hidden">
                <img src="${product.image}" 
                     alt="${product.name}" 
                     class="product-image w-full h-72 object-contain transition-transform duration-500 ${product.filter || ''}"
                     loading="lazy">
            </div>
            <div class="p-6">
                <h3 class="text-xl font-semibold">${product.name}</h3>
                <p class="text-gray-500 mt-1 text-sm">${product.color}</p>
                <div class="flex justify-between items-center mt-6">
                    <span class="text-2xl font-bold">${formatPrice(product.price)}</span>
                    <button onclick="event.stopPropagation();window.addToCart(${product.id}, 1, this.closest('.product-card').querySelector('img'))" 
                            class="add-to-cart-btn bg-black text-white px-5 py-3 rounded-full hover:bg-gray-800 transition-all">
                        <i class="ph ph-shopping-cart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    return div;
}

function updateLoadMore(hasMore) {
    const container = document.getElementById('load-more-container');
    if (!container) return;
    container.classList.toggle('hidden', !hasMore);
}

function updateProductCount(count) {
    const el = document.getElementById('product-count');
    if (el) el.textContent = `${count} sản phẩm`;
}

export function loadMore() {
    if (isLoading) return;
    isLoading = true;
    
    const hasMore = filteredProducts.length > currentPage * ITEMS_PER_PAGE;
    if (!hasMore) {
        isLoading = false;
        return;
    }
    
    currentPage++;
    renderProducts();
    setTimeout(() => { isLoading = false; }, 300);
}

function saveFilterState() {
    setFiltersStorage(filterState);
}

function applyFiltersFromState() {
    const { keyword, maxPrice, sort } = filterState;
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = keyword || '';
    
    const slider = document.getElementById('price-slider');
    if (slider) {
        slider.value = maxPrice || 499000;
        const priceDisplay = document.getElementById('price-value');
        if (priceDisplay) priceDisplay.textContent = formatPrice(maxPrice || 499000);
    }
    
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = sort || 'default';
    
    applyFilters();
}

export function resetFilters() {
    filterState = {
        keyword: '',
        minPrice: 0,
        maxPrice: 499000,
        sort: 'default'
    };
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    const slider = document.getElementById('price-slider');
    if (slider) slider.value = 499000;
    
    const priceDisplay = document.getElementById('price-value');
    if (priceDisplay) priceDisplay.textContent = formatPrice(499000);
    
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'default';
    
    saveFilterState();
    applyFilters();
}

export function setPriceFilter(value) {
    filterState.maxPrice = Number(value);
    saveFilterState();
    applyFilters();
}

window.searchProducts = searchProducts;
window.resetFilters = resetFilters;
window.setPriceFilter = setPriceFilter;
window.loadMore = loadMore;
window.applyFilters = applyFilters;