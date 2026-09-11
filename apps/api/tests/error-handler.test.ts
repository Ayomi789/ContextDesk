import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { errorHandler } from "../src/middleware/error-handler";
import { ApiError } from "../src/utils/api-error";

function mockRes() {
  const res: any = {};

  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);

  return res;
}

describe("errorHandler", () => {
  it("passes ApiError status and message through", () => {
    const res = mockRes();

    errorHandler(
      new ApiError(404, "Ticket not found"),
      {} as any,
      res,
      () => {}
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Ticket not found",
    });
  });

  it("maps ZodError to 400", () => {
    const res = mockRes();
    let zodError: unknown;

    try {
      z.string().parse(123);
    } catch (error) {
      zodError = error;
    }

    errorHandler(zodError as Error, {} as any, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("maps Prisma P2002 to 409", () => {
    const res = mockRes();

    errorHandler(
      new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        { code: "P2002", clientVersion: "test" }
      ),
      {} as any,
      res,
      () => {}
    );

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("maps unknown errors to 500", () => {
    const res = mockRes();

    errorHandler(new Error("boom"), {} as any, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error",
    });
  });
});
