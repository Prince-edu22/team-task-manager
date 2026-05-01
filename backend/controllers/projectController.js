import { prisma } from '../server.js';

export const getProjects = async (req, res, next) => {
  try {
    let projects;
    
    if (req.user.role === 'ADMIN') {
      projects = await prisma.project.findMany({
        include: {
          tasks: true,
          members: {
            include: { user: { select: { id: true, name: true, email: true } } }
          }
        }
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          members: { some: { userId: req.user.id } }
        },
        include: {
          tasks: true,
          members: {
            include: { user: { select: { id: true, name: true, email: true } } }
          }
        }
      });
    }
    
    res.json({ success: true, projects });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id }
        }
      },
      include: {
        members: true
      }
    });
    
    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { name, description }
    });
    
    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.project.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const member = await prisma.projectMember.create({
      data: {
        projectId: parseInt(id),
        userId: parseInt(userId)
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });
    
    res.json({ success: true, member });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          projectId: parseInt(id),
          userId: parseInt(userId)
        }
      }
    });
    
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};