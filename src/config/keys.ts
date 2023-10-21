export interface ContactRulingsLaw {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

interface AppConfig {
  mongoURI: string;
  contactRulingsLaw: ContactRulingsLaw;
}

export const appConfig: AppConfig = {
  // mongoURI: "mongodb://localhost:27017/rulings_law",
  mongoURI:
    "mongodb+srv://iqbal:NewDay2019@rulingslaw.w62au.mongodb.net/rulings_law",
  // mongoURI: 'mongodb+srv://iqbal:NewDay2019@rulingslaw-w62au.mongodb.net/rulings_law?retryWrites=true&w=majority',
  // mongoURI: 'mongodb://localhost/rulings_law',
  contactRulingsLaw: {
    host: "mail.name.com",
    port: 587,
    secure: false,
    user: "contact@rulings.law",
    password: "JudgeMe2018!",
  },
};
