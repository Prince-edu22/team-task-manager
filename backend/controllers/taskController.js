import { prisma } from '../server.js';

export const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, assignedTo } = req.query;
    const where = {};
    
    if (projectId) where.projectId = parseInt(projectId);
    if (status) where.status = status;
    
    if (req.user.role !== 'ADMIN') {
      if (assignedTo === 'me' || !assignedTo) {
        where.assignedUserId = req.user.id;
      }
    } else if (assignedTo === 'me') {
      where.assignedUserId = req.user.id;
    } else if (assignedTo && assignedTo !== 'all') {
      where.assignedUserId = parseInt(assignedTo);
    }
    
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
    
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedUserId, status, dueDate, projectId } = req.body;
    
    // Check if user is member of project
    const isMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: parseInt(projectId)
        }
      }
    });
    
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not a member of this project' });
    }
    
    const task = await prisma.task.create({
      data: {
        title,
        description,
        assignedUserId: assignedUserId ? parseInt(assignedUserId) : null,
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: parseInt(projectId)
      },
      include: {
        assignedUser: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } }
      }
    });
    
    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, assignedUserId, status, dueDate } = req.body;
    
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        assignedUserId: assignedUserId ? parseInt(assignedUserId) : null,
        status,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        assignedUser: { select: { id: true, name: true } }
      }
    });
    
    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.task.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};