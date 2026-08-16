import { Order } from "../../shared/models/index.js";
import { storage } from "../../core/services/Storage.js";
import { EVENTS } from "../../shared/constants/Events.js";
import { eventBus } from "../../core/services/EventBus.js";

const ORDERS_KEY = "orders";

export class CheckoutService {
  constructor() {
    this.storage = storage;
    this.orders = [];
    this.loadOrders();
  }

  loadOrders() {
    const data = this.storage.get(ORDERS_KEY, []);
    this.orders = data.map((order) => Order.fromJSON(order));
    return this.orders;
  }

  getOrders() {
    return [...this.orders];
  }

  createOrder(orderData) {
    const order = new Order(orderData);
    this.orders.push(order);
    this.saveOrders();

    eventBus.emit(EVENTS.CHECKOUT_COMPLETED, { order });
    return order;
  }

  saveOrders() {
    const data = this.orders.map((order) => order.toJSON());
    this.storage.set(ORDERS_KEY, data);
  }

  getOrderById(id) {
    return this.orders.find((order) => order.id === id) || null;
  }

  processCheckout(formData, cartItems) {
    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shipping = total >= 500000 ? 0 : 30000;

    const orderData = {
      items: cartItems,
      customer: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      },
      paymentMethod: formData.paymentMethod,
      total: total + shipping,
    };

    return this.createOrder(orderData);
  }
}
