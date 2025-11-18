import { useState, useCallback } from 'react';

/**
 * Custom hook for managing loading states
 * @param {boolean} initialState - Initial loading state (default: false)
 * @returns {object} - Object containing loading state and control functions
 */
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  const [loadingMessage, setLoadingMessage] = useState('');

  const startLoading = useCallback((message = 'Loading...') => {
    setLoading(true);
    setLoadingMessage(message);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
    setLoadingMessage('');
  }, []);

  const toggleLoading = useCallback((message = 'Loading...') => {
    setLoading(prev => {
      if (!prev) {
        setLoadingMessage(message);
      } else {
        setLoadingMessage('');
      }
      return !prev;
    });
  }, []);

  /**
   * Wrapper function to handle async operations with loading state
   * @param {Function} asyncFunction - The async function to execute
   * @param {string} message - Loading message to display
   * @returns {Promise} - Promise that resolves with the result of asyncFunction
   */
  const withLoading = useCallback(async (asyncFunction, message = 'Loading...') => {
    startLoading(message);
    try {
      return await asyncFunction();
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    loading,
    setLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    toggleLoading,
    withLoading
  };
};

/**
 * Custom hook for managing multiple loading states
 * @returns {object} - Object containing loading state management functions
 */
export const useMultipleLoading = () => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = useCallback((key, isLoading, message = 'Loading...') => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading ? { loading: true, message } : { loading: false, message: '' }
    }));
  }, []);

  const isLoading = useCallback((key) => {
    return loadingStates[key]?.loading || false;
  }, [loadingStates]);

  const getLoadingMessage = useCallback((key) => {
    return loadingStates[key]?.message || '';
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state.loading);
  }, [loadingStates]);

  const clearLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    getLoadingMessage,
    isAnyLoading,
    clearLoading,
    clearAllLoading,
    loadingStates
  };
};

export default useLoading;