import { pool } from '../utils/db.js';

export const getProjects = async (req, res, next) => {
  try {
    let projectsQuery = '';
    let params = [];
    
    if (req.user.role === 'ADMIN') {
      projectsQuery = 'SELECT * FROM projects ORDER BY created_at DESC';
    } else {
      projectsQuery = `
        SELECT p.* FROM projects p
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = $1
        ORDER BY p.created_at DESC
      `;
      params.push(req.user.id);
    }
    
    const projectsResult = await pool.query(projectsQuery, params);
    const projects = projectsResult.rows;
    
    // Fetch members and tasks for each project to match expected structure
    for (let project of projects) {
      // Map ownerId to ownerId (camelCase or snake_case)
      project.ownerId = project.owner_id;
      project.createdAt = project.created_at;
      project.updatedAt = project.updated_at;

      const membersResult = await pool.query(`
        SELECT pm.id, pm.user_id as "userId", pm.project_id as "projectId",
               json_build_object('id', u.id, 'name', u.name, 'email', u.email) as user
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = $1
      `, [project.id]);
      project.members = membersResult.rows;
      
      const tasksResult = await pool.query(
        'SELECT * FROM tasks WHERE project_id = $1',
        [project.id]
      );
      project.tasks = tasksResult.rows;
    }
    
    res.json({ success: true, projects });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    const insertProjectResult = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.id]
    );
    const project = insertProjectResult.rows[0];
    
    project.ownerId = project.owner_id;
    project.createdAt = project.created_at;
    project.updatedAt = project.updated_at;

    // Add owner as a member of the project
    await pool.query(
      'INSERT INTO project_members (user_id, project_id) VALUES ($1, $2)',
      [req.user.id, project.id]
    );
    
    const membersResult = await pool.query(`
      SELECT pm.id, pm.user_id as "userId", pm.project_id as "projectId" 
      FROM project_members pm 
      WHERE pm.project_id = $1
    `, [project.id]);
    project.members = membersResult.rows;
    
    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [parseInt(id)]);
    const existingProject = projectResult.rows[0];
    
    if (!existingProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (req.user.role !== 'ADMIN' && existingProject.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this project' });
    }
    
    const updateResult = await pool.query(
      'UPDATE projects SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, description, parseInt(id)]
    );
    const project = updateResult.rows[0];
    
    project.ownerId = project.owner_id;
    project.createdAt = project.created_at;
    project.updatedAt = project.updated_at;

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM projects WHERE id = $1', [parseInt(id)]);
    
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    await pool.query(
      'INSERT INTO project_members (user_id, project_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [parseInt(userId), parseInt(id)]
    );
    
    const memberResult = await pool.query(`
      SELECT pm.id, pm.user_id as "userId", pm.project_id as "projectId",
             json_build_object('id', u.id, 'name', u.name, 'email', u.email) as user
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1 AND pm.user_id = $2
    `, [parseInt(id), parseInt(userId)]);
    const member = memberResult.rows[0];
    
    res.json({ success: true, member });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    
    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [parseInt(id), parseInt(userId)]
    );
    
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};