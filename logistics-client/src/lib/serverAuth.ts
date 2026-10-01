import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "@/lib/errors";
import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const sessionUserId = session.user.id;
  const sessionUserEmail = session.user.email?.toLowerCase().trim();

  // Verify user still exists in database (in case database was reseeded while JWT cookie persisted)
  let dbUser = sessionUserId
    ? await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { id: true, name: true, email: true, role: true },
      })
    : null;

  if (!dbUser && sessionUserEmail) {
    dbUser = await prisma.user.findUnique({
      where: { email: sessionUserEmail },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  if (!dbUser) {
    return null;
  }

  return {
    id: dbUser.id,
    name: dbUser.name || "User",
    email: dbUser.email,
    role: dbUser.role || Role.CUSTOMER,
  };
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }
  return user;
}
