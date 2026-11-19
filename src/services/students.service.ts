import { ILike, In, MoreThanOrEqual, Not, Repository } from "typeorm";
import { BookEntity, BookStatus, BookStatusEntity, GradeEntity, IStudentDashboardBook, IStudentDashboardData, ISuggestedBook, StudentEntity, UserEntity } from "../libs";
import { getTypeOrmRepository } from "../utils";
import { ExpressException } from "../errors";
import { StatusCodes } from "http-status-codes";
import { sanitizeUserData } from "./auth.service";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

const daysUntilDue = (date: Date | string | null | undefined): number | null => {
    if (!date) return null;

    const target = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / MS_PER_DAY);
}

export const mapBorrowedBooks = (book: BookEntity, status: BookStatusEntity): IStudentDashboardBook => {
    const returnBy = status.return_by_date ?? null;
    const days = daysUntilDue(returnBy);

    return {
        id: book.id,
        title: book.name,
        author: book.author,
        borrowedOn: status.borrowed_on ? new Date(status.borrowed_on).toISOString() : null,
        returnByDate: returnBy ? new Date(returnBy).toISOString() : null,
        isOverdue: days != null ? days < 0 : false,
        daysUntilDue: days
    };
}

export const mapReservedBooks = (book: BookEntity, status: BookStatusEntity): IStudentDashboardBook => {
    return {
        id: book.id,
        title: book.name,
        author: book.author,
        coverUrl: (book as any).cover_url ?? null,
        reservedOn: status.reserved_on
        ? new Date(status.reserved_on).toISOString()
        : null
    };
}

export const getSuggestedBooks = async (studentId: number, excludeBookIds: number[]): Promise<ISuggestedBook[]> => {
    const booksRepo = getTypeOrmRepository(BookEntity) as Repository<BookEntity>;

    const status = BookStatus.AVAILABLE;
    const where = excludeBookIds.length > 0 ? { id: Not(In(excludeBookIds)), status } : { status };

    const suggestedBooks = await booksRepo.find({
        where,
        take: 5,
        order: { created_at: 'DESC' }
    });

    return suggestedBooks.map((b) => ({
        id: b.id,
        title: b.name,
        author: b.author,
        reason: 'Available in the ORA library'
    }));
}

export const getStudentDashboard = async (studentId: number): Promise<IStudentDashboardData> => {
  const studentRepo = getTypeOrmRepository(StudentEntity) as Repository<StudentEntity>;
  const bookStatusRepo = getTypeOrmRepository(BookStatusEntity) as Repository<BookStatusEntity>;
  const bookRepo = getTypeOrmRepository(BookEntity) as Repository<BookEntity>;

  const student = await studentRepo.findOne({
    where: { id: studentId },
    relations: {
        user: true,
        grade: true
    }
  });

  if (!student) {
    throw new Error('Student not found');
  }

  const statusRows = await bookStatusRepo.find({
    where: { student_id: studentId },
    select: {
      id: true,
      book_id: true,
      status: true,
      borrowed_on: true,
      return_by_date: true,
      reserved_on: true,
      updated_at: true
    }
  });

  const borrowedStatus = statusRows.filter((s) => s.status === BookStatus.BORROWED);
  const reservedStatus = statusRows.filter((s) => s.status === BookStatus.RESERVED);

  const borrowedIds = borrowedStatus.map((s) => s.book_id);
  const reservedIds = reservedStatus.map((s) => s.book_id);
  const allIds = Array.from(new Set([...borrowedIds, ...reservedIds]));

  let booksById = new Map<number, BookEntity>();

  if (allIds.length) {
    const books = await bookRepo.find({
      where: { id: In(allIds) }
    });
    booksById = new Map(books.map((b) => [b.id, b]));
  }

  const borrowedBooks: IStudentDashboardBook[] = borrowedStatus
    .map((s) => {
      const book = booksById.get(s.book_id);
      return book ? mapBorrowedBooks(book, s) : null;
    })
    .filter(Boolean) as IStudentDashboardBook[];

  const reservedBooks: IStudentDashboardBook[] = reservedStatus
    .map((s) => {
      const book = booksById.get(s.book_id);
      return book ? mapReservedBooks(book, s) : null;
    })
    .filter(Boolean) as IStudentDashboardBook[];

  // ---- Metrics ----
  const dueSoonCount = borrowedBooks.filter(
    (b) => b.isOverdue || (b.daysUntilDue != null && b.daysUntilDue <= 3)
  ).length;

  // Returned this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const returnedThisMonth = await bookStatusRepo.count({
    where: {
      student_id: studentId,
      status: BookStatus.AVAILABLE,
      updated_at: MoreThanOrEqual(startOfMonth)
    }
  });

  const suggestedBooks = await getSuggestedBooks(studentId, [
    ...borrowedIds,
    ...reservedIds
  ]);

  const studentName = student.user.full_name || 'Student';

  const gradeName = (student as any).grade?.name || ((student as any).grade?.grade_number != null ? `Grade ${(student as any).grade.grade_number}` : undefined);

  return {
    studentName,
    gradeName,
    metrics: {
      borrowedCount: borrowedBooks.length,
      reservedCount: reservedBooks.length,
      dueSoonCount,
      returnedThisMonth
    },
    borrowedBooks,
    reservedBooks,
    suggestedBooks
  };
};