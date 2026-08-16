export const FormatUtils = {
  price(value) {
    return value.toLocaleString("vi-VN") + " ₫";
  },

  number(value) {
    return value.toLocaleString("vi-VN");
  },

  date(date, options = {}) {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    });
  },

  orderId() {
    return (
      "ORD-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase()
    );
  },
};
