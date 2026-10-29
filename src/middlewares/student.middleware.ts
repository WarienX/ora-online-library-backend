import { Response, NextFunction } from "express";
import { IRequest, UserRole } from "../libs";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils";
import { fetchUserData, validateUserSession } from "../services";
import { ExpressException } from "../errors";

const handler = async (req: IRequest, res: Response, next: NextFunction) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
        return res.status(StatusCodes.UNAUTHORIZED).send({
            message: "Unauthorized",
        });
    } else {
        const headersData = req.headers;
        console.log({ headersData });
        console.log(`DeviceID ${req.headers.deviceid as string}`);
        const token = req.headers.authorization.split("Bearer ")[1];
        await verifyToken(token).then(async (payload) => {
            console.log(`Payload ${JSON.stringify(payload)}`);
            req.payload = payload.payload;

            const isUserSessionActive = await validateUserSession(Number(req.payload.user_id),req.payload.session_id);
            console.log({ isUserSessionActive});

            if (isUserSessionActive == true) {
                const loggedInUser = await fetchUserData(Number(req.payload.user_id));
                req.authenticatedUser = loggedInUser;
                req.payload.role = loggedInUser.role as UserRole;
                if (req.payload.role != UserRole.STUDENT) {
                    throw new ExpressException("Invalid Session, Login with student account to continue", StatusCodes.UNAUTHORIZED);    
                } else {
                    req.deviceId = req.headers.deviceid as string;
                    next();
                }
            } else {
                throw new ExpressException("Session Expired, Login again to continue", StatusCodes.UNAUTHORIZED);
            }
        })
    }
}

export const studentMiddleware = handler;