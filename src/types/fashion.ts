export type Product = {
  id: string;
  brand: string;
  name: string;
  price: string;
  tags: string[];
  imageTone: string;
  aiRecommended?: boolean;
};

export type OutfitItem = {
  id: string;
  category: string;
  name: string;
  reason: string;
  imageTone: string;
};

export type Recommendation = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  items: OutfitItem[];
};

export type UserProfile = {
  name: string;
  ageRange: string;
  styles: string[];
};
