import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { firebaseUid, email, name, profilePic } = await request.json();

    if (!firebaseUid || !email) {
      return NextResponse.json(
        { error: 'Firebase UID and email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (user) {
      // Update existing user with latest info from Firebase
      user = await prisma.user.update({
        where: { firebaseUid },
        data: {
          email,
          name,
          profilePic,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          name,
          profilePic,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user with database' },
      { status: 500 }
    );
  }
}