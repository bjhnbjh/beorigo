export type Category = 'emo' | 'work' | 'need';

export interface Toss {
  id: string;
  text: string;
  category: Category;
  is_public: boolean;
  created_at: string;
}
