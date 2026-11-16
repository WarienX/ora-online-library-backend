import { IGrade } from ".";
import { BookStatus } from "../enums";

export interface IBook {
  id: number;
  name: string;
  series_name: string;
  author: string;
  genre: string;
  language: string;
  count: number;
  grade_id: number;
  status: BookStatus;
  bookGrades: IGrade[];
  borrowed_on?: string;
  return_by_date?: string;
  reserved_on?: string;
  isbn?: string;
}

export interface IBookStatus {
  id: number;
  book_id: number;
  student_id: number;
  status: string;
  borrowed_on?: string;
  returned_on?: string;
  return_by_date?: string;
  reserved_on?: string;
}