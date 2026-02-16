# 📝 Todo Manager - AI Powered

An advanced, AI-powered Todo application built with **Angular 21** and the **Google Gemini 2.5 Flash API**. This isn't just a chatbot; it's an **AI Agent** capable of interacting with your application's state to manage tasks through natural language.

## ✨ Key Features

- **🤖 Agentic Task Management**: Use natural language to add, complete, or list tasks. The AI understands intent and calls local functions to modify your data.
- **⚡ Real-time Autocomplete**: Predictive "Ghost Text" suggestions as you type, powered by a debounced Gemini stream to stay within free-tier rate limits.
- **🗣️ Personalized Greetings**: Custom system instructions ensure the AI introduces itself and offers specific help (like finding today's tasks).
- **🛠️ Tool Integration (Function Calling)**: Seamless bridge between the LLM and Angular services using `functionDeclarations`.
- **🚀 Optimized Performance**: Uses `gemini-2.5-flash` for sub-second response times.

---

## 🛠️ Tech Stack

- **Framework**: Angular 21 (Signals-based state management)
- **AI Engine**: Google Generative AI SDK (`@google/generative-ai`)
- **Model**: Gemini 2.5-flash
- **Language**: TypeScript (Strict Mode)

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js (v20+)
- An API Key from [Google AI Studio](https://aistudio.google.com/)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/Dattachavhan/todo-ai.git

# Install dependencies
npm install

```

### 3. Environment Setup

Create a `src/environments/environment.ts` file and add your key:

```typescript
export const environment = {
  apiKey: 'YOUR_GEMINI_API_KEY_HERE',
};
```

### 4. Run the App

```bash
ng serve

```

Navigate to `http://localhost:4200/`.

---

## 🧠 How the Agent Works

The application uses **Function Calling** to turn the LLM into an active participant.

1. **User Input**: "Remind me to buy milk at 5 PM."
2. **AI Reasoning**: Gemini identifies the `addTodo` tool is needed.
3. **Tool Call**: The SDK sends a structured request: `{ name: "addTodo", args: { task: "Buy milk at 5 PM" } }`.
4. **Local Execution**: The Angular `TodoService` updates the UI signals.
5. **Response**: Gemini confirms: "Done! I've added 'Buy milk' to your list for 5 PM."

---

## ⚠️ Rate Limit Handling

To avoid **429 (Too Many Requests)** errors on the Free Tier, this project implements:

- **RxJS Debouncing**: Autocomplete requests are delayed by 600ms.
- **Request Guarding**: API calls are ignored for inputs shorter than 4 characters.
- **Exponential Backoff**: Automatic retry logic for failed network requests.

---

## 📄 License

MIT License - feel free to use this for your own AI projects!

---
