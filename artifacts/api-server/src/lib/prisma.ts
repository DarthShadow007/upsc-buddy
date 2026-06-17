import { PrismaClient } from '@prisma/client';

// This creates a single, reusable connection to your Neon database
export const prisma = new PrismaClient();