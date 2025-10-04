import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to get authenticated user from Firebase UID
async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Get Firebase UID from request headers (set by client after Firebase auth)
    const firebaseUid = request.headers.get("x-firebase-uid");

    if (!firebaseUid) {
      return null;
    }

    // Find user in database by Firebase UID
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    return user;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

// GET /api/tasks - Get all tasks for the authenticated user
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/tasks called");

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    console.log("Getting tasks for user:", user.id);

    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      orderBy: [
        { status: "asc" }, // Pending tasks first
        { priority: "desc" }, // High priority first
        { dueDate: "asc" }, // Earliest due date first
        { createdAt: "desc" }, // Newest first
      ],
    });

    console.log(`Found ${tasks.length} tasks for user`);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/tasks called");

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Request body:", body);

    const {
      title,
      description,
      priority,
      dueDate,
      tags,
      isRecurring,
      recurringPattern,
    } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    // Create the task
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags || [],
        isRecurring: isRecurring || false,
        recurringPattern: recurringPattern || null,
        userId: user.id,
        status: "PENDING",
      },
    });

    console.log("Task created successfully:", newTask.id);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      {
        error: "Failed to create task",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
