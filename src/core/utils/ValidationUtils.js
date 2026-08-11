export const ValidationUtils = {
  email(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  phone(phone) {
    return /^[0-9]{10,12}$/.test(phone.replace(/\s/g, ''));
  },

  required(value) {
    return value?.trim()?.length > 0;
  },

  minLength(value, min) {
    return value?.length >= min;
  },

  maxLength(value, max) {
    return value?.length <= max;
  },

  cardNumber(number) {
    const clean = number.replace(/\s/g, '');
    return /^[0-9]{16}$/.test(clean);
  },

  expiry(expiry) {
    return /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry);
  },

  cvv(cvv) {
    return /^[0-9]{3,4}$/.test(cvv);
  }
};