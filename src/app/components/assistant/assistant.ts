import { Component, inject, signal } from '@angular/core';
import { IChatMessage } from '../../models/todo';
import { GeminiService } from '../../services/gemini';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-assistant',
  imports: [FormsModule, NgClass],
  templateUrl: './assistant.html',
})
export class Assistant {
  chatMessages = signal<IChatMessage[]>([]);
  chatInput = signal('');

  geminiService = inject(GeminiService);

  async sendChatMessage() {
    const text = this.chatInput().trim();
    if (!text) return;

    this.chatMessages.update((msgs) => [...msgs, { role: 'user', text }]);
    this.chatInput.set('');

    const response = await this.geminiService.sendMessageToAgent(text);
    this.chatMessages.update((msgs) => [...msgs, { role: 'model', text: response }]);
  }
}
