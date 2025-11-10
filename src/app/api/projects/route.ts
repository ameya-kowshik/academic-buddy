import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Temporary mock data until Prisma client is regenerated
const mockProjects: any[] = [];

// GET /api/projects - Fetch all projects and tasks for user
export async function GET(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return mock data for now
    const projects = mockProjects.filter(p => p.userId === user.id);
    
    // Fetch existing tasks
    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ projects, tasks });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status = 'ACTIVE',
      priority = 'MEDIUM',
      startDate,
      dueDate,
      estimatedHours,
      color = '#3b82f6',
      icon = '📋'
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create mock project
    const project = {
      id: 'temp-' + Date.now(),
      title: title.trim(),
      description: description?.trim() || null,
      status,
      priority,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours: estimatedHours ? parseInt(estimatedHours) : null,
      actualHours: 0,
      color,
      icon,
      isArchived: false,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id,
      tasks: [],
      _count: { tasks: 0, pomodoroLogs: 0 }
    };

    // Add to mock storage
    mockProjects.push(project);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}