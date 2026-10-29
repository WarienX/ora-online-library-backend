import multer from 'multer';
import * as XLSX from 'xlsx';

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const readExcelFile = async (fileBuffer: Buffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};