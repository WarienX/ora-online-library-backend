import { Router } from "express";
import { authorizationMiddleware, studentMiddleware } from "../middlewares";
import { checkStudentDataStatus, getParentDashboardMetrics, getStudentBooks, getStudentDashboardData, getStudentProfileData, onboardStudentGoogleUser, updateStudentBookStatusData, updateStudentData, verifyParentMasterPassword } from "../controllers";

export const studentRoute = (app: Router) => {
    const router = Router();

    router.post('/data/verify', authorizationMiddleware, checkStudentDataStatus);
    router.post('/onboard', authorizationMiddleware, onboardStudentGoogleUser);
    router.post('/books', studentMiddleware, getStudentBooks);
    router.patch('/book/data', studentMiddleware, updateStudentBookStatusData);

    router.get('/', studentMiddleware, getStudentProfileData);
    router.patch('/', studentMiddleware, updateStudentData);

    router.post('/master-password', studentMiddleware, verifyParentMasterPassword);
    router.get('/parent-dashboard', studentMiddleware, getParentDashboardMetrics);
    
    router.get('/dashboard', studentMiddleware, getStudentDashboardData);

    app.use( '/student', router )
}