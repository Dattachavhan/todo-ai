import { Injectable, inject } from '@angular/core';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { environment } from '../../environments/environment';
import { TodoService } from './todo';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private genAI = new GoogleGenerativeAI(environment.geminiApiKey);
  private todoService = inject(TodoService);
  private chatSession: any;

  constructor() {
    this.initAgenticChat();
  }

  // --- 1. Auto-Suggest Feature ---
  async getSuggestion(currentText: string): Promise<string> {
    if (!currentText || currentText.trim().length < 15) return '';
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are an intelligent autocomplete engine. The user is typing a todo item: "${currentText}". Predict the most likely next 1 to 5 words that would naturally continue this phrase, as if you were completing their thought. Only return the suggested text, with no extra words, punctuation, or formatting. Do not include quotes or markdown.`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (e) {
      return '';
    }
  }

  // --- 2. Agentic Chat Feature ---
  private initAgenticChat() {
    // Define the tools (functions) Gemini is allowed to use
    const addTodoFunction: FunctionDeclaration = {
      name: 'addTodo',
      description: "Add a new task to the user's todo list.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          taskTitle: { type: SchemaType.STRING, description: 'The title of the task to add' },
          taskDesc: { type: SchemaType.STRING, description: 'The description of the task to add' },
        },
        required: ['taskTitle', 'taskDesc'],
      },
    };

    const completeTodoFunction: FunctionDeclaration = {
      name: 'markComplete',
      description: 'Mark a task as complete. Requires the exact ID of the task.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'The ID of the task to complete' },
        },
        required: ['id'],
      },
    };

    const getTodosFunction: FunctionDeclaration = {
      name: 'getTodosList',
      description: 'Get the current list of all todos, including their IDs and completion status.',
    };

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ functionDeclarations: [addTodoFunction, completeTodoFunction, getTodosFunction] }],
    });

    // Start a chat session that remembers context
    this.chatSession = model.startChat({
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: "You are a helpful and friendly Todo List Assistant. If the user says 'hi' or greets you, reply with a warm welcome message, introduce yourself, and explain how you can help. Specifically, make sure to tell them: 'I can find out today's tasks for you.' Use the provided tools to manage their tasks. Always be concise and conversational.",
          },
        ],
      },
    });
  }

  async sendMessageToAgent(message: string): Promise<string> {
    try {
      console.log('User message to Gemini:', message);
      let result = await this.chatSession.sendMessage(message);

      // Check if the model decided to call a function (Agentic behavior)
      const calls = result.response.functionCalls();
      if (calls && calls.length > 0) {
        const call = calls[0];
        let functionResult = '';

        // Execute the local Angular service function based on Gemini's request
        if (call.name === 'addTodo') {
          functionResult = this.todoService.addTodo(call.args['taskTitle'], call.args['taskDesc']);
        } else if (call.name === 'markComplete') {
          functionResult = this.todoService.toggleComplete(call.args['id']);
        } else if (call.name === 'getTodosList') {
          functionResult = this.todoService.getTodosList();
        }

        // Send the result of the function back to Gemini so it can generate a human-readable response
        result = await this.chatSession.sendMessage([
          {
            functionResponse: {
              name: call.name,
              response: { result: functionResult },
            },
          },
        ]);
      }

      return result.response.text();
    } catch (error) {
      console.error('Chat error:', error);
      return 'Sorry, I encountered an error.';
    }
  }
}
