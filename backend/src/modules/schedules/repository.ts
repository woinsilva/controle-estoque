import { WorkSchedule } from './model.js';

export async function listSchedules() {
  return WorkSchedule.find().sort({ professionalId: 1 }).exec();
}

export async function getScheduleByProfessionalId(professionalId: string) {
  return WorkSchedule.findOne({ professionalId }).exec();
}

export async function upsertSchedule(data: { professionalId: string; slots: { weekday: number; startTime: string; endTime: string }[] }) {
  return WorkSchedule.findOneAndUpdate(
    { professionalId: data.professionalId },
    { $set: { slots: data.slots } },
    { new: true, upsert: true }
  ).exec();
}

export async function upsertDateOverride(data: {
  professionalId: string;
  date: string;
  slots: { startTime: string; endTime: string }[];
}) {
  const schedule =
    (await WorkSchedule.findOne({ professionalId: data.professionalId }).exec()) ||
    (await WorkSchedule.create({ professionalId: data.professionalId, slots: [], dateOverrides: [] }));

  const overrides = [...(schedule.dateOverrides || [])];
  const overrideIndex = overrides.findIndex((item) => item.date === data.date);
  const nextOverride = { date: data.date, slots: data.slots };

  if (overrideIndex >= 0) {
    overrides[overrideIndex] = nextOverride;
  } else {
    overrides.push(nextOverride);
  }

  schedule.dateOverrides = overrides.sort((a, b) => a.date.localeCompare(b.date));
  await schedule.save();
  return schedule;
}
