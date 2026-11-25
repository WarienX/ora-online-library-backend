import { Router } from "express";
import { addNewBook, addNewGrade, editBookData, editGrade, getAdminDashbaord, getAllBooksList, getAllStudentsList, getGradesList, getSingleBookData, getSingleGradeData, importBooksViaXlsx, patchBookStatusData } from "../controllers";
import { upload } from "../utils";
import { adminMiddleware } from "../middlewares";

export const adminRoute = (app: Router) => {
    const router = Router();

    router.post('/books/list', adminMiddleware, getAllBooksList);
    router.post('/books/data', adminMiddleware, getSingleBookData);
    router.post('/book', adminMiddleware, addNewBook);
    router.put('/book', adminMiddleware, editBookData);
    router.put('/book/status', adminMiddleware, patchBookStatusData);
    router.post('/book/import', adminMiddleware, upload.single('file'), importBooksViaXlsx);

    router.post('/grade', adminMiddleware, addNewGrade);
    router.put('/grade', adminMiddleware, editGrade);
    router.post('/grade/data', adminMiddleware, getSingleGradeData);
    router.get('/grades/list', adminMiddleware, getGradesList);

    router.get('/students/list', adminMiddleware, getAllStudentsList);
    
    router.get('/dashboard', adminMiddleware, getAdminDashbaord);

    app.use( '/admin', router )
}