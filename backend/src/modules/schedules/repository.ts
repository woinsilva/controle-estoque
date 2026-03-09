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
