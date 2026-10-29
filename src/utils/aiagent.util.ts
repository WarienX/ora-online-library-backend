import { BookEntity } from "../libs";

interface PromptInput {
  studentName?: string;
  grade?: string;
  borrowedBooks: BookEntity[];
  reservedBooks: BookEntity[];
  inventory: BookEntity[];
  userMessage: string;
}

export function buildAgentPrompt(input: PromptInput): string {
  const { studentName, grade, borrowedBooks, reservedBooks, inventory, userMessage } = input;

  const borrowedText = borrowedBooks.length
    ? borrowedBooks
        .map((b, i) => `${i + 1}. "${b.name}" by ${b.author}`)
        .join('\n')
    : 'No borrowed books yet.';

  const reservedText = reservedBooks.length
    ? reservedBooks
        .map((b, i) => `${i + 1}. "${b.name}" by ${b.author}`)
        .join('\n')
    : 'No reserved books yet.';

  const inventoryText = inventory
    .map((b) => `- ID:${b.id} | "${b.name}" by ${b.author}`)
    .join('\n');

  return `
        You are ORA, a friendly school library helper for students.
        You can chat simply and suggest books.

        Student: ${studentName || 'Student'}
        Grade: ${grade || 'Unknown'}

        Borrowed books:
        ${borrowedText}

        Interested or Reserved books:
        ${reservedText}

        Available inventory (you MUST choose only from this list):
        ${inventoryText}

        Student message:
        "${userMessage}"

        Rules:
        1. Be friendly, short, and clear.
        2. If the student asks for book ideas, suggest 1 to 5 books ONLY from inventory.
        3. Never invent a book that is not in inventory.
        4. If just chatting (hi/thanks), return an empty suggestions array.
        5. Use exact bookId, title, and author from inventory.

        Return ONLY valid JSON:
        {
            "reply": "your message to the student",
            "suggestions": [
                {
                "bookId": 123,
                "title": "Exact title",
                "author": "Exact author",
                "reason": "One short sentence"
                }
            ]
        }
    `.trim();
}