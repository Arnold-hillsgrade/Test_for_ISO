import jwt from 'jsonwebtoken';
import { warn } from '../utils/logger.js';

export const authenticateToken = (req, res, next) => {
  const token = req.session.token;
  const workspaceId = req.body.workspaceId || req.params.workspaceId || req.query.workspaceId || undefined;
  const boardId = req.body.boardId || req.params.boardId || req.query.boardId || undefined;

  if (!token) {
    warn('Authentication-Service', 'No token provided', {
      error: 'No token provided',
    }, req);
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (user.role === 'support_admin' || user.role === 'owner') {
      req.session.Authorization = `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}`;
    } else if(user.role === 'isoplus_user') {
      if (workspaceId) {
        const workspaceObj = user.workspace && Array.isArray(user.workspace)
          ? user.workspace.find(w => (w.id || w) == workspaceId)
          : undefined;
        if (!workspaceObj || (workspaceObj.user_role !== 'owner' && workspaceObj.user_role !== 'admin')) {
          warn('Authentication-Service', 'This User does not have permission to access Workspace.', {
            error: 'This User does not have permission to access Workspace.',
            userId: user.userId,
            role: user.role,
            workspaceId,
          }, req);
          return res.status(403).json({ message: 'This User does not have permission to access Workspace.', error_type: 'workspace' });
        }
        if (boardId) {
          const boards = (typeof workspaceObj === 'object' && workspaceObj.board) ? workspaceObj.board : [];
          if (!boards.find(b => (b.id || b) == boardId)) {
            warn('Authentication-Service', 'This User does not have permission to access Board.', {
              error: 'This User does not have permission to access Board.',
              userId: user.userId,
              role: user.role,
              workspaceId,
              boardId,
            }, req);
            return res.status(403).json({ message: 'This User does not have permission to access Board.', error_type: 'board' });
          }
        }
      }
    }

    req.user = user;
    req.headers['X-API-Version'] = '2025-02-26.morava';
    next();
  } catch (err) {
    warn('Authentication-Service', 'Invalid or expired token', {
      error: 'Invalid or expired token',
    }, req);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};