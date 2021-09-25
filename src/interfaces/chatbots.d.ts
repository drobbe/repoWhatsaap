export interface Branch {
  id: number;
  menu: boolean;
  branchs: Branch[];
  text: string;
  enabled: boolean;
  type?: string;
  event?: string | null;
  socket?: string;
  form?: { message: string };
  destiny?: {
    going?: number;
    toMenu?: boolean;
    showMenu?: boolean;
    showGoodbye?: boolean;
  };
}

export interface ChatBot {
  greetings: string[];
  goodbye: string;
  affirmation: Branch[];
  branchs?: Branch[];
  type?: string;
  event?: string;
}
