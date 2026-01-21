import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { ChatService } from 'src/app/services/chat.service';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { SharedService } from 'src/app/services/shared.service';

interface Message {
  text: string;
  isUser: boolean;
  question?: string;
  feedbackGiven?: 'like' | 'dislike' | null;
  suggestedQuestions?: string[];
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DropdownModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css',
})
export class ChatbotComponent implements AfterViewChecked {
  @Input() userName: string;
  @Input() userProject;
  @Input() userEmail: string;

  isOpen = false;
  userInput = '';
  includeWebContent = false;
  messages: Message[] = [
    {
      text: 'I am your assistant to answer questions on knowHOW features and KPI, please type your question.',
      isUser: false,
      feedbackGiven: null,
    },
  ];
  isLoading = false;
  lastQuestion = '';
  showSupportPopup = false;
  supportForm = {
    issueDescription: '',
  };

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  getCurrentSelectedProject;
  selectedProject: any;
  private hasInitialized = false;

  constructor(
    private readonly chatService: ChatService,
    private readonly sharedService: SharedService,
  ) {}

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const question = this.userInput;
    this.lastQuestion = question;
    this.messages.push({ text: question, isUser: true, feedbackGiven: null });
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();

    const conversationHistory: any[] = [];
    const historyStart = Math.max(0, this.messages.length - 5);
    for (let i = historyStart; i < this.messages.length - 1; i++) {
      const msg = this.messages[i];
      conversationHistory.push({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text,
      });
    }

    this.chatService
      .askQuestion(question, this.includeWebContent, conversationHistory)
      .subscribe({
        next: (response) => {
          this.messages.push({
            text: response.answer,
            isUser: false,
            question: this.lastQuestion,
            feedbackGiven: null,
            suggestedQuestions: response.suggestedQuestions,
          });
          this.isLoading = false;
          this.scrollToBottom();
        },
        error: (err) => {
          this.messages.push({
            text: 'Sorry, something went wrong.',
            isUser: false,
            feedbackGiven: null,
          });
          this.isLoading = false;
          this.scrollToBottom();
        },
      });
  }

  submitFeedback(messageIndex: number, isLiked: boolean) {
    const message = this.messages[messageIndex];
    if (!message || !message.question) return;

    message.feedbackGiven = isLiked ? 'like' : 'dislike';

    this.chatService
      .submitFeedback(message.question, message.text, isLiked)
      .subscribe({
        next: () => {
          console.info('Feedback submitted successfully');
        },
        error: (err) => {
          console.error('Error submitting feedback:', err);
          message.feedbackGiven = null;
        },
      });
  }

  linkifyUrls(text: string): string {
    let html = marked.parse(text, { async: false }) as string;
    html = html.replace(
      /<a href=/g,
      '<a target="_blank" rel="noopener noreferrer" href=',
    );
    return html;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  onSuggestionClick(suggestion: string) {
    this.userInput = suggestion;
    this.sendMessage();
  }

  openSupportPopup() {
    this.showSupportPopup = true;
    this.openSupportPopupFromChat();
  }

  closeSupportPopup() {
    this.showSupportPopup = false;
    this.supportForm = {
      issueDescription: '',
    };
  }

  isSupportFormValid(): boolean {
    return (
      this.supportForm.issueDescription.trim() !== '' && !!this.selectedProject
    );
  }

  submitSupport() {
    if (!this.isSupportFormValid()) return;

    this.chatService
      .submitSupport(
        this.userName,
        this.userEmail,
        this.selectedProject?.name || '',
        this.supportForm.issueDescription,
      )
      .subscribe({
        next: () => {
          alert(
            'Support request sent successfully! We will get back to you soon.',
          );
          this.closeSupportPopup();
        },
        error: (err) => {
          alert('Failed to send support request. Please try again.');
          console.error('Error submitting support request:', err);
        },
      });
  }

  openSupportPopupFromChat() {
    const listOfProjects = this.sharedService.getListOfProjects();

    this.getCurrentSelectedProject = listOfProjects.map((el) => ({
      name: el.nodeDisplayName,
      code: el.nodeName,
    }));
    this.selectedProject = null;

    const currentUserDetails = JSON.parse(
      localStorage.getItem('currentUserDetails') || '{}',
    );
    this.userName = currentUserDetails.user_name;
    this.userEmail = currentUserDetails.user_email;
  }
}
