import { Equal, ILike, In, Not, Or, Repository } from "typeorm";
import { BookEntity, BookGradeEntity, BookStatus, BookStatusEntity, StudentEntity, UserRole } from "../libs";
import { getTypeOrmRepository } from "../utils";
import { ExpressException } from "../errors";
import { StatusCodes } from "http-status-codes";
import { fetchUserData, getBookData, updateBookStatus } from ".";

export const addBookGrades = async (bookId: number, gradeIds: number[]) => {
    if (gradeIds.length <= 0) {
        throw new ExpressException("User must submit at least one Grade", StatusCodes.FORBIDDEN);
    }
    
    const bookGradeRepo = getTypeOrmRepository(BookGradeEntity) as Repository<BookGradeEntity>;

    const checkExistingList = await bookGradeRepo.findBy({
        book_id: bookId
    })

    if (checkExistingList.length <= 0) {
        const newBookGrades = gradeIds.map(gradeId => {
            return {
                book_id: bookId,
                grade_id: gradeId
            } as BookGradeEntity
        })

        const newBookGradesResp = await addNewBookGrades(newBookGrades);
        return newBookGradesResp;
    } else {
        const newBookGrades = gradeIds.map(gradeId => {
            const gradeExists = checkExistingList.find(item => item.grade_id == gradeId)

            if (!gradeExists) {
                return {
                    book_id: bookId,
                    grade_id: gradeId
                } as BookGradeEntity
            }
        })

        const newBookGradesResp = await addNewBookGrades(newBookGrades);
        return newBookGradesResp;
    }
}

export const addNewBookGrades = async (bookGradeList: BookGradeEntity[]) => {
    const bookGradeRepo = getTypeOrmRepository(BookGradeEntity) as Repository<BookGradeEntity>;

    const bookGradesResp = bookGradeRepo.save(bookGradeList);

    return bookGradesResp;
}

export const getAdminBooksList = async (page: number, limit: number, status: BookStatus, search?: string) => {
    const bookRepo = getTypeOrmRepository(BookEntity) as Repository<BookEntity>;
    console.log({ page, limit, status });
    const skip = page * limit;
    console.log({ skip });
    const term = search?.trim();
    console.log('search term', term);
    if (status === BookStatus.AVAILABLE) {
        const where = term ? { status, name: ILike(`%${term}%`) } : { status };

        const [adminBooksList, count] = await bookRepo.findAndCount({
            skip,
            take: limit,
            order: { created_at: 'DESC' },
            where,
            relations: {
                bookGrades: true
            },
        })

        return { adminBooksList, count };
    } else {
        const borowedReservedBooks = await getAdminBorrowedReservedBooks(page,limit,status,term);
        return borowedReservedBooks;
    }
}

const getAdminBorrowedReservedBooks = async (page: number, limit: number, status: BookStatus, search?: string) => {
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
            status
        },
        relations: {
            student: {
                user: true
            }
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

    const [booksList, count] = await bookRepo.findAndCount({
        skip,
        take: limit,
        order: { created_at: 'DESC' },
        where,
        relations: {
            bookGrades: true
        }
    })

    const adminBooksList = booksList.map(book => {
        return {
            ...book,
            status: bookStatusList.find(status => status.book_id === book.id)?.status,
            reserved_on: bookStatusList.find(status => status.book_id === book.id)?.reserved_on,
            borrowed_on: bookStatusList.find(status => status.book_id === book.id)?.borrowed_on,
            return_by_date: bookStatusList.find(status => status.book_id === book.id)?.return_by_date,
            student_id: bookStatusList.find(status => status.book_id === book.id)?.student.id,
            student: bookStatusList.find(status => status.book_id === book.id)?.student.user.full_name
        }
    })

    return { adminBooksList, count };
}

export const addNewBookStatus = async (bookId: number, studentId: number, status: BookStatus, loggedinUserId: number) => {
    if (status === BookStatus.BORROWED) {
        return addBorrowedBook(bookId, studentId, loggedinUserId);
    } else if (status === BookStatus.RESERVED) {
        return reserveBook(bookId, studentId, loggedinUserId);
    } else if (status === BookStatus.RETURN) {
        return addReturnedBook(bookId, studentId, loggedinUserId);
    } else if (status === BookStatus.AVAILABLE) {
        return unreserveBook(bookId, studentId, loggedinUserId);
    } else {
        throw new ExpressException("Invalid Book Status", StatusCodes.FORBIDDEN);
    }
}

const addBorrowedBook = async (bookId: number, studentId: number, loggedinUserId: number) => {

    const bookStatusRepo = getTypeOrmRepository(BookStatusEntity) as Repository<BookStatusEntity>;
    const checkStudentBorrowedBooks = await bookStatusRepo.findBy({
        student_id: studentId,
        status: BookStatus.BORROWED
    })

    if (checkStudentBorrowedBooks.length >= 3) {
        throw new ExpressException(`Student has already borrowed ${checkStudentBorrowedBooks.length} books, cannot borrow more`, StatusCodes.FORBIDDEN);
    }

    const checkBookStatus = await bookStatusRepo.findBy({
        book_id: bookId,
        student_id: Not(studentId),
        status: Or(Equal(BookStatus.BORROWED), Equal(BookStatus.RESERVED))
    })

    if (checkBookStatus.length > 0) {
        throw new ExpressException("Book is already borrowed or reserved by another student", StatusCodes.FORBIDDEN);
    } else {
        
        const todaysDate = new Date();
        const returnByDate = new Date(new Date().setDate((todaysDate.getDay() + 7))); // Return in 7 days

        const checkStudentBookStatus = await bookStatusRepo.findOne({
            where: {
                book_id: bookId,
                student_id: studentId,
                status: BookStatus.RESERVED
            },
            order: {
                id: "desc"
            }
        })

        if (checkStudentBookStatus) {
            checkStudentBookStatus.status = BookStatus.BORROWED;
            checkStudentBookStatus.borrowed_on = todaysDate.toISOString();
            checkStudentBookStatus.return_by_date = returnByDate.toISOString();
            checkStudentBookStatus.last_updated_by = loggedinUserId;

            const newBorrowedBookResp = await bookStatusRepo.save(checkStudentBookStatus);

            const patchBookStatus = await updateBookStatus(bookId, BookStatus.BORROWED);
            console.log({ patchBookStatus });

            return newBorrowedBookResp;
        } else {
            const newBorrowedBook = bookStatusRepo.create({
                book_id: bookId,
                student_id: studentId,
                status: BookStatus.BORROWED,
                borrowed_on: todaysDate.toISOString(),
                return_by_date: returnByDate.toISOString(),
                last_updated_by: loggedinUserId
            })

            const newBorrowedBookResp = await bookStatusRepo.save(newBorrowedBook);

            const patchBookStatus = await updateBookStatus(bookId, BookStatus.BORROWED);
            console.log({ patchBookStatus });

            return newBorrowedBookResp;
        }
    }
}

const addReturnedBook = async (bookId: number, studentId: number, loggedinUserId: number) => {
    const loggedInUser = await fetchUserData(loggedinUserId);

    if (!loggedInUser.role.includes[UserRole.ADMIN,UserRole.LIBRARIAN]) {
        throw new ExpressException("Book cannot be returned by " + loggedInUser.role, StatusCodes.FORBIDDEN);
    } else {
        const bookStatusRepo = getTypeOrmRepository(BookStatusEntity) as Repository<BookStatusEntity>;
        let checkBookStatus = await bookStatusRepo.findOne({
            where: {
                book_id: bookId,
                student_id: studentId,
                status: BookStatus.BORROWED
            },
            order: {
                id: "desc"
            }
        })

        if (checkBookStatus) {
            checkBookStatus.status = BookStatus.AVAILABLE;
            checkBookStatus.returned_on = new Date().toISOString();
            checkBookStatus.last_updated_by = loggedinUserId;

            const updatedBookStatus = await bookStatusRepo.save(checkBookStatus);

            const patchBookStatus = await updateBookStatus(bookId, BookStatus.AVAILABLE);
            console.log({ patchBookStatus });

            return updatedBookStatus;
        } else {
            throw new ExpressException("Book is not borrowed by this student", StatusCodes.FORBIDDEN);
        }
    }
}

const reserveBook = async (bookId: number, studentId: number, loggedinUserId: number) => {
    const bookData = await getBookData(bookId);
    console.log({ bookData });
    const { status } = bookData;

    const bookStatusRepo = getTypeOrmRepository(BookStatusEntity) as Repository<BookStatusEntity>;
    const checkBookStatus = await bookStatusRepo.findBy({
        book_id: bookId,
        student_id: Not(studentId),
        status: Or(Equal(BookStatus.BORROWED), Equal(BookStatus.RESERVED))
    })

    if (checkBookStatus.length > 0 || (status === BookStatus.BORROWED || status === BookStatus.RESERVED)) {
        throw new ExpressException("Book is already borrowed or reserved by another student", StatusCodes.FORBIDDEN);
    } else {
        const todaysDate = new Date();
        const newReservedBook = bookStatusRepo.create({
            book_id: bookId,
            student_id: studentId,
            status: BookStatus.RESERVED,
            reserved_on: todaysDate.toISOString(),
            last_updated_by: loggedinUserId
        })

        const newBorrowedBookResp = await bookStatusRepo.save(newReservedBook);

        const patchBookStatus = await updateBookStatus(bookId, BookStatus.RESERVED);
        console.log({ patchBookStatus });

        return newBorrowedBookResp;
    }
}

export const unreserveBook = async (bookId: number, studentId: number, loggedinUserId: number) => {
    const bookStatusRepo = getTypeOrmRepository(BookStatusEntity) as Repository<BookStatusEntity>;
    let checkBookStatus = await bookStatusRepo.findOne({
        where: {
            book_id: bookId,
            student_id: studentId,
            status: BookStatus.RESERVED
        },
        order: {
            id: "desc"
        }
    })

    if (checkBookStatus) {
        checkBookStatus.status = BookStatus.AVAILABLE;
        checkBookStatus.last_updated_by = loggedinUserId;
        const updatedBookStatus = await bookStatusRepo.save(checkBookStatus);

        const patchBookStatus = await updateBookStatus(bookId, BookStatus.AVAILABLE);
        console.log({ patchBookStatus });

        return updatedBookStatus;
    } else {
        throw new ExpressException("Book is not reserved by this student", StatusCodes.FORBIDDEN);
    }
}

export const getAdminStudentsList = async () => {
    const studentsRepo = getTypeOrmRepository(StudentEntity) as Repository<StudentEntity>;

    const studentsList = await studentsRepo.find({
        select: {
            id: true,
            user_id: true
        },
        relations: {
            user: true,
            grade: true
        }
    })

    const formattedStudentsList = studentsList.map(student => {
        return {
            id: student.id,
            user_id: student.user_id,
            full_name: student.user.full_name,
            grade: student.grade.name,
        }
    })

    return formattedStudentsList;
}