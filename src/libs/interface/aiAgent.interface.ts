export interface IBookSuggestion {
  bookId: number;
  title: string;
  author: string;
  reason: string;
}

export interface IAgentResponse {
  reply: string;
  suggestions: IBookSuggestion[];
}

export interface IAgentRequestBody {
  message: string;
  conversationId?: string;
}