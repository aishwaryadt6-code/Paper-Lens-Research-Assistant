import { User, IUser } from '../models/User';
import { Workspace, IWorkspace } from '../models/Workspace';
import { Paper, IPaper } from '../models/Paper';
import { AuditLog, IAuditLog } from '../models/AuditLog';
import { Types } from 'mongoose';
import { AppError } from '../utils/AppError';

export class AdminService {
  // ── Users ──────────────────────────────────────────────────────────────

  async listUsers(page: number, limit: number): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      User.countDocuments(),
    ]);
    return { users, total };
  }

  async getUser(id: string): Promise<IUser> {
    const user = await User.findById(id).exec();
    if (!user) throw AppError.notFound('User not found');
    return user;
  }

  async setUserActive(id: string, isActive: boolean): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true }
    ).exec();
    if (!user) throw AppError.notFound('User not found');
    return user;
  }

  async setUserRole(id: string, role: 'researcher' | 'admin'): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true }
    ).exec();
    if (!user) throw AppError.notFound('User not found');
    return user;
  }

  // ── Workspaces ─────────────────────────────────────────────────────────

  async listWorkspaces(
    page: number,
    limit: number
  ): Promise<{ workspaces: IWorkspace[]; total: number }> {
    const skip = (page - 1) * limit;
    const [workspaces, total] = await Promise.all([
      Workspace.find()
        .populate('owner', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      Workspace.countDocuments(),
    ]);
    return { workspaces, total };
  }

  // ── Papers ─────────────────────────────────────────────────────────────

  async listPapers(page: number, limit: number): Promise<{ papers: IPaper[]; total: number }> {
    const skip = (page - 1) * limit;
    const [papers, total] = await Promise.all([
      Paper.find()
        .populate('uploadedBy', 'name email')
        .populate('workspace', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      Paper.countDocuments(),
    ]);
    return { papers, total };
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────

  async listAuditLogs(
    page: number,
    limit: number
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('actor', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      AuditLog.countDocuments(),
    ]);
    return { logs, total };
  }

  // ── Stats ──────────────────────────────────────────────────────────────

  async getStats(): Promise<{
    totalUsers: number;
    totalWorkspaces: number;
    totalPapers: number;
    activeUsers: number;
  }> {
    const [totalUsers, totalWorkspaces, totalPapers, activeUsers] = await Promise.all([
      User.countDocuments(),
      Workspace.countDocuments({ isActive: true }),
      Paper.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
    ]);
    return { totalUsers, totalWorkspaces, totalPapers, activeUsers };
  }
}

export const adminService = new AdminService();
