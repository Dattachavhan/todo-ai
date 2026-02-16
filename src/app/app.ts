import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { ITodo } from './models/todo';
import { GeminiService } from './services/gemini';
import { TodoService } from './services/todo';
import { FormsModule } from '@angular/forms';
import { Assistant } from './components/assistant/assistant';

@Component({
  selector: 'app-root',
  imports: [FormsModule, DatePipe, NgClass, Assistant],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('todo-ai');
  todoService = inject(TodoService);
  geminiService = inject(GeminiService);
  tabTypes = ['all', 'incomplete', 'complete'];
  today: Date = new Date();

  // Tabs View State
  activeTab = signal<string>('all');
  displayedTodos = computed(() => {
    switch (this.activeTab()) {
      case 'incomplete':
        return this.todoService.incompleteTodos();
      case 'complete':
        return this.todoService.completedTodos();
      default:
        return this.todoService.todos();
    }
  });

  // Form State
  showForm = signal(false);
  editingId = signal<string | null>(null);

  // Inputs & Suggestions
  titleInput = signal('');
  titleSuggestion = signal('');
  private titleSubject = new Subject<string>();

  descInput = signal('');
  descSuggestion = signal('');
  private descSubject = new Subject<string>();

  constructor() {
    // Setup Debouncers for both fields
    this.titleSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((text) => {
          if (text) {
            return this.geminiService.getSuggestion(text).then((result) => ({
              result,
              text,
            }));
          } else {
            return Promise.resolve({ result: '', text: '' });
          }
        }),
      )
      .subscribe(({ result, text }) => {
        if (text) {
          this.titleSuggestion.set(
            result.startsWith(' ') || result.startsWith(',') ? result : ' ' + result,
          );
        } else {
          this.titleSuggestion.set('');
        }
      });

    this.descSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((text) => {
          if (text) {
            return this.geminiService.getSuggestion(text).then((result) => ({
              result,
              text,
            }));
          } else {
            return Promise.resolve({ result: '', text: '' });
          }
        }),
      )
      .subscribe(({ result, text }) => {
        if (text) {
          this.descSuggestion.set(
            result.startsWith(' ') || result.startsWith(',') ? result : ' ' + result,
          );
        } else {
          this.descSuggestion.set('');
        }
      });
  }

  // --- Form Handlers ---
  openForm() {
    this.showForm.set(true);
    this.editingId.set(null);
    this.titleInput.set('');
    this.descInput.set('');
  }

  closeForm() {
    this.showForm.set(false);
    this.titleSuggestion.set('');
    this.descSuggestion.set('');
  }

  editTodo(todo: ITodo) {
    this.showForm.set(true);
    this.editingId.set(todo.id);
    this.titleInput.set(todo.title);
    this.descInput.set(todo.description);
  }

  saveTodo() {
    if (!this.titleInput().trim()) return;

    if (this.editingId()) {
      this.todoService.updateTodo(this.editingId()!, this.titleInput(), this.descInput());
    } else {
      this.todoService.addTodo(this.titleInput(), this.descInput());
    }
    this.closeForm();
  }

  // --- Typing & Auto-Suggest Handlers ---
  onTitleTyping(text: string) {
    this.titleInput.set(text);
    this.titleSuggestion.set('');
    this.titleSubject.next(text);
  }

  onDescTyping(text: string) {
    this.descInput.set(text);
    this.descSuggestion.set('');
    this.descSubject.next(text);
  }

  handleKeydown(event: KeyboardEvent, field: 'title' | 'desc') {
    const isTabOrRight = event.key === 'Tab' || event.key === 'ArrowRight';

    if (field === 'title' && isTabOrRight && this.titleSuggestion()) {
      event.preventDefault();
      this.titleInput.set(this.titleInput() + this.titleSuggestion());
      this.titleSuggestion.set('');
    } else if (field === 'desc' && isTabOrRight && this.descSuggestion()) {
      event.preventDefault();
      this.descInput.set(this.descInput() + this.descSuggestion());
      this.descSuggestion.set('');
    } else if (event.key === 'Enter') {
      this.saveTodo();
    }
  }
}
