import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";
import { generateTicketDraft } from "../services/ai.service.js";

const router = Router();

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: "ticketId is required",
      });
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        organizationId: req.user.organizationId,
      },
      include: {
        contact: true,
        account: true,
        messages: {
          include: {
            author: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const draft = await generateTicketDraft({
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      contactName: ticket.contact?.name,
      accountName: ticket.account?.name,
      messages: ticket.messages.map((message) => ({
        body: message.body,
        isInternalNote: message.isInternalNote,
        authorName: message.author?.name,
      })),
    });

    return res.json({
      success: true,
      draft,
    });
  } catch (error) {
    next(error);
  }
});

export default router;