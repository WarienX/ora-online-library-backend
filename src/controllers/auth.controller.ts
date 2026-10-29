import { IRequest, UserEntity } from "../libs";
import { Response } from 'express'
import { generateToken, getTypeOrmRepository, requestHandler, sendEmail } from "../utils";
import { checkIfStudentDataExists, checkOraWorldSchoolEmail, checkUserCredentials, createUserSession, fetchUserData, generateHashPassword, getStudentProfileInfo, logoutUser, sanitizeUserData } from "../services";
import { Repository } from "typeorm";
import { hash } from "bcrypt-ts";
import { ExpressException } from "../errors";
import { StatusCodes } from "http-status-codes";

export const login = requestHandler( async ( req: IRequest, res: Response ) => {
    const { email, mobile } = req.body;

    if ( !email && !mobile ) {
        return res.status( 400 ).json( {
            message: 'Email or Mobile number is required'
        } )
    } else if (email) {
        const userEmail = (email as string).trim().toLowerCase();
    } else  {

    }
})

export const templogin = requestHandler( async ( req: IRequest, res: Response ) => {
    const { email, mobile, temp_password, deviceId } = req.body;

    if ( !email && !mobile ) {
        return res.status(400).json( {
            message: 'Email or Mobile number is required'
        } )
    } else {
        const resp = await checkUserCredentials(temp_password, email, mobile);
        if (resp.status === 'ERROR') {
            return res.status(400).json({
                message: resp.message
            });
        } else {

            const sessionData = await createUserSession(resp.data as UserEntity, deviceId);
            const userToken = await generateToken({
                user_id: resp.data.id,
                session_id: sessionData.id,
                role: resp.data.role
            })

            const finalUserData = sanitizeUserData(resp.data);
            return res.status(200).json({
                status: resp.status,
                token: userToken.accessToken,
                data: finalUserData
            });
        }
    }
})

export const signup = requestHandler( async ( req: IRequest, res: Response ) => {
    const { full_name, email, mobile, password, role, fathers_email, mothers_email, grade } = req.body;

    const userRepo = getTypeOrmRepository(UserEntity) as Repository<UserEntity>;
    const existingUser = await userRepo.findOne({
        where: [
            { email_id: email },
            { mobile_no: mobile }
        ]
    });

    if (existingUser) {
        throw new ExpressException("User with this email or mobile number already exists", StatusCodes.FORBIDDEN);
    } else {
        const master_password = await generateHashPassword();
        const hash_user_password = await hash(password, 10);
        const newUser = userRepo.create({
            full_name,
            email_id: email,
            mobile_no: mobile,
            role,
            temp_password: hash_user_password,
            master_password: master_password.hash
        });
        const savedUser = await userRepo.save(newUser);

        const finalUserData = sanitizeUserData(savedUser);
        return res.status(StatusCodes.OK).json({
            message: 'User created successfully',
            data: finalUserData
        });
    }
})

export const googleLogin = requestHandler( async ( req: IRequest, res: Response ) => {
    const { googleId, full_name, email, mobile, deviceId } = req.body;

    const userEmail = (email as string).trim().toLowerCase();

    const isORAEmail = checkOraWorldSchoolEmail(userEmail);
    if (!isORAEmail) {
        throw new ExpressException("Invalid ORA World School email address", StatusCodes.NOT_FOUND);
    }

    const userRepo = getTypeOrmRepository(UserEntity) as Repository<UserEntity>;

    const userData = await userRepo.findOne({
                        where: {
                            email_id: userEmail
                        }
                    });
    
    if (userData) {
        if (userData.is_active == false) {
            throw new ExpressException("User Account is Deactivated", StatusCodes.FORBIDDEN);
        }

        const patchUserData = await userRepo.save({
            ...userData,
            google_id: googleId
        });

        const sessionData = await createUserSession(patchUserData, deviceId);
            const userToken = await generateToken({
                user_id: patchUserData.id,
                session_id: sessionData.id,
                role: patchUserData.role
            })

            const dataExists = await checkIfStudentDataExists(userData.id);

            const finalUserData = sanitizeUserData(patchUserData);
            return res.status(StatusCodes.OK).json({
                status: 'SUCCESS',
                token: userToken.accessToken,
                data: finalUserData,
                studentDataExists: dataExists
            });
    } else {
        const master_password = await generateHashPassword();
        const temp_password = await generateHashPassword();
        let user_role = 'student';
        if (userEmail == "tech@oraworldschool.com") {
            user_role = "admin"
        }
        const newUser = userRepo.create({
            full_name: full_name,
            email_id: userEmail,
            mobile_no: mobile,
            role: user_role || 'student',
            temp_password: temp_password.hash,
            master_password: master_password.hash,
            google_id: googleId
        });
        const savedUser = await userRepo.save(newUser);

        const sessionData = await createUserSession(savedUser, deviceId);
        const userToken = await generateToken({
                user_id: savedUser.id,
                session_id: sessionData.id,
                role: savedUser.role
            })
        const finalUserData = sanitizeUserData(savedUser);
        return res.status(StatusCodes.OK).json({
            message: 'User created successfully',
            token: userToken.accessToken,
            data: finalUserData
        });
    }
})

export const logoutUserSession = requestHandler( async ( req: IRequest, res: Response ) => {
    const userData = req.authenticatedUser;
    const deviceId = req.deviceId;

    const resp = await logoutUser(userData.id,deviceId);

    return res.status(StatusCodes.OK).json(resp);
})

export const resetMasterPassword = requestHandler( async ( req: IRequest, res: Response ) => {
    const user = req.authenticatedUser;

    const userData = await fetchUserData(user.id);
    
    if (!userData) {
        throw new ExpressException("User not found", StatusCodes.NOT_FOUND);
    } else {
        if (userData.role == 'student') {
            const usersRepo = getTypeOrmRepository(UserEntity) as Repository<UserEntity>;
            
            const master_password = await generateHashPassword();
            const patchUserData = await usersRepo.save({
                ...userData,
                master_password: master_password.hash
            });
            const studentInfo = await getStudentProfileInfo(user.id);
            const parentsEmail = [studentInfo.fathers_email, studentInfo.mothers_email].filter(email => email !== null && email !== undefined);

            await sendEmail('ORA World School Library - Master Password Reset', 
                `<p>Hi ${patchUserData.full_name},</p><p>Your master password has been reset successfully. 
                Your new master password is: <strong>${master_password.password}</strong></p>
                <p>Please keep this password safe and do not share it with anyone.</p><p>Thank you,<br/>ORA World School Library Team</p>`,parentsEmail);

            return res.status(StatusCodes.OK).json({
                message: 'Master password reset successfully.'
            });
        } else {
            throw new ExpressException("Invalid user role", StatusCodes.FORBIDDEN);
        }
    }
})