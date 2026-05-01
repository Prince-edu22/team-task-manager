import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember
} from '../controllers/projectController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .put(updateProject)
  .delete(adminOnly, deleteProject);

router.post('/:id/members', adminOnly, addMember);
router.delete('/:id/members/:userId', adminOnly, removeMember);

export default router;