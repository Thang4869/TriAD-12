/**
 * Validators - Common validation functions
 */
export const Validators = {
    email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    
    phone: (phone) => /^[0-9]{10,12}$/.test(phone.replace(/\s/g, '')),
    
    required: (value) => value?.trim()?.length > 0,
    
    minLength: (value, min) => value?.length >= min,
    
    maxLength: (value, max) => value?.length <= max,
    
    cardNumber: (number) => {
        const clean = number.replace(/\s/g, '');
        return /^[0-9]{16}$/.test(clean);
    },
    
    expiry: (expiry) => /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry),
    
    cvv: (cvv) => /^[0-9]{3,4}$/.test(cvv),
};

// Export individual functions for convenience
export const isValidEmail = Validators.email;
export const isValidPhone = Validators.phone;
export const isRequired = Validators.required;