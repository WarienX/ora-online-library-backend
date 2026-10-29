import { Router } from "express";
import { googleLogin, logoutUserSession, onboardStudentGoogleUser, resetMasterPassword, signup, templogin } from "../controllers";
import { authorizationMiddleware } from "../middlewares";

export const authRoute = (app: Router) => {
    const router = Router();

    router.post('/signup', signup);
    router.post('/login', templogin);
    router.post('/g-login', googleLogin);
    router.post('/logout', authorizationMiddleware, logoutUserSession);
    router.get('/reset/masterpassword', authorizationMiddleware, resetMasterPassword);

    app.use( '/auth', router )
}