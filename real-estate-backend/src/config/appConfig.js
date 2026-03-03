const config = {
  apiBasePath: process.env.API_BASE_PATH || '/api/v1',
  apiVersion: process.env.API_VERSION || 'v1',
  
  backendUrl: process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000',
  
  emailVerificationExpiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN || '24h',
  passwordResetExpiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '1h',
  
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  getApiUrl(path = '') {
    return `${this.backendUrl}${this.apiBasePath}${path}`;
  },
  
  getFrontendUrl(path = '') {
    return `${this.frontendUrl}${path}`;
  },
  
  getVerificationUrl(token) {
    return this.getApiUrl('/auth/verify-email') + `?token=${token}`;
  },
  
  getPasswordResetUrl(token) {
    return this.getFrontendUrl('/reset-password') + `?token=${token}`;
  }
};

module.exports = config;
