import { Repository } from "typeorm";
import { StudentEntity, UserEntity } from "../libs";
import { getTypeOrmRepository } from "../utils";
import { user_sessions } from "../libs/database/entities/sessions.entity";
import { compare, hash } from "bcrypt-ts";
import { ExpressException } from "../errors";
import { StatusCodes } from "http-status-codes";
var random = require('random-string-generator');

export const checkUserCredentials = async (temp_password: string, email?: string, mobile?: string) => {
    const userRepo = getTypeOrmRepository(UserEntity) as Repository<UserEntity>;
    const userEmail = (email as string).trim().toLowerCase();
    const userMobile = (mobile as string).trim();
    if (email && userEmail.length > 0) {

        const userData = await userRepo.findOne({
            where: {
                email_id: userEmail,
                temp_password: temp_password
            }
        });

        if (!userData) {
            return {
                status: 'ERROR',
                message: 'Invalid email or password'
            }
        } else {
            return {
                status: 'SUCCESS',
                data: userData
            }
        }
    } else if (mobile && userMobile.length > 0) {

        const userData = await userRepo.findOne({
            where: {
                mobile_no: Number(userMobile),
                temp_password: temp_password
            }
        });

        if (!userData) {
            return {
                status: 'ERROR',
                message: 'Invalid mobile number or password'
            }
        } else {
            return {
                status: 'SUCCESS',
                data: userData
            }
        }
    } else {
        return {
            status: 'ERROR',
            message: 'Email or Mobile number is required'
        }
    }
}

export const createUserSession = async (user_data: UserEntity, deviceId: string) => {
    const sessionRepo = getTypeOrmRepository(user_sessions) as Repository<user_sessions>;
    
    const loggedOutUsers = await logoutUser(user_data.id, deviceId);
    console.log(loggedOutUsers.message);

    const newSession = sessionRepo.create({
        user_id: user_data.id,
        deviceId
    });

    const savedSession = await sessionRepo.save(newSession);
    return savedSession;
}

export const logoutUser = async (userId: number, deviceId: string) => {
    const sessionRepo = getTypeOrmRepository(user_sessions) as Repository<user_sessions>;

    const existingSessions = await sessionRepo.findBy({
        user_id: userId,
        deviceId,
        is_logged_out: false
    });

    if (existingSessions.length > 0) {
        console.log(`Existing sessions count ${existingSessions.length}`);

        const closeSessions = await sessionRepo.update({
            user_id: userId,
            deviceId,
            is_logged_out: false
        },{
            is_logged_out: true,
            logout_time: new Date().toISOString()
        })

        console.log({ closeSessions });

        return {
            message: 'User Logged Out'
        };
    } else {
        return {
            message: 'No Active User sessions'
        }
    }
}

export const validateUserSession = async (userId: number, sessionId: number) => {
    const sessionRepo = getTypeOrmRepository(user_sessions) as Repository<user_sessions>;
    const existingSessions = await sessionRepo.findBy({
        id: sessionId,
        user_id: userId,
        is_logged_out: false
    });

    return existingSessions.length > 0;
}

export const generateHashPassword = async () => {
    const randomPassword = random(12, "alphanumeric");
    const result = await hash(randomPassword, 10);
    return { hash: result, password: randomPassword };
}

export const verifyPassword = async (password: string, hashedPassword: string) => {
    const isMatch = await compare(password, hashedPassword);
    return isMatch;
}

export const sanitizeUserData = (user: UserEntity) => {
    const { id, temp_password, master_password, google_id, created_at, updated_at, deleted_at, ...sanitizedUser } = user;
    return sanitizedUser;
}

export const checkOraWorldSchoolEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;

    const parts = email.trim().toLowerCase().split('@');

    if (parts.length !== 2) return false; // Must have exactly one @

    return parts[1] === 'oraworldschool.com';
}

export const fetchUserData = async (userId: number) => {
    const usersRepo = getTypeOrmRepository(UserEntity) as Repository<UserEntity>;

    const userData = await usersRepo.findOneBy({
        id: userId
    });

    return userData;
}

export const updateUserData = async (userId: number, full_name: string, mobile_no: number, dob: string, gender: string, age: number) => {
    const userRepo = getTypeOrmRepository(UserEntity) as Repository<UserEntity>;
    let userData = await userRepo.findOne({
                        where: {
                            id: userId
                        }
                    });

    if (!userData) {
        throw new ExpressException("User not found", StatusCodes.NOT_FOUND);
    } else {
        if (userData.is_active == false) {
            throw new ExpressException("User Account is Deactivated", StatusCodes.FORBIDDEN);
        }

        userData.full_name = full_name ?? userData.full_name;
        userData.mobile_no = mobile_no;
        userData.dob = dob;
        userData.gender = gender;
        userData.age = age;

        return userRepo.save(userData);
    }
}