import type { UserRole } from "@contextdesk/shared-types";

declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
        role: UserRole;
        organizationId: string;
      };
    }
  }
}

export {};