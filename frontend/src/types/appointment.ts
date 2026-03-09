export type AppointmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

export type Appointment = {
  id: string;
  clientId: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentInput = {
  clientId: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes?: string;
};

export type AppointmentListResponse = {
  items: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
