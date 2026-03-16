export type Service = {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  requiresQuestionnaire: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServiceInput = {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  requiresQuestionnaire: boolean;
};
