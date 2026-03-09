export type AppointmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

export type Appointment = {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  scheduledAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentInput = {
  clientId: string;
  professionalId: string;
  serviceId: string;
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

export type AppointmentAvailabilityResponse = {
  month: string;
  days: {
    date: string;
    slots: string[];
  }[];
};
