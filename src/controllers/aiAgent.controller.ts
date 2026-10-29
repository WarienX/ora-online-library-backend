import { IRequest } from "../libs";
import { Response } from 'express'
import { requestHandler } from "../utils";
import { StatusCodes } from "http-status-codes";
import { ExpressException } from "../errors";
import { runStudentAgent } from "../services";

export const chatWithAgent = requestHandler( async ( req: IRequest, res: Response ) => {
    try {
        const { message } = req.body;

        const userId = req.authenticatedUser.id;

        if (!message || !message.trim()) {
            throw new ExpressException("Message is required", StatusCodes.FAILED_DEPENDENCY);
        }

        let userMessage = message.trim();

        const result = await runStudentAgent(userId, userMessage);
        return res.status(StatusCodes.OK).json(result);

    } catch (error) {
        console.error('AI Agent error:', error);
        return res.status(StatusCodes.FAILED_DEPENDENCY).json({
            reply: 'Sorry, I am unavailable right now. Please try again later.',
            suggestions: []
        });
    }
})