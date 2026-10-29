import { BookEntity, IRequest, IXlsxBook, StudentEntity } from "../libs";
import { Response } from 'express'
import { getTypeOrmRepository, requestHandler } from "../utils";
import { Not, Repository } from "typeorm";
import { ExpressException } from "../errors";
import { StatusCodes } from "http-status-codes";
import { addBookData, addGrades, addNewBookStatus, editGrades, fetchGradeById, fetchGrades, getAdminBooksList, getAdminStudentsList } from "../services";
import { readExcelFile } from "../utils";

export const getAllStudentsList = requestHandler(async (req: IRequest, res: Response) => {
    const list = await getAdminStudentsList();

    return res.status(StatusCodes.OK).json({
        message: 'Students fetched successfully',
        list
    });
})

export const addNewBook = requestHandler(async (req: IRequest, res: Response) => {
    const { book_name, series_name, author, genre, language, gradeId } = req.body;

    const bookRepo = getTypeOrmRepository(BookEntity) as Repository<BookEntity>;
    const bookName = (book_name as string).trim();
    const checkExistingBook = await bookRepo.findOneBy({
        name: bookName
    })

    if (checkExistingBook) {
        throw new ExpressException("Book already exists", StatusCodes.FORBIDDEN);
    } else {
        const newBook = bookRepo.create({
            name: bookName,
            series_name,
            author,
            genre,
            language,
            grade_id: gradeId
        });
        const savedBook = await bookRepo.save(newBook);

        return res.status(StatusCodes.OK).json({
            message: 'Book added successfully',
            data: savedBook
        });
    }
})

export const editBookData = requestHandler(async (req: IRequest, res: Response) => {
    const { book_id, book_name, series_name, author, genre, language, gradeId } = req.body;

    const bookRepo = getTypeOrmRepository(BookEntity) as Repository<BookEntity>;
    let checkExistingBook = await bookRepo.findOneBy({
        id: Number(book_id)
    })

    if (!checkExistingBook) {
        throw new ExpressException("Book does not exists", StatusCodes.NOT_FOUND);
    }

    const bookName = (book_name as string).trim();
    // Check for duplicate book with same name
    const checkDuplicates = await bookRepo.findOneBy({
        name: bookName,
        id: Not(Number(book_id))
    })

    if (checkDuplicates) {
        throw new ExpressException("Another Book with same name exists", StatusCodes.FORBIDDEN);
    }

    checkExistingBook.name = bookName && bookName.length > 0 ? bookName : checkExistingBook.name;
    checkExistingBook.series_name = series_name && series_name.trim().length > 0 ? series_name.trim() : checkExistingBook.series_name;
    checkExistingBook.author = author && author.trim().length > 0 ? author.trim() : checkExistingBook.author;
    checkExistingBook.genre = genre && genre.trim().length > 0 ? genre.trim() : checkExistingBook.genre;
    checkExistingBook.language = language && language.trim().length > 0 ? language.trim() : checkExistingBook.language;
    checkExistingBook.language = gradeId ? gradeId : checkExistingBook.grade_id;

    const updatedBook = await bookRepo.save(checkExistingBook);

    return res.status(StatusCodes.OK).json({
        message: 'Book updated successfully',
        data: updatedBook
    });
})

export const patchBookStatusData = requestHandler(async (req: IRequest, res: Response) => {
    const { studentId, book_id, status } = req.body;

    const studentRepo = getTypeOrmRepository(StudentEntity) as Repository<StudentEntity>;
    const studentData = await studentRepo.findOneBy({
        id: studentId
    })

    if (!studentData) {
        throw new ExpressException("Student data not found", StatusCodes.NOT_FOUND);
    } else {
        const updatedBookStatus = await addNewBookStatus(book_id, studentId, status, req.authenticatedUser.id);

        return res.status(StatusCodes.OK).json({
            message: 'Updated Book Status successfully',
            data: updatedBookStatus
        });
    }
})

export const getAllBooksList = requestHandler(async (req: IRequest, res: Response) => {
    const { page, limit, status, search } = req.body;

    const { adminBooksList, count } = await getAdminBooksList(page, limit, status, search);

    return res.status(StatusCodes.OK).json({
        message: 'Books fetched successfully',
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        list: adminBooksList
    });
})

export const addNewGrade = requestHandler(async (req: IRequest, res: Response) => {
    const { name, grade_number } = req.body;

    const newGradeResp = await addGrades(name, grade_number);

    return res.status(StatusCodes.OK).json({
        message: 'Grade added successfully',
        data: newGradeResp
    });
})

export const editGrade = requestHandler(async (req: IRequest, res: Response) => {
    const { grade_id, name, grade_number } = req.body;

    const updatedGradeResp = await editGrades(grade_id, name, grade_number);

    return res.status(StatusCodes.OK).json({
        message: 'Grade updated successfully',
        data: updatedGradeResp
    });
})

export const getGradesList = requestHandler(async (req: IRequest, res: Response) => {
    const gradesList = await fetchGrades();

    return res.status(StatusCodes.OK).json({
        message: 'Grades fetched successfully',
        list: gradesList
    });
})

export const getSingleGradeData = requestHandler(async (req: IRequest, res: Response) => {
    const { grade_id } = req.body;

    const gradeData = await fetchGradeById(Number(grade_id));

    if (!gradeData) {
        throw new ExpressException("Grade not found", StatusCodes.NOT_FOUND);
    }

    return res.status(StatusCodes.OK).json({
        message: 'Grade data fetched successfully',
        data: gradeData
    });
})

export const importBooksViaXlsx = requestHandler(async (req: IRequest, res: Response) => {
    if (!req.file) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'No file uploaded. Please upload a file with the field name "file"',
      });
    }

    const workbookData = await readExcelFile(req.file.buffer) as IXlsxBook[];

    const resp = await Promise.all(workbookData.map(async (data) => {
            console.log(`Grade: ${data.grade}`)
            const finalGrade = data.grade.split(" (Age")[0];
            console.log({ finalGrade });
            if (!finalGrade.includes("Grade ")) {
                return false;
            } else {
                const checkMultipleGrades = finalGrade.includes("Grade ") && finalGrade.includes("-");
                const selectedGradeNo = finalGrade.split("Grade ")[1];
                if (checkMultipleGrades === true) {
                    const gradeNos: number[] = []
                    const gradeLowerLimit = Number(selectedGradeNo.split("-")[0]);
                    const gradeUpperLimit = Number(selectedGradeNo.split("-")[1]);
                    console.log({ gradeLowerLimit })
                    console.log({ gradeUpperLimit })
                    gradeNos.push(gradeLowerLimit);
                    if ((gradeLowerLimit + 1) === gradeUpperLimit) {
                        gradeNos.push(gradeUpperLimit);
                    } else {
                        for (let i = (gradeLowerLimit + 1); i <= gradeUpperLimit; i++) {
                            gradeNos.push(i);
                        }
                    }

                    const addedBooks = await addBookData(data.title,data.genre,data.language,data.qty,gradeNos,data.author);
                    return addedBooks;
                } else {
                    console.log({ selectedGradeNo })
                    const gradeNos = [Number(selectedGradeNo)];
                    const addedBooks = await addBookData(data.title,data.genre,data.language,data.qty,gradeNos,data.author);
                    return addedBooks;
                }
            }
        })
    );

    return res.status(StatusCodes.OK).json({
        message: 'Books imported successfully',
        data: workbookData,
        resp
    });
})