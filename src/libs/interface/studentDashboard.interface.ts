export interface IStudentDashboardMetrics {
  borrowedCount: number;
  reservedCount: number;
  dueSoonCount: number;
  returnedThisMonth: number;
}

export interface IStudentDashboardBook {
  id: number;
  title: string;
  author: string;
  coverUrl?: string | null;
  borrowedOn?: string | null;
  returnByDate?: string | null;
  reservedOn?: string | null;
  isOverdue?: boolean;
  daysUntilDue?: number | null;
}

export interface ISuggestedBook {
  id: number;
  title: string;
  author: string;
  coverUrl?: string | null;
  reason?: string;
}

export interface IStudentDashboardData {
  studentName: string;
  gradeName?: string;
  metrics: IStudentDashboardMetrics;
  borrowedBooks: IStudentDashboardBook[];
  reservedBooks: IStudentDashboardBook[];
  suggestedBooks: ISuggestedBook[];
}