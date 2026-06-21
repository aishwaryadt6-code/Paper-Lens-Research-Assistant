import { Types } from 'mongoose';
import { Workspace, IWorkspace } from '../models/Workspace';
import { CreateWorkspaceDTO, UpdateWorkspaceDTO, WorkspaceRole } from '../types';

export class WorkspaceRepository {
  async findById(id: string): Promise<IWorkspace | null> {
    return Workspace.findById(id)
      .populate('owner', 'name email avatarUrl')
      .populate('members.userId', 'name email avatarUrl')
      .exec();
  }

  async findByIdRaw(id: string): Promise<IWorkspace | null> {
    return Workspace.findById(id).exec();
  }

  async findByUser(userId: string): Promise<IWorkspace[]> {
    return Workspace.find({
      $or: [
        { owner: new Types.ObjectId(userId) },
        { 'members.userId': new Types.ObjectId(userId) },
      ],
      isActive: true,
    })
      .populate('owner', 'name email avatarUrl')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async create(ownerId: string, data: CreateWorkspaceDTO): Promise<IWorkspace> {
    return Workspace.create({
      ...data,
      owner: new Types.ObjectId(ownerId),
      members: [
        {
          userId: new Types.ObjectId(ownerId),
          role: 'owner' as WorkspaceRole,
          joinedAt: new Date(),
        },
      ],
      'statistics.memberCount': 1,
    });
  }

  async update(id: string, data: UpdateWorkspaceDTO): Promise<IWorkspace | null> {
    return Workspace.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async softDelete(id: string): Promise<void> {
    await Workspace.findByIdAndUpdate(id, { $set: { isActive: false } }).exec();
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<IWorkspace | null> {
    return Workspace.findByIdAndUpdate(
      workspaceId,
      {
        $push: { members: { userId: new Types.ObjectId(userId), role, joinedAt: new Date() } },
        $inc: { 'statistics.memberCount': 1 },
      },
      { new: true }
    ).exec();
  }

  async removeMember(workspaceId: string, userId: string): Promise<IWorkspace | null> {
    return Workspace.findByIdAndUpdate(
      workspaceId,
      {
        $pull: { members: { userId: new Types.ObjectId(userId) } },
        $inc: { 'statistics.memberCount': -1 },
      },
      { new: true }
    ).exec();
  }

  async incrementPaperCount(workspaceId: string, delta: number): Promise<void> {
    await Workspace.findByIdAndUpdate(workspaceId, {
      $inc: { 'statistics.paperCount': delta },
    }).exec();
  }

  async updateStorageUsed(workspaceId: string, bytes: number): Promise<void> {
    await Workspace.findByIdAndUpdate(workspaceId, {
      $inc: { 'statistics.storageUsedBytes': bytes },
    }).exec();
  }

  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    const workspace = await Workspace.findOne({
      _id: new Types.ObjectId(workspaceId),
      $or: [
        { owner: new Types.ObjectId(userId) },
        { 'members.userId': new Types.ObjectId(userId) },
      ],
    })
      .lean()
      .exec();
    return !!workspace;
  }

  async getMemberRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    const workspace = await Workspace.findOne({
      _id: new Types.ObjectId(workspaceId),
      'members.userId': new Types.ObjectId(userId),
    })
      .select('members owner')
      .lean()
      .exec();

    if (!workspace) return null;

    if (workspace.owner.toString() === userId) return 'owner';

    const member = workspace.members.find((m) => m.userId.toString() === userId);
    return member?.role || null;
  }

  async search(query: string, userId: string): Promise<IWorkspace[]> {
    return Workspace.find({
      $text: { $search: query },
      $or: [
        { owner: new Types.ObjectId(userId) },
        { 'members.userId': new Types.ObjectId(userId) },
      ],
      isActive: true,
    })
      .limit(10)
      .exec();
  }
}

export const workspaceRepository = new WorkspaceRepository();
