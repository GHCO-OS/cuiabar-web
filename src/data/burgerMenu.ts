import burgerMenuJson from './burgerMenu.json';

export type BurgerMenuItem = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  imageAlt: string;
};

export type BurgerComboItem = {
  id: string;
  name: string;
  description: string;
  note: string;
};

type BurgerMenuConfig = {
  updatedAt: string;
  heroImage: string;
  heroImageAlt: string;
  ogImage: string;
  ogImageAlt: string;
  instagramUrl: string;
  featuredIds: string[];
  burgers: BurgerMenuItem[];
  combos: BurgerComboItem[];
};

export const burgerMenu = burgerMenuJson as BurgerMenuConfig;

export const burgerItems = burgerMenu.burgers;
export const burgerComboItems = burgerMenu.combos;
export const featuredBurgerItems = burgerItems.filter((item) => burgerMenu.featuredIds.includes(item.id));
