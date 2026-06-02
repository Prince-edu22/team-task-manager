import { pool } from '../utils/db.js';

export const getStats = async (req, res, next) => {
  try {
    let query = 'SELECT * FROM tasks';
    const params = [];

    if (req.user.role !== 'ADMIN') {
      query += ' WHERE assigned_user_id = $1';
      params.push(req.user.id);
    }

    const tasksResult = await pool.query(query, params);
    const allTasks = tasksResult.rows;

    const now = new Date();

    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'COMPLETED').length;
    const pending = allTasks.filter(t => t.status !== 'COMPLETED').length;
    const overdue = allTasks.filter(
      t => t.status !== 'COMPLETED' &&
      t.due_date &&
      new Date(t.due_date) < now
    ).length;

    const todo = allTasks.filter(t => t.status === 'TODO').length;
    const inProgress = allTasks.filter(t => t.status === 'IN_PROGRESS').length;

    let recentQuery = `
      SELECT
        t.*,
        p.name AS project_name,
        u.name AS assigned_user_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_user_id = u.id
    `;

    if (req.user.role !== 'ADMIN') {
      recentQuery += ' WHERE t.assigned_user_id = $1';
    }

    recentQuery += ' ORDER BY t.created_at DESC LIMIT 5';

    const recentTasksResult = await pool.query(recentQuery, params);

    res.json({
      success: true,
      stats: {
        total,
        completed,
        pending,
        overdue,
        todo,
        inProgress
      },
      recentTasks: recentTasksResult.rows
    });
  } catch (error) {
    next(error);
  }
};