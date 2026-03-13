export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  CustomerDashboard: undefined;
  SalesDashboard: undefined;
  MainDashboard: undefined;
  // Add other screens as needed
};

// Declare global type for React Navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}