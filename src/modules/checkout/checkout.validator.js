/**
 * Checkout Validator - Validates checkout form data
 * 
 * Single Responsibility: Form validation logic
 */
export class CheckoutValidator {
    /**
     * Validate all checkout data
     */
    validate(data) {
        const errors = [];
        
        // Required fields
        if (!data.firstName?.trim()) errors.push('First name is required');
        if (!data.lastName?.trim()) errors.push('Last name is required');
        if (!data.email?.trim()) errors.push('Email is required');
        if (!data.phone?.trim()) errors.push('Phone is required');
        if (!data.address?.trim()) errors.push('Address is required');
        
        // Email validation
        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Invalid email format');
        }
        
        // Phone validation
        if (data.phone && !this.isValidPhone(data.phone)) {
            errors.push('Invalid phone number (10-12 digits)');
        }
        
        // Card validation
        if (data.paymentMethod === 'card') {
            if (!data.cardNumber?.trim()) errors.push('Card number is required');
            if (!data.cardExpiry?.trim()) errors.push('Card expiry is required');
            if (!data.cardCvv?.trim()) errors.push('CVV is required');
            
            if (data.cardNumber && data.cardNumber.replace(/\s/g, '').length < 16) {
                errors.push('Invalid card number (must be 16 digits)');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Validate email format
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    /**
     * Validate phone number
     */
    isValidPhone(phone) {
        return /^[0-9]{10,12}$/.test(phone.replace(/\s/g, ''));
    }
}