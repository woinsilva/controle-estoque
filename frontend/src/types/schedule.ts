export type WeeklyAvailabilitySlot = {
  weekday: number;
  startTime: string;
  endTime: string;
};

export type DailyAvailabilitySlot = {
  startTime: string;
  endTime: string;
};

export type DateAvailabilityOverride = {
  date: string;
  slots: DailyAvailabilitySlot[];
};

export type WorkSchedule = {
  id: string;
  professionalId: string;
  slots: WeeklyAvailabilitySlot[];
  dateOverrides?: DateAvailabilityOverride[];
  createdAt: string;
  updatedAt: string;
};

export type ScheduleCalendarView = 'day' | 'week' | 'month';

export type ScheduleCalendarResponse = {
  professional: {
    id: string;
    name: string;
  };
  weeklySlots: WeeklyAvailabilitySlot[];
  overrides: DateAvailabilityOverride[];
  selectedDateOverride: DateAvailabilityOverride | null;
  appointments: {
    id: string;
    clientId: string;
    professionalId: string;
    serviceIds: string[];
    scheduledAt: string;
    endsAt: string;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
    notes?: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
  }[];
  rangeStart: string;
  rangeEnd: string;
  selectedDate: string;
  view: ScheduleCalendarView;
};
