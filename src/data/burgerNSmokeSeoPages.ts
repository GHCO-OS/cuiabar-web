import burgerNSmokeSeoPagesJson from './burgerNSmokeSeoPages.json';

export type BurgerNSmokeSeoPageKey =
  | 'hamburgueriaCampinas'
  | 'smashBurgerCampinas'
  | 'burgerDefumadoCampinas'
  | 'deliveryBurgerCampinas';

type BurgerNSmokeSeoHighlight = {
  title: string;
  description: string;
};

type BurgerNSmokeSeoFaq = {
  question: string;
  answer: string;
};

export type BurgerNSmokeSeoPage = {
  key: BurgerNSmokeSeoPageKey;
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  chips: string[];
  highlights: BurgerNSmokeSeoHighlight[];
  featuredItemIds: string[];
  faq: BurgerNSmokeSeoFaq[];
};

type BurgerNSmokeSeoPagesJson = {
  pages: BurgerNSmokeSeoPage[];
};

const seoPagesData = burgerNSmokeSeoPagesJson as BurgerNSmokeSeoPagesJson;

export const burgerNSmokeSeoPageList = seoPagesData.pages;

export const burgerNSmokeSeoPages = seoPagesData.pages.reduce<Record<BurgerNSmokeSeoPageKey, BurgerNSmokeSeoPage>>(
  (acc, page) => {
    acc[page.key] = page;
    return acc;
  },
  {} as Record<BurgerNSmokeSeoPageKey, BurgerNSmokeSeoPage>,
);
