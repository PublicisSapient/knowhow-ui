import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatRequest {
  question: string;
  includeWebContent: boolean;
  conversationHistory?: ConversationMessage[];
}

export interface ConversationMessage {
  role: string;
  content: string;
}

export interface ChatResponse {
  answer: string;
  suggestedQuestions?: string[];
}

export interface FeedbackRequest {
  question: string;
  answer: string;
  isLiked: boolean;
}

export interface FeedbackResponse {
  message: string;
}

export interface SupportRequest {
  name: string;
  email: string;
  project: string;
  issueDescription: string;
}

export interface SupportResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = `${environment.MCP_URL}/api/chat`;

  constructor(private http: HttpClient) {}

  askQuestion(
    question: string,
    includeWebContent: boolean,
    conversationHistory?: ConversationMessage[],
  ): Observable<ChatResponse> {
    const body: ChatRequest = {
      question,
      includeWebContent,
      conversationHistory,
    };
    return this.http.post<ChatResponse>(this.apiUrl, body);
  }

  submitFeedback(
    question: string,
    answer: string,
    isLiked: boolean,
  ): Observable<FeedbackResponse> {
    const body: FeedbackRequest = { question, answer, isLiked };
    return this.http.post<FeedbackResponse>(`${this.apiUrl}/feedback`, body);
  }

  submitSupport(
    name: string,
    email: string,
    project: string,
    issueDescription: string,
  ): Observable<SupportResponse> {
    const body: SupportRequest = { name, email, project, issueDescription };
    return this.http.post<SupportResponse>(`${this.apiUrl}/support`, body);
  }
}
