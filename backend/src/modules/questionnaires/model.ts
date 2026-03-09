import mongoose, { Schema } from 'mongoose';

export type QuestionnaireTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type QuestionnaireTemplateDocument = {
  code: string;
  name: string;
  version: number;
  status: QuestionnaireTemplateStatus;
  schema: Record<string, unknown>;
  createdBy?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type QuestionnaireResponseDocument = {
  clientId: string;
  appointmentId: string;
  templateId: string;
  templateCode: string;
  templateVersion: number;
  templateSnapshot: Record<string, unknown>;
  answers: Record<string, unknown>;
  signature?: {
    mode: 'DRAW' | 'TYPE' | 'UPLOAD';
    value: string;
    signedAt: Date;
    signedBy: string;
  };
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

const questionnaireTemplateSchema = new Schema<QuestionnaireTemplateDocument>(
  {
    code: { type: String, required: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    version: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT'
    },
    schema: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: String },
    publishedAt: { type: Date }
  },
  { timestamps: true }
);

questionnaireTemplateSchema.index({ code: 1, version: 1 }, { unique: true });

const questionnaireResponseSchema = new Schema<QuestionnaireResponseDocument>(
  {
    clientId: { type: String, required: true, index: true },
    appointmentId: { type: String, required: true, index: true },
    templateId: { type: String, required: true },
    templateCode: { type: String, required: true, uppercase: true, trim: true },
    templateVersion: { type: Number, required: true, min: 1 },
    templateSnapshot: { type: Schema.Types.Mixed, required: true },
    answers: { type: Schema.Types.Mixed, required: true },
    signature: {
      mode: { type: String, enum: ['DRAW', 'TYPE', 'UPLOAD'] },
      value: { type: String },
      signedAt: { type: Date },
      signedBy: { type: String }
    },
    createdBy: { type: String }
  },
  { timestamps: true }
);

questionnaireResponseSchema.index(
  { appointmentId: 1, templateCode: 1, templateVersion: 1 },
  { unique: true }
);

export const QuestionnaireTemplate = mongoose.model<QuestionnaireTemplateDocument>(
  'QuestionnaireTemplate',
  questionnaireTemplateSchema
);

export const QuestionnaireResponse = mongoose.model<QuestionnaireResponseDocument>(
  'QuestionnaireResponse',
  questionnaireResponseSchema
);
