import type { Response } from 'express';
import * as symptomService from '../services/symptom.service';
import { getUserId } from '../middleware/auth.middleware';
import { sendCreated, sendSuccess } from '../utils/apiResponse';
import type { AuthenticatedRequest } from '../types';

export async function list(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { from, to } = req.query as { from?: string; to?: string };
  const symptoms = await symptomService.listSymptoms(getUserId(req), { from, to });
  sendSuccess(res, { symptoms }, 'Symptoms loaded');
}

export async function create(req: AuthenticatedRequest, res: Response): Promise<void> {
  const symptoms = await symptomService.createSymptoms(getUserId(req), req.body);
  sendCreated(res, { symptoms }, 'Symptoms logged');
}

export async function update(req: AuthenticatedRequest, res: Response): Promise<void> {
  const symptom = await symptomService.updateSymptom(getUserId(req), req.params.id, req.body);
  sendSuccess(res, { symptom }, 'Symptom updated');
}

export async function remove(req: AuthenticatedRequest, res: Response): Promise<void> {
  await symptomService.deleteSymptom(getUserId(req), req.params.id);
  sendSuccess(res, null, 'Symptom deleted');
}
