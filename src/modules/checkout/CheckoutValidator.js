export class CheckoutValidator {
  validate(data) {
    const errors = [];

    if (!data.phone?.trim()) errors.push("Phone is required");
    if (!data.address?.trim()) errors.push("Address is required");

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push("Invalid phone number (10-12 digits)");
    }

    if (data.paymentMethod === "card") {
      if (!data.cardNumber?.trim()) errors.push("Card number is required");
      if (!data.cardExpiry?.trim()) errors.push("Card expiry is required");
      if (!data.cardCvv?.trim()) errors.push("CVV is required");

      if (data.cardNumber && data.cardNumber.replace(/\s/g, "").length < 16) {
        errors.push("Invalid card number (must be 16 digits)");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  isValidPhone(phone) {
    return /^[0-9]{10,12}$/.test(phone.replace(/\s/g, ""));
  }
}
