import { ILike, In, Repository } from "typeorm";
import { BookEntity, BookStatus, BookStatusEntity, GradeEntity, StudentEntity, UserEntity } from "../libs";
import { getTypeOrmRepository } from "../utils";
import { ExpressException } from "../errors";
import { StatusCodes } from "http-status-codes";
import { sanitizeUserData } from "./auth.service";

export const addStudentData = async (user_data: UserEntity , fathers_email: string, fathers_mobile: string, mothers_email: string, mothers_mobile: string, grade: number) => {
    const studentRepo = getTypeOrmRepository(StudentEntity) as Repository<StudentEntity>;
    const checkExistingStudent = await studentRepo.findOne({
        where: {
            user_id: user_data.id
        }
    });

    if (checkExistingStudent) {
        throw new ExpressException("Student already onboarded", StatusCodes.NOT_ACCEPTABLE);
    } else {
        const gradeRepo = getTypeOrmRepository(GradeEntity) as Repository<GradeEntity>;

        const gradeData = await gradeRepo.findOneBy({
            id: grade
        })
        if (!gradeData) {
            throw new ExpressException("Invalid Grade Data", StatusCodes.NOT_FOUND);
        }

        const fathersEmail = (fathers_email as string).trim().toLowerCase();
        const mothersEmail = (mothers_email as string).trim().toLowerCase();

        if ((fathers_email && fathersEmail) || (mothers_email && mothersEmail)) {
            const createStudentData = studentRepo.create({
                user_id: user_data.id,
                grade_id: gradeData.id,
                fathers_email: fathersEmail,
                fathers_mobile_no: Number(fathers_mobile),
                mothers_email: mothersEmail,
                mothers_mobile_no: Number(mothers_mobile)
            })

            const savedStudentData = await studentRepo.save(createStudentData);

            const finalUserData = sanitizeUserData(user_data);
            return {
                message: 'User created successfully',
                data: {
                    ...finalUserData,
                    grade_id: savedStudentData.grade_id,
                    father_email: savedStudentData.fathers_email,
                    fathers_mobile_no: savedStudentData.fathers_mobile_no,
                    mother_email: savedStudentData.mothers_email,
                    mothers_mobile_no: savedStudentData.mothers_mobile_no
                }
            };
        } else {
            throw new ExpressException("Either Fathers or Mothers email is required", StatusCodes.NOT_FOUND);
        }
    }
}

export const sanitizeStudentData = (student: StudentEntity) => {
    const { id, user_id, user, grade_id, created_at, updated_at, deleted_at, ...sanitizedUser } = student;
    return sanitizedUser;
}

export const getStudentProfileInfo = async (user_id: number) => {
    const studentRepo = getTypeOrmRepository(StudentEntity) as Repository<StudentEntity>;
    const checkExistingStudent = await studentRepo.findOne({
        where: {
            user_id,
            is_active: true
        },
        relations: {
            grade: true
        }
    });

    if (!checkExistingStudent) {
        throw new ExpressException("Student does not exist", StatusCodes.NOT_ACCEPTABLE);
    } else {
        return sanitizeStudentData(checkExistingStudent);
    }
}

export const getFullStudentProfileInfo = async (user_id: number) => {
    const studentRepo = getTypeOrmRepository(StudentEntity) as Repository<StudentEntity>;
    const checkExistingStudent = await studentRepo.findOne({
        where: {
            user_id,
            is_active: true
        },
        relations: {
            grade: true
        }
    });

    if (!checkExistingStudent) {
        throw new ExpressException("Student does not exist", StatusCodes.NOT_ACCEPTABLE);
    } else {
        return checkExistingStudent;
    }
}

export const checkIfStudentDataExists = async (user_id: number) => {
    const studentRepo = getTypeOrmRepository(StudentEntity) as Repository<StudentEntity>;
    const checkExistingStudent = await studentRepo.findOne({
        where: {
            user_id: user_id
        }
    });

    return checkExistingStudent ? true : false;
}

export const getStudentBooksList = async (page: number, limit: number, status: BookStatus, student_id: number, search?: string) => {
    const bookStatusRepo = getTypeOrmRepository(BookEntity) as Repository<BookEntity>;

    const skip = page * limit;
    const term = search?.trim();
    console.log('search term', term);
    if (status === BookStatus.AVAILABLE) {
        const where = term ? { status, name: ILike(`%${term}%`) } : { status };

        const [studentBooksList, count] = await bookStatusRepo.findAndCount({
            skip,
            take: limit,
            order: { created_at: 'DESC' },
            where,
            relations: {
                bookGrades: true
            },
        })

        return { studentBooksList, count };
    } else {
        const borowedReservedBooks = await getBorrowedReservedBooks(page,limit,status,student_id,term);
        return borowedReservedBooks;
    }
}

export const getStudentBooksListByStatus = async (status: BookStatus, student_id: number) => {
    const bookRepo = getTypeOrmRepository(BookEntity) as Repository<BookEntity>;
    const bookStatusRepo = getTypeOrmRepository(BookStatusEntity) as Repository<BookStatusEntity>;

    if (status === BookStatus.AVAILABLE) {
        const studentBooksList = await bookRepo.find({
            where: {
                status
            },
            relations: {
                bookGrades: true
            },
            take: 20,
            order: { created_at: 'DESC' }
        })

        return studentBooksList;
    } else {
        const bookStatusList = await bookStatusRepo.find({
            where: {
                status,
                student_id
            },
            take: 20,
            order: { created_at: 'DESC' }
        })

        const booksIdList = bookStatusList.map(data => data.book_id);

        const studentBooksList = await bookRepo.find({
            order: { created_at: 'DESC' },
            where: {
                id: In(booksIdList),
                status: status
            },
            relations: {
                bookGrades: true
            }
        })

        return studentBooksList;
    }
}

const getBorrowedReservedBooks = async (page: number, limit: number, status: BookStatus, student_id: number, search?: string) => {
    const bookRepo = getTypeOrmRepository(BookEntity) as Repository<BookEntity>;
    const bookStatusRepo = getTypeOrmRepository(BookStatusEntity) as Repository<BookStatusEntity>;

    const bookStatusList = await bookStatusRepo.find({
        select: {
            book_id: true,
            borrowed_on: true,
            return_by_date: true,
            reserved_on: true
        },
        where: {
            status,
            student_id
        }
    })

    const booksIdList = bookStatusList.map(data => data.book_id);

    const skip = page * limit;
    const term = search?.trim();

    const where = term ? {
          id: In(booksIdList),
          status,
          name: ILike(`%${term}%`)
        } : {
            id: In(booksIdList),
            status
        };

    const [studentBooksList, count] = await bookRepo.findAndCount({
        skip,
        take: limit,
        order: { created_at: 'DESC' },
        where,
        relations: {
            bookGrades: true
        }
    })

    return { studentBooksList, count };
}