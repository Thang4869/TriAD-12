// config/products.js

export const products = [
    {
        id: 1,
        name: "TriAD Storage Container (1000ml/37oz)",
        color: "White",
        price: 150000,
        image: "images/21.jpg",
        filter: ""
    },
    {
        id: 2,
        name: "TriAD Storage Container (400ml/13.5oz)",
        color: "White",
        price: 110000,
        image: "images/22.jpg",
        filter: ""
    },
    {
        id: 3,
        name: "TriAD Storage Container (800ml/27oz)",
        color: "White",
        price: 130000,
        image: "images/23.jpg",
        filter: ""
    },
    {
        id: 4,
        name: "TriAD Storage Container (400ml/13.5oz)",
        color: "White",
        price: 110000,
        image: "images/24.jpg",
        filter: ""
    },
    {
        id: 5,
        name: "TriAD Storage Container (Combo TriAD)",
        color: "White",
        price: 350000,
        image: "images/25.jpg",
        filter: ""
    }
];
window.products = products;

console.log(`Loaded ${products.length} products`);