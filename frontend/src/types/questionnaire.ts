export type QuestionnaireTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type QuestionnaireTemplate = {
  _id: string;
  code: string;
  name: string;
  version: number;
  status: QuestionnaireTemplateStatus;
  hasResponses?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  schema: Record<string, unknown>;
  createdBy?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type QuestionnaireResponse = {
  _id: string;
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
    signedAt: string;
    signedBy: string;
  };
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};
