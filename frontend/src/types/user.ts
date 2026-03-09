export type UserRole = 'OPERATOR' | 'MANAGER' | 'ADMIN' | 'CLIENT';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  clientId?: string;
  isProfessional?: boolean;
  emailConfirmed?: boolean;
  passwordResetRequired?: boolean;
  locale?: string;
  theme?: 'light' | 'dark';
};

export type UserInput = {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
  clientId?: string;
  isProfessional?: boolean;
  emailConfirmed?: boolean;
  passwordResetRequired?: boolean;
  locale?: string;
  theme?: 'light' | 'dark';
};
