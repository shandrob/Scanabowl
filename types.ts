export interface Product {
  id: string;
  ean: string;
  naam: string;
  merk: string;
  doeldier: 'Kat' | 'Hond';
  ingredienten: string;
  analyse: string; // e.g., "Eiwit: 30%, Vet: 15%"
  graanvrij: boolean;
  score: number;
  score_explanation: string;
  url: string; // Link naar de webshop
}

export interface PetProfile {
  id: string;
  name: string;
  species: 'Kat' | 'Hond';
  breed: string;
  age: number;
  weight: number;
  allergies: string; // Comma separated
  priorities: string;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  image_url: string;
  published_at: string; // ISO Date string
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  website_url: string;
  rating: number; // 1-5
}

export type SortOption = 'score_desc' | 'alpha_asc';