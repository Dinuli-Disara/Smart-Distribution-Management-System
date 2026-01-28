// src/config/deepLinking.ts
export const DEEP_LINKING_CONFIG = {
  scheme: 'manjuladms',
  host: 'reset',
  prefixes: [
    'manjuladms://',
    'https://manjula-dms.com', // Your actual domain
    'exp://' // For Expo development
  ],
  config: {
    screens: {
      ResetPassword: {
        path: 'reset-password/:token',
        parse: {
          token: (token: string) => token,
        },
      },
      Login: 'login',
      ForgotPassword: 'forgot-password',
      SalesDashboard: 'dashboard/sales',
      ClerkDashboard: 'dashboard/clerk',
      OwnerDashboard: 'dashboard/owner',
    },
  },
};