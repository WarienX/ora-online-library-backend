import { Router } from "express";
import { authRoute } from "./auth.route";
import { adminRoute } from "./admin.route";
import { studentRoute } from "./student.route";
import { aiAgentRoute } from "./aiAgent.routes";

export const router = Router()

authRoute(router)
adminRoute(router)
studentRoute(router)
aiAgentRoute(router)