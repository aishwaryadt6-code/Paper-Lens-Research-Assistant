import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';

const OWNER = { name: 'WS Owner', email: 'wsowner@paperlens.dev', password: 'SecurePass1' };
const EDITOR = { name: 'WS Editor', email: 'wseditor@paperlens.dev', password: 'SecurePass1' };

let ownerToken: string;
let createdWorkspaceId: string;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/paperlens_test';
  await mongoose.connect(uri);

  await request(app).post('/api/auth/register').send(OWNER);
  await request(app).post('/api/auth/register').send(EDITOR);

  const loginRes = await request(app).post('/api/auth/login').send({
    email: OWNER.email,
    password: OWNER.password,
  });
  ownerToken = loginRes.body.data.accessToken;
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: [OWNER.email, EDITOR.email] } });
  await Workspace.deleteMany({ name: /^Test Workspace/ });
  await mongoose.disconnect();
});

describe('POST /api/workspaces', () => {
  it('creates a workspace', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Test Workspace Alpha', description: 'Phase 1 test workspace' });

    expect(res.status).toBe(201);
    expect(res.body.data.workspace.name).toBe('Test Workspace Alpha');
    createdWorkspaceId = res.body.data.workspace._id;
  });

  it('rejects workspace without name', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ description: 'Missing name' });
    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .send({ name: 'Unauth Workspace' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/workspaces', () => {
  it('returns user workspaces', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.workspaces)).toBe(true);
    expect(res.body.data.workspaces.length).toBeGreaterThan(0);
  });
});

describe('GET /api/workspaces/:id', () => {
  it('returns a specific workspace', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${createdWorkspaceId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.workspace._id).toBe(createdWorkspaceId);
  });
});

describe('PUT /api/workspaces/:id', () => {
  it('updates workspace name', async () => {
    const res = await request(app)
      .put(`/api/workspaces/${createdWorkspaceId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Test Workspace Updated', description: 'Updated desc' });
    expect(res.status).toBe(200);
    expect(res.body.data.workspace.name).toBe('Test Workspace Updated');
  });
});

describe('DELETE /api/workspaces/:id', () => {
  it('deletes a workspace', async () => {
    const res = await request(app)
      .delete(`/api/workspaces/${createdWorkspaceId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(204);
  });
});
