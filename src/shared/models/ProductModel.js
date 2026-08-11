export class ProductModel {
    constructor({ id, name, color, price, image, filter = '' }) {
        this._id = id;
        this._name = name;
        this._color = color;
        this._price = price;
        this._image = image;
        this._filter = filter;
    }

    get id() { return this._id; }
    get name() { return this._name; }
    get color() { return this._color; }
    get price() { return this._price; }
    get image() { return this._image; }
    get filter() { return this._filter; }

    get formattedPrice() {
        return this._price.toLocaleString('vi-VN') + ' ₫';
    }

    get displayName() {
        return `${this._name} - ${this._color}`;
    }

    get searchableText() {
        return `${this._name} ${this._color}`.toLowerCase();
    }

    matchesKeyword(keyword) {
        if (!keyword) return true;
        const search = keyword.toLowerCase();
        return this.searchableText.includes(search);
    }

    matchesPriceRange(min, max) {
        return this._price >= min && this._price <= max;
    }

    toJSON() {
        return {
            id: this._id,
            name: this._name,
            color: this._color,
            price: this._price,
            image: this._image,
            filter: this._filter
        };
    }

    static fromJSON(data) {
        return new ProductModel(data);
    }
}