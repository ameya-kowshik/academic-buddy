import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test database connection
console.log('Prisma client loaded:', !!prisma);

export async function POST(request: NextRequest) {
  try {
    console.log('Sync user API called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { firebaseUid, email, name, profilePic } = body;

    if (!firebaseUid || !email) {
      console.error('Missing required fields:', { firebaseUid: !!firebaseUid, email: !!email });
      return NextResponse.json(
        { error: 'Firebase UID and email are required' },
        { status: 400 }
      );
    }

    console.log('Checking if user exists with firebaseUid:', firebaseUid);

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (user) {
      console.log('User exists, updating:', user.id);
      // Update existing user with latest info from Firebase
      user = await prisma.user.update({
        where: { firebaseUid },
        data: {
          email,
          name,
          profilePic,
        },
      });
      console.log('User updated successfully:', user.id);
    } else {
      console.log('Creating new user');
      // Create new user
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          name,
          profilePic,
        },
      });
      console.log('User created successfully:', user.id);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    
    // More detailed error information
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to sync user with database',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to sync user with database' },
      { status: 500 }
    );
  }
}