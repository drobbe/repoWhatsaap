export interface ChatInMemory {
  idUsername: number;
  idChat: number;
  telefono: string;
  idSender: string;
  greetins: boolean;
  affirmation: boolean;
  lastBranch: number | null;
  // last_branch: number | null;
}
