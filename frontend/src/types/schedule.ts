export type WeeklyAvailabilitySlot = {
  weekday: number;
  startTime: string;
  endTime: string;
};

export type WorkSchedule = {
  id: string;
  professionalId: string;
  slots: WeeklyAvailabilitySlot[];
  createdAt: string;
  updatedAt: string;
};
