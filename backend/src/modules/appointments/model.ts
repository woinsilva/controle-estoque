import mongoose, { Schema } from 'mongoose';

export type AppointmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

export type AppointmentDocument = {
  clientId: string;
  professionalId: string;
  serviceIds: string[];
  scheduledAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

const appointmentSchema = new Schema<AppointmentDocument>(
  {
    clientId: { type: String, required: true, index: true },
    professionalId: { type: String, required: true, index: true },
    serviceIds: { type: [String], required: true, index: true },
    scheduledAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'],
      default: 'SCHEDULED',
      index: true
    },
    notes: { type: String, trim: true },
    createdBy: { type: String }
  },
  { timestamps: true }
);

appointmentSchema.index({ clientId: 1, scheduledAt: -1 });
appointmentSchema.index({ professionalId: 1, scheduledAt: 1, endsAt: 1 });

export const Appointment = mongoose.model<AppointmentDocument>('Appointment', appointmentSchema);
