import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ChatbotComponent } from './chatbot.component';
import { ChatService } from 'src/app/services/chat.service';
import { of, throwError } from 'rxjs';
import { ElementRef } from '@angular/core';

describe('ChatbotComponent', () => {
  let component: ChatbotComponent;
  let fixture: ComponentFixture<ChatbotComponent>;
  let chatService: jasmine.SpyObj<ChatService>;

  beforeEach(async () => {
    const chatServiceSpy = jasmine.createSpyObj('ChatService', [
      'askQuestion',
      'submitFeedback',
      'submitSupport',
    ]);

    await TestBed.configureTestingModule({
      imports: [ChatbotComponent],
      providers: [{ provide: ChatService, useValue: chatServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatbotComponent);
    component = fixture.componentInstance;
    chatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isOpen).toBeFalse();
    expect(component.userInput).toBe('');
    expect(component.includeWebContent).toBeFalse();
    expect(component.isLoading).toBeFalse();
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].isUser).toBeFalse();
  });

  describe('toggleChat', () => {
    it('should toggle isOpen from false to true', () => {
      component.isOpen = false;
      component.toggleChat();
      expect(component.isOpen).toBeTrue();
    });

    it('should toggle isOpen from true to false', () => {
      component.isOpen = true;
      component.toggleChat();
      expect(component.isOpen).toBeFalse();
    });
  });

  describe('sendMessage', () => {
    it('should not send message if userInput is empty', () => {
      component.userInput = '';
      component.sendMessage();
      expect(chatService.askQuestion).not.toHaveBeenCalled();
    });

    it('should send message and update messages array on success', async () => {
      const mockResponse = {
        answer: 'Test answer',
        suggestedQuestions: ['Question 1', 'Question 2'],
      };
      chatService.askQuestion.and.returnValue(of(mockResponse));

      component.messages = [];
      component.userInput = 'Test question';
      component.sendMessage();

      expect(component.messages.length).toBe(1);
      expect(component.messages[0].text).toBe('Test question');
      expect(component.messages[0].isUser).toBeTrue();
      expect(component.isLoading).toBeTrue();
      expect(component.userInput).toBe('');

      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.messages.length).toBe(1);
      expect(component.messages[0].text).toBe('Test question');
      expect(component.messages[0].isUser).toBeTrue();
      // expect(component.messages[0].suggestedQuestions).toEqual([
      //   'Question 1',
      //   'Question 2',
      // ]);
      expect(component.isLoading).toBeTrue();
    });

    it('should handle error when sending message', (done) => {
      chatService.askQuestion.and.returnValue(
        throwError(() => new Error('API Error')),
      );

      component.userInput = 'Test question';
      component.sendMessage();

      setTimeout(() => {
        expect(component.messages[2].text).toBe('Sorry, something went wrong.');
        expect(component.isLoading).toBeFalse();
        done();
      }, 100);
    });

    // TODO: will be handled later
    xit('should include conversation history in request', () => {
      chatService.askQuestion.and.returnValue(
        of({ answer: 'Test', suggestedQuestions: [] }),
      );

      component.messages = [
        { text: 'Initial', isUser: false, feedbackGiven: null },
        { text: 'Q1', isUser: true, feedbackGiven: null },
        { text: 'A1', isUser: false, feedbackGiven: null },
      ];
      component.userInput = 'Q2';
      component.sendMessage();

      expect(chatService.askQuestion).toHaveBeenCalledWith(
        'Q2',
        false,
        jasmine.arrayContaining([
          { role: 'assistant', content: 'Initial' },
          { role: 'user', content: 'Q1' },
          { role: 'assistant', content: 'A1' },
        ]),
      );
    });
  });

  describe('submitFeedback', () => {
    // TODO: will be handled later
    xit('should submit feedback and update message', () => {
      chatService.submitFeedback.and.returnValue(of({ message: 'Success' }));

      component.messages = [
        {
          text: 'Answer',
          isUser: false,
          question: 'Question',
          feedbackGiven: null,
        },
      ];

      component.submitFeedback(0, true);

      expect(component.messages[0].feedbackGiven).toBe('like');
      expect(chatService.submitFeedback).toHaveBeenCalledWith(
        'Question',
        'Answer',
        true,
      );
    });

    it('should set feedbackGiven to dislike when isLiked is false', () => {
      chatService.submitFeedback.and.returnValue(of({ message: 'Success' }));

      component.messages = [
        {
          text: 'Answer',
          isUser: false,
          question: 'Question',
          feedbackGiven: null,
        },
      ];

      component.submitFeedback(0, false);

      expect(component.messages[0].feedbackGiven).toBe('dislike');
    });

    it('should reset feedbackGiven on error', (done) => {
      chatService.submitFeedback.and.returnValue(
        throwError(() => new Error('Error')),
      );

      component.messages = [
        {
          text: 'Answer',
          isUser: false,
          question: 'Question',
          feedbackGiven: null,
        },
      ];

      component.submitFeedback(0, true);

      setTimeout(() => {
        expect(component.messages[0].feedbackGiven).toBeNull();
        done();
      }, 100);
    });

    it('should not submit feedback if message has no question', () => {
      component.messages = [
        { text: 'Answer', isUser: false, feedbackGiven: null },
      ];

      component.submitFeedback(0, true);

      expect(chatService.submitFeedback).not.toHaveBeenCalled();
    });
  });

  describe('linkifyUrls', () => {
    it('should convert markdown to HTML with target blank', () => {
      const result = component.linkifyUrls('[Link](http://example.com)');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });
  });

  describe('scrollToBottom', () => {
    it('should scroll to bottom when scrollContainer exists', () => {
      const mockElement = {
        nativeElement: { scrollTop: 0, scrollHeight: 1000 },
      };
      component['scrollContainer'] = mockElement as ElementRef;

      component.scrollToBottom();

      expect(mockElement.nativeElement.scrollTop).toBe(1000);
    });

    it('should handle missing scrollContainer gracefully', () => {
      component['scrollContainer'] = undefined as any;
      expect(() => component.scrollToBottom()).not.toThrow();
    });
  });

  describe('onSuggestionClick', () => {
    it('should set userInput and call sendMessage', () => {
      spyOn(component, 'sendMessage');
      component.onSuggestionClick('Suggested question');

      expect(component.userInput).toBe('Suggested question');
      expect(component.sendMessage).toHaveBeenCalled();
    });
  });

  describe('Support Popup', () => {
    it('should open support popup', () => {
      spyOn(component, 'openSupportPopupFromChat');
      component.openSupportPopup();

      expect(component.showSupportPopup).toBeTrue();
      expect(component.openSupportPopupFromChat).toHaveBeenCalled();
    });

    it('should close support popup and reset form', () => {
      component.showSupportPopup = true;
      component.supportForm.issueDescription = 'Test issue';

      component.closeSupportPopup();

      expect(component.showSupportPopup).toBeFalse();
      expect(component.supportForm.issueDescription).toBe('');
    });

    it('should validate support form correctly', () => {
      component.supportForm.issueDescription = '';
      expect(component.isSupportFormValid()).toBeFalse();

      component.supportForm.issueDescription = 'Valid description';
      expect(component.isSupportFormValid()).toBeTrue();
    });

    // TODO: will be handled later
    xit('should submit support request successfully', () => {
      spyOn(window, 'alert');
      chatService.submitSupport.and.returnValue(of({ message: 'Success' }));

      component.userName = 'Test User';
      component.userEmail = 'test@example.com';
      component.getCurrentSelectedProject = 'Project 1';
      component.supportForm.issueDescription = 'Issue description';

      component.submitSupport();

      expect(chatService.submitSupport).toHaveBeenCalledWith(
        'Test User',
        'test@example.com',
        'Project 1',
        'Issue description',
      );
      expect(window.alert).toHaveBeenCalled();
    });

    // TODO: will be handled later
    xit('should handle support submission error', () => {
      spyOn(window, 'alert');
      chatService.submitSupport.and.returnValue(
        throwError(() => new Error('Error')),
      );

      component.supportForm.issueDescription = 'Issue';
      component.submitSupport();

      expect(window.alert).toHaveBeenCalledWith(
        'Failed to send support request. Please try again.',
      );
    });

    it('should not submit if form is invalid', () => {
      component.supportForm.issueDescription = '';
      component.submitSupport();

      expect(chatService.submitSupport).not.toHaveBeenCalled();
    });
  });

  describe('openSupportPopupFromChat', () => {
    it('should load user details from localStorage', () => {
      spyOn(localStorage, 'getItem').and.callFake((key: string) => {
        if (key === 'selectedTrend')
          return JSON.stringify([{ nodeDisplayName: 'Project 1' }]);
        if (key === 'currentUserDetails')
          return JSON.stringify({
            user_name: 'John Doe',
            user_email: 'john@example.com',
          });
        return null;
      });

      component.openSupportPopupFromChat();

      expect(component.getCurrentSelectedProject).toBe('Project 1');
      expect(component.userName).toBe('John Doe');
      expect(component.userEmail).toBe('john@example.com');
    });
  });
});
