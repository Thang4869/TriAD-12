import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandler } from '../../../../src/app/services/ErrorHandler.js';

describe('ErrorHandler', () => {
  let errorHandler;
  let mockToast;

  beforeEach(() => {
    mockToast = {
      error: vi.fn(),
    };
    errorHandler = new ErrorHandler(mockToast);
  });

    it('should handle window error', () => {
        const errorEvent = new ErrorEvent('error', { error: new Error('Test error'), message: 'Test' });
        window.dispatchEvent(errorEvent);
        expect(mockToast.error).toHaveBeenCalledWith('Something went wrong', 'Please try again or refresh the page.');
    });

    it('should handle unhandled rejection', () => {
        const rejectionEvent = new Event('unhandledrejection');
        rejectionEvent.reason = new Error('Reject');
        Object.defineProperty(rejectionEvent, 'reason', {
            value: new Error('Reject'),
            writable: false
        });
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        window.dispatchEvent(rejectionEvent);
        expect(mockToast.error).toHaveBeenCalledWith('Error', 'An unexpected error occurred.');
    });
});