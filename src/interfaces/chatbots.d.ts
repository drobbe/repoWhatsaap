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
  default: string;
  goodbye: string;
  affirmation: Branch[];
  branchs?: Branch[];
  type?: string;
  event?: string;
	aditional?: [
			{
				index: number,
				message: string,
			}
		],
	userNotFoundForm?: {
		indexProcess?: number,
		informations?: [
			{
				message: string,
				value: string,
				parrameter: string,
			}
		]
	}
}