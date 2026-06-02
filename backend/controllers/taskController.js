import { pool } from '../utils/db.js';

export const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, assignedTo } = req.query;
    
    let queryText = `
      SELECT t.*, 
             CASE 
               WHEN u.id IS NOT NULL THEN json_build_object('id', u.id, 'name', u.name, 'email', u.email)
               ELSE NULL
             END as "assignedUser",
             json_build_object('id', p.id, 'name', p.name) as project
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      JOIN projects p ON t.project_id = p.id
    `;
    
    let whereClauses = [];
    let params = [];
    
    if (projectId) {
      whereClauses.push(`t.project_id = $${params.length + 1}`);
      params.push(parseInt(projectId));
    }
    if (status) {
      whereClauses.push(`t.status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (req.user.role !== 'ADMIN') {
      if (assignedTo === 'me' || !assignedTo) {
        whereClauses.push(`t.assigned_user_id = $${params.length + 1}`);
        params.push(req.user.id);
      }
    } else if (assignedTo === 'me') {
      whereClauses.push(`t.assigned_user_id = $${params.length + 1}`);
      params.push(req.user.id);
    } else if (assignedTo && assignedTo !== 'all') {
      whereClauses.push(`t.assigned_user_id = $${params.length + 1}`);
      params.push(parseInt(assignedTo));
    }
    
    if (whereClauses.length > 0) {
      queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    queryText += ' ORDER BY t.due_date ASC NULLS LAST';
    
    const tasksResult = await pool.query(queryText, params);
    const tasks = tasksResult.rows;
    
    for (let task of tasks) {
      task.assignedUserId = task.assigned_user_id;
      task.projectId = task.project_id;
      task.dueDate = task.due_date;
      task.createdAt = task.created_at;
      task.updatedAt = task.updated_at;
    }
    
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedUserId, status, dueDate, projectId } = req.body;
    
    // Check if user is member of project
    const isMemberResult = await pool.query(
      'SELECT 1 FROM project_members WHERE user_id = $1 AND project_id = $2',
      [req.user.id, parseInt(projectId)]
    );
    const isMember = isMemberResult.rows.length > 0;
    
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not a member of this project' });
    }
    
    const insertResult = await pool.query(
      `INSERT INTO tasks (title, description, assigned_user_id, status, due_date, project_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        title, 
        description, 
        assignedUserId ? parseInt(assignedUserId) : null, 
        status || 'TODO', 
        dueDate ? new Date(dueDate) : null, 
        parseInt(projectId)
      ]
    );
    const insertedTask = insertResult.rows[0];
    
    // Fetch full task with relations to return
    const taskResult = await pool.query(
      `SELECT t.*, 
              CASE WHEN u.id IS NOT NULL THEN json_build_object('id', u.id, 'name', u.name) ELSE NULL END as "assignedUser",
              json_build_object('id', p.id, 'name', p.name) as project
       FROM tasks t
       LEFT JOIN users u ON t.assigned_user_id = u.id
       JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1`,
      [insertedTask.id]
    );
    const task = taskResult.rows[0];
    
    task.assignedUserId = task.assigned_user_id;
    task.projectId = task.project_id;
    task.dueDate = task.due_date;
    task.createdAt = task.created_at;
    task.updatedAt = task.updated_at;

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, assignedUserId, status, dueDate } = req.body;
    
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [parseInt(id)]);
    const existingTask = taskResult.rows[0];
    
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const isAdmin = req.user.role === 'ADMIN';
    const isAssignedUser = existingTask.assigned_user_id === req.user.id;
    
    if (!isAdmin && !isAssignedUser) {
      return res.status(403).json({ message: 'You can only update your own tasks' });
    }
    
    // Build update query dynamically
    let updateFields = [];
    let queryParams = [];
    
    if (title !== undefined) {
      updateFields.push(`title = $${queryParams.length + 1}`);
      queryParams.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${queryParams.length + 1}`);
      queryParams.push(description);
    }
    if (assignedUserId !== undefined) {
      updateFields.push(`assigned_user_id = $${queryParams.length + 1}`);
      queryParams.push(assignedUserId ? parseInt(assignedUserId) : null);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }
    if (dueDate !== undefined) {
      updateFields.push(`due_date = $${queryParams.length + 1}`);
      queryParams.push(dueDate ? new Date(dueDate) : null);
    }
    
    updateFields.push(`updated_at = NOW()`);
    
    queryParams.push(parseInt(id));
    const updateQuery = `
      UPDATE tasks 
      SET ${updateFields.join(', ')} 
      WHERE id = $${queryParams.length} 
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, queryParams);
    const updatedTask = updateResult.rows[0];
    
    // Fetch with relationships to return
    const completeTaskResult = await pool.query(
      `SELECT t.*, 
              CASE WHEN u.id IS NOT NULL THEN json_build_object('id', u.id, 'name', u.name) ELSE NULL END as "assignedUser",
              json_build_object('id', p.id, 'name', p.name) as project
       FROM tasks t
       LEFT JOIN users u ON t.assigned_user_id = u.id
       JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1`,
      [updatedTask.id]
    );
    const task = completeTaskResult.rows[0];
    
    task.assignedUserId = task.assigned_user_id;
    task.projectId = task.project_id;
    task.dueDate = task.due_date;
    task.createdAt = task.created_at;
    task.updatedAt = task.updated_at;

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [parseInt(id)]);
    const existingTask = taskResult.rows[0];
    
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const isAdmin = req.user.role === 'ADMIN';
    const isAssignedUser = existingTask.assigned_user_id === req.user.id;
    
    if (!isAdmin && !isAssignedUser) {
      return res.status(403).json({ message: 'You can only delete your own tasks' });
    }
    
    await pool.query('DELETE FROM tasks WHERE id = $1', [parseInt(id)]);
    
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};