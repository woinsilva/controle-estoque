import mongoose, { Schema } from 'mongoose';

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

export type WorkScheduleDocument = {
  professionalId: string;
  slots: WeeklyAvailabilitySlot[];
  dateOverrides: DateAvailabilityOverride[];
  createdAt: Date;
  updatedAt: Date;
};

const slotSchema = new Schema<WeeklyAvailabilitySlot>(
  {
    weekday: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  { _id: false }
);

const dailySlotSchema = new Schema<DailyAvailabilitySlot>(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  { _id: false }
);

const overrideSchema = new Schema<DateAvailabilityOverride>(
  {
    date: { type: String, required: true },
    slots: { type: [dailySlotSchema], default: [] }
  },
  { _id: false }
);

const workScheduleSchema = new Schema<WorkScheduleDocument>(
  {
    professionalId: { type: String, required: true, unique: true, index: true },
    slots: { type: [slotSchema], default: [] },
    dateOverrides: { type: [overrideSchema], default: [] }
  },
  { timestamps: true }
);

export const WorkSchedule = mongoose.model<WorkScheduleDocument>('WorkSchedule', workScheduleSchema);
