import { workspaceRepository } from '../repositories/WorkspaceRepository';
import { userRepository } from '../repositories/UserRepository';
import { notificationRepository } from '../repositories/NotificationRepository';
import { AppError } from '../utils/AppError';
import {
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
  InviteMemberDTO,
  WorkspaceRole,
} from '../types';
import { IWorkspace } from '../models/Workspace';

export class WorkspaceService {
  async createWorkspace(userId: string, dto: CreateWorkspaceDTO): Promise<IWorkspace> {
    return workspaceRepository.create(userId, dto);
  }

  async getUserWorkspaces(userId: string): Promise<IWorkspace[]> {
    return workspaceRepository.findByUser(userId);
  }

  async getWorkspace(workspaceId: string, userId: string): Promise<IWorkspace> {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace || !workspace.isActive) {
      throw AppError.notFound('Workspace not found');
    }
    const isMember = await workspaceRepository.isMember(workspaceId, userId);
    if (!isMember) {
      throw AppError.forbidden('You do not have access to this workspace');
    }
    return workspace;
  }

  async updateWorkspace(
    workspaceId: string,
    userId: string,
    dto: UpdateWorkspaceDTO
  ): Promise<IWorkspace> {
    await this.requireRole(workspaceId, userId, ['owner', 'editor']);
    const updated = await workspaceRepository.update(workspaceId, dto);
    if (!updated) throw AppError.notFound('Workspace not found');
    return updated;
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    await this.requireRole(workspaceId, userId, ['owner']);
    await workspaceRepository.softDelete(workspaceId);
  }

  async inviteMember(
    workspaceId: string,
    inviterId: string,
    dto: InviteMemberDTO
  ): Promise<IWorkspace> {
    await this.requireRole(workspaceId, inviterId, ['owner', 'editor']);

    const invitee = await userRepository.findByEmail(dto.email);
    if (!invitee) throw AppError.notFound('No user found with that email address');

    const alreadyMember = await workspaceRepository.isMember(
      workspaceId,
      invitee._id.toString()
    );
    if (alreadyMember) throw AppError.conflict('User is already a member of this workspace');

    const workspace = await workspaceRepository.addMember(
      workspaceId,
      invitee._id.toString(),
      dto.role
    );
    if (!workspace) throw AppError.notFound('Workspace not found');

    await notificationRepository.create({
      recipient: invitee._id.toString(),
      type: 'workspace_invite',
      title: 'Workspace Invitation',
      message: `You have been invited to join "${workspace.name}"`,
      metadata: { workspaceId, role: dto.role },
    });

    return workspace;
  }

  async removeMember(
    workspaceId: string,
    requesterId: string,
    targetUserId: string
  ): Promise<IWorkspace> {
    await this.requireRole(workspaceId, requesterId, ['owner']);

    if (requesterId === targetUserId) {
      throw AppError.badRequest('Workspace owner cannot remove themselves');
    }

    const workspace = await workspaceRepository.removeMember(workspaceId, targetUserId);
    if (!workspace) throw AppError.notFound('Workspace not found');
    return workspace;
  }

  async searchWorkspaces(query: string, userId: string): Promise<IWorkspace[]> {
    if (!query.trim()) return [];
    return workspaceRepository.search(query, userId);
  }

  private async requireRole(
    workspaceId: string,
    userId: string,
    allowedRoles: WorkspaceRole[]
  ): Promise<void> {
    const role = await workspaceRepository.getMemberRole(workspaceId, userId);
    if (!role || !allowedRoles.includes(role)) {
      throw AppError.forbidden('Insufficient workspace permissions');
    }
  }
}

export const workspaceService = new WorkspaceService();
