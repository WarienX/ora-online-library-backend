import { ILike, In, Repository } from "typeorm";
import { BookEntity, BookStatus, BookStatusEntity, GradeEntity } from "../libs";
import { getTypeOrmRepository } from "../utils";
import { ExpressException } from "../errors";
import { StatusCodes } from "http-status-codes";
import { addBookGrades } from "./admin.service";

export const getBookData = async (bookId: number) => {
    const bookRepo = getTypeOrmRepository(BookEntity) as Repository<BookEntity>;

    const getBookStatus = await bookRepo.findOne({
        where: {
            id: bookId
        }
    })
    return getBookStatus;
}

export const getBooksList = async () => {
    const bookRepo = getTypeOrmRepository(BookEntity) as Repository<BookEntity>;
    const getBooksList = await bookRepo.find({
        relations: {
            bookStatus: true
        }
    });
    return getBooksList;
}

export const addBookData = async (name: string, genre: string, language: string, count: number, grades: number[], author?: string) => {
    const bookRepo = getTypeOrmRepository(BookEntity) as Repository<BookEntity>;
        const bookName = (name as string).trim();
        const checkExistingBook = await bookRepo.findOneBy({
            name: bookName
        })
    
        if (checkExistingBook) {
            throw new ExpressException("Book already exists", StatusCodes.FORBIDDEN);
        } else {
            const gradeRepo = getTypeOrmRepository(GradeEntity) as Repository<GradeEntity>;
            const gradesList = await gradeRepo.find({
                where: {
                    grade_number: In(grades)
                }
            })
            const gradeIds = gradesList.map(grade => grade.id);
            const newBook = bookRepo.create({
                name: bookName,
                author,
                genre,
                language,
                count
            });
            const savedBook = await bookRepo.save(newBook);

            const bookGrades = await addBookGrades(savedBook.id,gradeIds);
            console.log({ addedBookGrades: bookGrades })

            return {
                ...savedBook,
                grades: gradeIds
            }
        }
}

export const updateBookStatus = async (bookId: number, status: string) => {
    const bookRepo = getTypeOrmRepository(BookEntity) as Repository<BookEntity>;
    let getBookStatus = await bookRepo.findOne({
        where: {
            id: bookId
        }
    })
    if (!getBookStatus) {
        throw new Error("Book not found");
    } else {
        getBookStatus.status = status;
        return bookRepo.save(getBookStatus);
    }
}