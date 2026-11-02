import { Router } from "express";
import { addNewBook, addNewGrade, editBookData, editGrade, getAllBooksList, getAllStudentsList, getGradesList, getSingleGradeData, importBooksViaXlsx, patchBookStatusData } from "../controllers";
import { upload } from "../utils";
import { authorizationMiddleware } from "../middlewares";

export const adminRoute = (app: Router) => {
    const router = Router();

    router.post('/books/list', authorizationMiddleware, getAllBooksList);
    router.post('/book', authorizationMiddleware, addNewBook);
    router.put('/book', authorizationMiddleware, editBookData);
    router.put('/book/status', authorizationMiddleware, patchBookStatusData);
    router.post('/book/import', authorizationMiddleware, upload.single('file'), importBooksViaXlsx);

    router.post('/grade', authorizationMiddleware, addNewGrade);
    router.put('/grade', authorizationMiddleware, editGrade);
    router.post('/grade/data', authorizationMiddleware, getSingleGradeData);
    router.get('/grades/list', authorizationMiddleware, getGradesList);

    router.get('/students/list', authorizationMiddleware, getAllStudentsList);

    app.use( '/admin', router )
}