import { Router } from "express";
import { addNewBook, addNewGrade, editBookData, editGrade, getAllBooksList, getGradesList, getSingleGradeData, importBooksViaXlsx, patchBookStatusData } from "../controllers";
import { upload } from "../utils";

export const adminRoute = (app: Router) => {
    const router = Router();

    router.post('/books/list', getAllBooksList);
    router.post('/book', addNewBook);
    router.put('/book', editBookData);
    router.put('/book/status', patchBookStatusData);
    router.post('/book/import', upload.single('file'), importBooksViaXlsx);

    router.post('/grade', addNewGrade);
    router.put('/grade', editGrade);
    router.post('/grade/data', getSingleGradeData);
    router.get('/grades/list', getGradesList);

    app.use( '/admin', router )
}