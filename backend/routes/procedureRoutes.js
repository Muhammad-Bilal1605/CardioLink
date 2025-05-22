import express from 'express';
import {
  createProcedure,
  getPatientProcedures,
  getProcedure,
  updateProcedure,
  deleteProcedure
} from '../controllers/procedureController.js';

const router = express.Router();

// Procedure routes
router.post('/', createProcedure);
router.get('/patient/:patientId', getPatientProcedures);
router.get('/:id', getProcedure);
router.put('/:id', updateProcedure);
router.delete('/:id', deleteProcedure);

export default router; 