import { Router } from "express";
import { authorizationMiddleware, studentMiddleware } from "../middlewares";
import { checkStudentDataStatus, getStudentBooks, getStudentProfileData, onboardStudentGoogleUser, updateStudentBookStatusData, updateStudentData } from "../controllers";

export const studentRoute = (app: Router) => {
    const router = Router();

    router.post('/data/verify', authorizationMiddleware, checkStudentDataStatus);
    router.post('/onboard', authorizationMiddleware, onboardStudentGoogleUser);
    router.post('/books', studentMiddleware, getStudentBooks);
    router.patch('/book/data', studentMiddleware, updateStudentBookStatusData);

    router.get('/', studentMiddleware, getStudentProfileData);
    router.patch('/', studentMiddleware, updateStudentData);

    app.use( '/student', router )
}