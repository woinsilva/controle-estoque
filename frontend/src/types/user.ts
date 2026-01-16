export type UserRole = 'OPERATOR' | 'MANAGER' | 'ADMIN';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};
