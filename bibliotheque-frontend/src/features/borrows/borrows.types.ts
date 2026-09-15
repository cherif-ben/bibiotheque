export interface Borrow {
  borrowId: number;
  bookId: number;
  userId: number;
  issueDate: string;
  returnDate: string | null;
  dueDate: string;
}
