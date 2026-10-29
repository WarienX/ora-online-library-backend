import { BookStatus, IRequest, StudentEntity, UserEntity } from "../libs";
import { Response } from 'express'
import { addNewBookStatus, addStudentData, checkIfStudentDataExists, checkOraWorldSchoolEmail, fetchUserData, getStudentBooksList, getStudentProfileInfo, sanitizeUserData, updateUserData } from "../services";
import { getTypeOrmRepository, requestHandler } from "../utils";
import { StatusCodes } from "http-status-codes";
import { ExpressException } from "../errors";
import { Repository } from "typeorm";

export const checkStudentDataStatus = requestHandler( async ( req: IRequest, res: Response ) => {
    const userData = req.authenticatedUser;
    const dataExists = await checkIfStudentDataExists(userData.id);

    return res.status(StatusCodes.OK).json({
        message: 'Student Data Status',
        data: {
            dataExists
        }
    })
})

export const onboardStudentGoogleUser = requestHandler( async ( req: IRequest, res: Response ) => {
    const { fathers_email, fathers_mobile, mothers_email, mothers_mobile, grade } = req.body;

    const userEmail = (req.authenticatedUser.email_id as string).trim().toLowerCase();

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

    if (!userData) {
        throw new ExpressException("User not found", StatusCodes.NOT_FOUND);
    } else {
        if (userData.is_active == false) {
            throw new ExpressException("User Account is Deactivated", StatusCodes.FORBIDDEN);
        }

        const finalResp = await addStudentData(userData,fathers_email,fathers_mobile,mothers_email,mothers_mobile,grade);
        return res.status(StatusCodes.OK).json(finalResp);
    }
})

export const updateStudentData = requestHandler( async ( req: IRequest, res: Response ) => {
    const { full_name, mobile_no, dob, gender, age } = req.body;

    const userId = req.authenticatedUser.id;

    const updatedUser = await updateUserData(userId,full_name,mobile_no,dob,gender,age);

    const finalResp = {
        message: 'Student Info updated successfully',
        data: sanitizeUserData(updatedUser)
    }
    return res.status(StatusCodes.OK).json(finalResp);
})

export const getStudentProfileData = requestHandler( async ( req: IRequest, res: Response ) => {
    const userId = req.authenticatedUser.id;

    const userInfo = await fetchUserData(userId);
    const studentInfo = await getStudentProfileInfo(userId);

    const finalResp = {
        message: 'Success!',
        data: {
            userInfo: sanitizeUserData(userInfo),
            studentInfo
        }
    }

    return res.status(StatusCodes.OK).json(finalResp);
})

export const getStudentBooks = requestHandler( async ( req: IRequest, res: Response ) => {
    const { page, limit, status, search } = req.body;

    const userId = req.authenticatedUser.id;

    const studentRepo = getTypeOrmRepository(StudentEntity) as Repository<StudentEntity>;
    const studentData = await studentRepo.findOneBy({
        user_id: userId
    });

    if (!studentData) {
        throw new ExpressException("Student data not found", StatusCodes.NOT_FOUND);
    } else {
        const { studentBooksList, count } = await getStudentBooksList(page, limit, status, studentData.id,search);
        return res.status(StatusCodes.OK).json({
            message: 'Student Books List',
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
            list: studentBooksList
        });
    }
})

export const updateStudentBookStatusData = requestHandler(async (req: IRequest, res: Response) => {
    const { book_id, status } = req.body;

    const userId = req.authenticatedUser.id;

    const studentRepo = getTypeOrmRepository(StudentEntity) as Repository<StudentEntity>;
    const studentData = await studentRepo.findOneBy({
        user_id: userId
    })

    if (!studentData) {
        throw new ExpressException("Student data not found", StatusCodes.NOT_FOUND);
    } else {
        if (status == BookStatus.RETURN) {
            throw new ExpressException("Invalid action for Student, kindly contact Librarian", StatusCodes.FORBIDDEN);
        }
        const updatedBookStatus = await addNewBookStatus(book_id, studentData.id, status, userId);

        return res.status(StatusCodes.OK).json({
            message: 'Updated Book Status successfully',
            data: updatedBookStatus
        });
    }
})