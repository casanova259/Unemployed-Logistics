import { NextRequest } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { handleApiError, apiSuccess } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireUser();

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isOnline: true,
        createdAt: true,
      },
    });

    if (!user) {
      return apiSuccess({ user: sessionUser });
    }

    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
