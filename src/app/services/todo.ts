import { Injectable, signal, computed } from '@angular/core';
import { ITodo } from '../models/todo';

@Injectable({ providedIn: 'root' })
export class TodoService {
  todos = signal<ITodo[]>([]);

  // Computed signals for tabs
  incompleteTodos = computed(() => this.todos().filter((t) => !t.completed));
  completedTodos = computed(() => this.todos().filter((t) => t.completed));

  addTodo(title: string, description: string): string {
    const newTodo: ITodo = {
      id:
        this.todos().length > 0
          ? (Math.max(...this.todos().map((t) => Number(t.id))) + 1).toString()
          : '1',
      title,
      description,
      completed: false,
      createdAt: new Date(),
    };
    this.todos.update((t) => [newTodo, ...t]); // Add to top
    return `Added task "${title}".`;
  }

  updateTodo(id: string, title: string, description: string): string {
    this.todos.update((t) =>
      t.map((todo) => (todo.id === id ? { ...todo, title, description } : todo)),
    );
    return `Task updated successfully.`;
  }

  toggleComplete(id: string): string {
    let status = '';
    this.todos.update((t) =>
      t.map((todo) => {
        if (todo.id === id) {
          status = !todo.completed ? 'Complete' : 'Incomplete';
          return { ...todo, completed: !todo.completed };
        }
        return todo;
      }),
    );
    return `Task marked as ${status}.`;
  }

  getTodosList(): string {
    return JSON.stringify(this.todos());
  }
}
