// frontend-web/src/types/dashboard.ts
export type UserRole = 'Owner' | 'Clerk' | 'Sales Representative';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
}

export interface ViewConfig {
  [key: string]: React.ComponentType;
}