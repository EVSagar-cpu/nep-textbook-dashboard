// ============================================================================
// COMPREHENSIVE ERROR HANDLING SYSTEM
// Add this to your App.jsx to improve error messages
// ============================================================================

// ===== ERROR TYPE DETECTION =====
const detectErrorType = (error) => {
  const errorMsg = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || '';
  
  // API Balance/Quota Errors
  if (errorMsg.includes('rate_limit') || errorMsg.includes('quota')) {
    return {
      type: 'API_QUOTA',
      title: '⚠️ API Quota Exceeded',
      message: 'Your Claude API quota has been exceeded. Please check your Anthropic account billing.',
      action: 'Check your Anthropic dashboard for usage and billing status',
      contactLink: 'https://console.anthropic.com/account/billing'
    };
  }
  
  // API Authentication Errors
  if (errorMsg.includes('invalid_api_key') || errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
    return {
      type: 'API_AUTH',
      title: '🔐 API Key Error',
      message: 'Claude API key is invalid or expired. Please verify your API key in Supabase secrets.',
      action: 'Check Supabase → Project Settings → API → Secrets',
      contactLink: 'https://console.anthropic.com/account/api-keys'
    };
  }
  
  // API Timeout Errors
  if (errorMsg.includes('timeout') || errorMsg.includes('504') || errorMsg.includes('503')) {
    return {
      type: 'API_TIMEOUT',
      title: '⏱️ API Timeout',
      message: 'Claude API is taking too long to respond. This might be temporary.',
      action: 'Try again in a few seconds',
      retry: true
    };
  }
  
  // API Server Errors
  if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503') || errorMsg.includes('server error')) {
    return {
      type: 'API_SERVER',
      title: '🔴 Claude API Server Error',
      message: 'Claude API is experiencing issues. Please try again later.',
      action: 'Check Anthropic status page for updates',
      contactLink: 'https://status.anthropic.com'
    };
  }
  
  // Database RLS/Permission Errors
  if (errorMsg.includes('row-level security') || errorMsg.includes('permission')) {
    return {
      type: 'DATABASE_PERMISSION',
      title: '🔒 Database Permission Error',
      message: 'You do not have permission to perform this action. Check RLS policies.',
      action: 'Contact admin to check Supabase RLS settings'
    };
  }
  
  // Database Connection Errors
  if (errorMsg.includes('connection') || errorMsg.includes('network') || errorMsg.includes('offline')) {
    return {
      type: 'DATABASE_CONNECTION',
      title: '🌐 Connection Error',
      message: 'Unable to connect to database. Check your internet connection.',
      action: 'Check internet connection and try again',
      retry: true
    };
  }
  
  // Database Constraint Errors (enum, unique, etc)
  if (errorMsg.includes('enum') || errorMsg.includes('unique') || errorMsg.includes('constraint')) {
    return {
      type: 'DATABASE_CONSTRAINT',
      title: '❌ Invalid Data',
      message: 'One or more fields have invalid values. ' + errorMsg,
      action: 'Check that all fields are filled correctly'
    };
  }
  
  // Column Missing Error
  if (errorMsg.includes('column') && errorMsg.includes('does not exist')) {
    return {
      type: 'DATABASE_SCHEMA',
      title: '📋 Database Schema Error',
      message: 'A required database column is missing. The database schema may not be fully set up.',
      action: 'Contact admin to check database migrations'
    };
  }
  
  // Default Error
  return {
    type: 'UNKNOWN',
    title: '❌ Error',
    message: 'An unexpected error occurred: ' + (error?.message || 'Unknown error'),
    action: 'Check browser console for details (F12)'
  };
};

// ===== ERROR DISPLAY FUNCTION =====
const showDetailedError = (error) => {
  const errorInfo = detectErrorType(error);
  
  // Log to console for debugging
  console.error('🔴 ERROR DETAILS:', {
    type: errorInfo.type,
    message: error?.message,
    code: error?.code,
    fullError: error
  });
  
  // Build user-friendly message
  let userMessage = errorInfo.title + '\n\n' + errorInfo.message;
  
  if (errorInfo.action) {
    userMessage += '\n\nAction: ' + errorInfo.action;
  }
  
  if (errorInfo.retry) {
    userMessage += '\n\n(You can try again)';
  }
  
  // Show to user
  alert(userMessage);
  
  // Return error info for further handling
  return errorInfo;
};

// ============================================================================
// USAGE IN handleSaveRecord
// ============================================================================

// Replace the current error handling in handleSaveRecord with:

if (result.error) {
  console.error('❌ Save error:', result.error);
  const errorInfo = showDetailedError(result.error);
  
  // Could also log to external service here:
  // logErrorToExternalService({
  //   type: errorInfo.type,
  //   timestamp: new Date(),
  //   userId: user.id,
  //   action: editingId ? 'UPDATE' : 'INSERT'
  // });
  
  setFormLoading(false);
  return;
}

// ============================================================================
// ENHANCED ERROR LOGGING
// ============================================================================

const logError = (context, error, additionalData = {}) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context: context,
    error: {
      message: error?.message,
      code: error?.code,
      type: error?.type
    },
    additional: additionalData,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Log to browser console
  console.error('📋 ERROR LOG:', errorInfo);
  
  // Could send to external error tracking service:
  // fetch('/api/log-error', { method: 'POST', body: JSON.stringify(errorInfo) });
};

// Usage:
// logError('handleSaveRecord', error, { recordId: editingId, action: 'INSERT' });

// ============================================================================
// API HEALTH CHECK
// ============================================================================

const checkAPIHealth = async () => {
  try {
    // Quick test to see if Claude API is responding
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
      }
    });
    
    if (!response.ok) {
      console.warn('⚠️ Claude API health check failed:', response.status);
      return {
        healthy: false,
        status: response.status,
        message: 'Claude API may be experiencing issues'
      };
    }
    
    console.log('✅ Claude API is healthy');
    return { healthy: true };
  } catch (error) {
    console.error('⚠️ Could not check API health:', error);
    return {
      healthy: false,
      error: error.message
    };
  }
};

// Run on app load:
// useEffect(() => {
//   checkAPIHealth();
// }, []);

// ============================================================================
// ERROR MESSAGES BY CATEGORY
// ============================================================================

const ErrorMessages = {
  API: {
    QUOTA_EXCEEDED: {
      title: '⚠️ API Quota Exceeded',
      message: 'Your Claude API quota has been used up. Please check your Anthropic billing account.',
      severity: 'CRITICAL',
      action: 'Check Anthropic console → Billing'
    },
    INVALID_KEY: {
      title: '🔐 API Key Error',
      message: 'Claude API key is invalid or missing.',
      severity: 'CRITICAL',
      action: 'Check Supabase secrets'
    },
    SERVER_ERROR: {
      title: '🔴 Claude API Server Error',
      message: 'Claude API is experiencing server issues.',
      severity: 'HIGH',
      action: 'Wait and retry, or check Anthropic status'
    },
    TIMEOUT: {
      title: '⏱️ Request Timeout',
      message: 'API request took too long. This might be temporary.',
      severity: 'MEDIUM',
      action: 'Retry the request',
      canRetry: true
    }
  },
  
  DATABASE: {
    PERMISSION: {
      title: '🔒 Permission Denied',
      message: 'You do not have permission to perform this action.',
      severity: 'CRITICAL',
      action: 'Contact admin'
    },
    CONNECTION: {
      title: '🌐 Connection Error',
      message: 'Cannot connect to database. Check your internet.',
      severity: 'HIGH',
      action: 'Check internet and retry',
      canRetry: true
    },
    INVALID_DATA: {
      title: '❌ Invalid Data',
      message: 'One or more fields have invalid values.',
      severity: 'MEDIUM',
      action: 'Check form fields'
    }
  }
};

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export {
  detectErrorType,
  showDetailedError,
  logError,
  checkAPIHealth,
  ErrorMessages
};  
