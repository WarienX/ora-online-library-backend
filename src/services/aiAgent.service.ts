import OpenAI from "openai";
import { getFullStudentProfileInfo, getStudentBooksListByStatus } from "./students.service";
import { BookStatus } from "../libs";
import { buildAgentPrompt } from "../utils";
import { IAgentResponse } from "../libs/interface/aiAgent.interface";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

export const runStudentAgent = async (userId: number, message: string) => {
    const studentData = await getFullStudentProfileInfo(userId);
    const borrowedBooks = await getStudentBooksListByStatus(BookStatus.BORROWED, studentData.id);
    console.log('Borrowed books:', borrowedBooks.length);
    const reservedBooks = await getStudentBooksListByStatus(BookStatus.RESERVED, studentData.id);
    console.log('Reserved books:', reservedBooks.length);
    const inventory = await getStudentBooksListByStatus(BookStatus.AVAILABLE, studentData.id);
    console.log('Available books:', inventory.length);

    const prompt = buildAgentPrompt({
        studentName: studentData.user?.full_name,
        grade: studentData.grade?.name,
        borrowedBooks,
        reservedBooks,
        inventory,
        userMessage: message
    });

    const completion = await openai.chat.completions.create({
        model: process.env.GROQ_MODEL || 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
        {
            role: 'system',
            content:
            'You are a school library assistant. Always respond with valid JSON only.'
        },
        { role: 'user', content: prompt }
        ]
    });

    const raw = completion.choices?.[0]?.message?.content || '{}';

    let parsed: IAgentResponse;
    try {
        parsed = JSON.parse(raw) as IAgentResponse;
    } catch {
        return {
            reply: 'I had trouble thinking of suggestions. Please try again.',
            suggestions: []
        };
    }

    const inventoryMap = new Map(inventory.map((b) => [Number(b.id), b]));

    const safeSuggestions = parsed.suggestions
        .map((s) => {
        const book = inventoryMap.get(Number(s.bookId));
        if (!book) return null;
        return {
            bookId: book.id,
            title: book.name,
            author: book.author,
            reason: s.reason
        };
        })
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
        .slice(0, 5);

    return {
        reply: parsed.reply,
        suggestions: safeSuggestions
    };
}