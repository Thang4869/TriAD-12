// config/products.js

export const products = [
    {
        id: 1,
        name: "AURA ThermoBox (White)",
        color: "Trắng",
        price: 399000,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
        filter: "grayscale brightness-110"
    },
    {
        id: 2,
        name: "AURA ThermoBox (Black)",
        color: "Đen",
        price: 399000,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
        filter: "grayscale contrast-125 brightness-50"
    },
    {
        id: 3,
        name: "ThermoBox (Pastel Purple)",
        color: "Tím Pastel",
        price: 499000,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
        filter: "hue-rotate-[250deg] brightness-105"
    },
    {
        id: 4,
        name: "ThermoBox (Pastel Blue)",
        color: "Xanh Pastel",
        price: 499000,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
        filter: "hue-rotate-[180deg]"
    },
    {
        id: 5,
        name: "ThermoBox (Pastel Pink)",
        color: "Hồng Pastel",
        price: 499000,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
        filter: "hue-rotate-[300deg]"
    }
];
window.products = products;

console.log(`Loaded ${products.length} products`);