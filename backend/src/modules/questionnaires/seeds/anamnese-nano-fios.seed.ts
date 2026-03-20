import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb } from '../../../config/db.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { QuestionnaireTemplate } from '../model.js';
import templateData from '../templates/anamnese-nano-fios.json' with { type: 'json' };

const templateCode = String(templateData.code || 'ANAMNESE-NANO-FIOS');
const templateName = String(templateData.name || 'Ficha de Anamnese para Nano Fios');

function resolveTemplateVersion() {
  const override = process.env.ANAMNESE_NANO_FIOS_TEMPLATE_VERSION?.trim();
  if (!override) {
    return Number(templateData.version || 1);
  }

  const parsed = Number(override);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('ANAMNESE_NANO_FIOS_TEMPLATE_VERSION must be an integer greater than or equal to 1.');
  }

  return parsed;
}

export async function seedAnamneseNanoFiosTemplate() {
  const templateVersion = resolveTemplateVersion();
  await connectDb(env.mongodbUri);

  try {
    const existingTemplate = await QuestionnaireTemplate.findOne({
      code: templateCode,
      version: templateVersion
    }).exec();

    if (existingTemplate) {
      logger.info(
        { id: existingTemplate.id, code: existingTemplate.code, version: existingTemplate.version },
        'Anamnese Nano Fios template already exists.'
      );
      return existingTemplate;
    }

    await QuestionnaireTemplate.updateMany(
      { code: templateCode, status: 'PUBLISHED' },
      { $set: { status: 'ARCHIVED' } }
    ).exec();

    const template = await QuestionnaireTemplate.create({
      code: templateCode,
      name: templateName,
      version: templateVersion,
      status: 'PUBLISHED',
      schema: {
        sections: templateData.sections,
        metadata: {
          description: 'Formulário completo de anamnese para procedimento de Nano Fios com assinatura digital e termo de consentimento.',
          estimatedTime: '15-20 minutos',
          language: 'pt-BR',
          company: 'Beaura',
          removedElements: ['logo', 'marca']
        }
      },
      publishedAt: new Date()
    });

    logger.info(
      { id: template.id, code: template.code, version: template.version },
      'Anamnese Nano Fios template created.'
    );
    return template;
  } catch (error) {
    logger.fatal({ err: error }, 'Anamnese Nano Fios seed failed.');
    throw error;
  } finally {
    await QuestionnaireTemplate.db.close();
  }
}

const isDirectExecution = Boolean(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  seedAnamneseNanoFiosTemplate()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
