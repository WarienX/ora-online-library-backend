import { Router } from "express";
import { authorizationMiddleware } from "../middlewares";
import { chatWithAgent } from "../controllers";

export const aiAgentRoute = (app: Router) => {
    const router = Router();

    router.post('/message', authorizationMiddleware, chatWithAgent);

    app.use( '/ai-agent', router )
}