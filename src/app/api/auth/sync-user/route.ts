import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface SyncUserRequest {
  firebaseUid: string;
  email: string | null;
  name: string | null;
  profilePic: string | null;
}

/**
 * POST /api/auth/sync-user
 * Syncs Firebase user with database
 * Creates user if doesn't exist, updates if exists
 */
export async function POST(request: NextRequest) {
  try {
    const body: SyncUserRequest = await request.json();
    const { firebaseUid, email, name, profilePic } = body;

    // Validate required fields
    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'Firebase UID is required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { firebaseUid },
        data: {
          email,
          name: name || user.name,
          profilePic: profilePic || user.profilePic
        }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          name: name || email.split('@')[0], // Use email prefix as default name
          profilePic
        }
      });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
