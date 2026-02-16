export interface ITodo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

export interface IChatMessage {
  role: 'user' | 'model';
  text: string;
}
