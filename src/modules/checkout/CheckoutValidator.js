export class CheckoutValidator {
  validate(data) {
    const errors = [];

    if (!data.phone?.trim()) errors.push("Phone is required");
    if (!data.address?.trim()) errors.push("Address is required");

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push("Invalid phone number (10-12 digits)");
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
