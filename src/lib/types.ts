export type Category = 'emo' | 'work' | 'need';

export interface Toss {
  id: string;
  text: string;
  category: Category;
  created_at: string;
}
