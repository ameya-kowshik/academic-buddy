import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
  firebaseUid?: string;
}

/**
 * Verifies a Firebase JWT token
 * @param token - The Firebase ID token to verify
 * @returns The decoded token if valid, null otherwise
 */
export async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}

/**
 * Extracts the user from the request by verifying the Firebase token
 * @param request - The Next.js request object
 * @returns The user object if authenticated, null otherwise
 */
export async function extractUserFromRequest(
  request: NextRequest
): Promise<{ user: User | null; firebaseUid: string | null }> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, firebaseUid: null };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the Firebase token
    const decodedToken = await verifyFirebaseToken(token);
    
    if (!decodedToken) {
      return { user: null, firebaseUid: null };
    }

    // Get user from database using Firebase UID
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    return { user, firebaseUid: decodedToken.uid };
  } catch (error) {
    console.error('Error extracting user from request:', error);
    return { user: null, firebaseUid: null };
  }
}

/**
 * Middleware wrapper that requires authentication for a route handler
 * @param handler - The route handler function to wrap
 * @returns A wrapped handler that checks authentication first
 */
export function requireAuth<T = any>(
  handler: (
    request: NextRequest,
    context: { params?: T },
    user: User,
    firebaseUid: string
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: { params?: T } = {}
  ): Promise<NextResponse> => {
    try {
      const { user, firebaseUid } = await extractUserFromRequest(request);

      // Check if token is missing or invalid
      if (!firebaseUid) {
        return NextResponse.json(
          {
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required. Please provide a valid token.',
            },
          },
          { status: 401 }
        );
      }

      // Check if user exists in database
      if (!user) {
        return NextResponse.json(
          {
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found. Please sign up first.',
            },
          },
          { status: 404 }
        );
      }

      // Call the original handler with authenticated user
      return await handler(request, context, user, firebaseUid);
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Handle specific Firebase errors
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          return NextResponse.json(
            {
              error: {
                code: 'TOKEN_EXPIRED',
                message: 'Your session has expired. Please sign in again.',
              },
            },
            { status: 401 }
          );
        }
        
        if (error.message.includes('invalid')) {
          return NextResponse.json(
            {
              error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid authentication token.',
              },
            },
            { status: 401 }
          );
        }
      }

      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred during authentication.',
          },
        },
        { status: 500 }
      );
    }
  };
}
