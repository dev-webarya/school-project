// Resolve environment in both Vite and Jest/Node contexts
const ENV = (() => {
  try {
    // Avoid direct reference to import.meta.env in Jest
    // eslint-disable-next-line no-eval
    return eval('import.meta.env') || {};
  } catch {
    return {};
  }
})();

// Environment configuration
const config = {
  // API Configuration
  // Prefer dev proxy by default in development to avoid direct localhost calls
  // Use Vite's built-in DEV flag, not custom VITE_NODE_ENV
  API_BASE_URL: ENV.VITE_API_BASE_URL || '/api',
  
  // App Configuration
  APP_NAME: ENV.VITE_APP_NAME || 'BBD School Management System',
  APP_VERSION: ENV.VITE_APP_VERSION || '1.0.0',
  NODE_ENV: ENV.VITE_NODE_ENV || (ENV.DEV ? 'development' : 'production'),
  
  // Environment flags
  IS_DEVELOPMENT: ENV.VITE_NODE_ENV === 'development' || ENV.DEV === true,
  IS_PRODUCTION: ENV.VITE_NODE_ENV === 'production' || ENV.PROD === true,
  // E2E testing flag
  IS_E2E: ENV.VITE_E2E_MODE === 'true',
  
  // Security Configuration
  ENABLE_DEVTOOLS: ENV.VITE_ENABLE_DEVTOOLS === 'true',
  ENABLE_CONSOLE_LOGS: ENV.VITE_ENABLE_CONSOLE_LOGS !== 'false',
  
  // Performance Configuration
  ENABLE_ANALYTICS: ENV.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_ERROR_REPORTING: ENV.VITE_ENABLE_ERROR_REPORTING === 'true',
  
  // Feature Flags
  ENABLE_MAINTENANCE_MODE: ENV.VITE_ENABLE_MAINTENANCE_MODE === 'true',
  ENABLE_BETA_FEATURES: ENV.VITE_ENABLE_BETA_FEATURES === 'true',
  
  // CDN and Assets
  CDN_URL: ENV.VITE_CDN_URL || '',
  STATIC_ASSETS_URL: ENV.VITE_STATIC_ASSETS_URL || '',
  
  // Additional Feature Flags
  ENABLE_DEBUG: ENV.VITE_ENABLE_DEBUG === 'true',
  ENABLE_MOCK_DATA: ENV.VITE_ENABLE_MOCK_DATA === 'true',
  RAZORPAY_KEY_ID: ENV.VITE_RAZORPAY_KEY_ID || '',

  // Class configuration (used across dropdowns)
  CLASSES: [
    'NS', 'LKG', 'UKG',
    '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'
  ],
  CLASS_OPTIONS: [
    { value: 'NS', label: 'NS' },
    { value: 'LKG', label: 'LKG' },
    { value: 'UKG', label: 'UKG' },
    { value: '1st', label: '1st' },
    { value: '2nd', label: '2nd' },
    { value: '3rd', label: '3rd' },
    { value: '4th', label: '4th' },
    { value: '5th', label: '5th' },
    { value: '6th', label: '6th' },
    { value: '7th', label: '7th' },
    { value: '8th', label: '8th' },
    { value: '9th', label: '9th' },
    { value: '10th', label: '10th' },
    { value: '11th', label: '11th' },
    { value: '12th', label: '12th' }
  ],
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: '/auth',
    ADMIN: '/admin',
    FACULTY: '/faculty',
    STUDENT: '/student',
    GENERAL: '/general'
  },
  
  // UI Configuration
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
  },
  
  // File Upload Configuration
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  
  // OTP Configuration
  OTP: {
    LENGTH: 6,
    EXPIRY_MINUTES: 5,
    MAX_ATTEMPTS: 3
  }
};

// Validation function to ensure required environment variables are set
export const validateConfig = () => {
  const requiredVars = ['VITE_API_BASE_URL'];
  const missingVars = requiredVars.filter(varName => !ENV[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Missing environment variables:', missingVars);
    if (config.IS_PRODUCTION) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
};

// Initialize configuration validation
if (config.IS_PRODUCTION) {
  validateConfig();
}

export default config;
