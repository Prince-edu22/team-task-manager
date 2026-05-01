import { prisma } from '../server.js';

export const getStats = async (req, res, next) => {
  try {
    let tasksWhere = {};
    
    if (req.user.role !== 'ADMIN') {
      tasksWhere.assignedUserId = req.user.id;
    }
    
    const allTasks = await prisma.task.findMany({
      where: tasksWhere
    });
    
    const now = new Date();
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'COMPLETED').length;
    const pending = allTasks.filter(t => t.status !== 'COMPLETED').length;
    const overdue = allTasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < now).length;
    
    // Tasks by status
    const todo = allTasks.filter(t => t.status === 'TODO').length;
    const inProgress = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
    
    // Recent tasks
    const recentTasks = await prisma.task.findMany({
      where: tasksWhere,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { name: true } },
        assignedUser: { select: { name: true } }
      }
    });
    
    res.json({
      success: true,
      stats: { total, completed, pending, overdue, todo, inProgress },
      recentTasks
    });
  } catch (error) {
    next(error);
  }
};