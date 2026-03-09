export type Client = {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  birthDate?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClientInput = {
  fullName: string;
  email?: string;
  phone: string;
  birthDate?: string;
  notes?: string;
  active: boolean;
};

export type ClientListResponse = {
  items: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
