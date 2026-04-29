export type NavItem = {
  label: string;
  to: string;
  external?: boolean;
  variant?: 'default' | 'highlight' | 'outline';
};

export type Feature = {
  title: string;
  description: string;
  icon: string;
};

export type MenuHighlight = {
  name: string;
  category: string;
  description: string;
  price: string;
  image: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

export type MenuVariant = {
  name: string;
  price: string;
};

export type MenuItem = {
  name: string;
  description: string;
  price: string;
  variants: MenuVariant[];
  image: string;
};

export type MenuSection = {
  name: string;
  description: string;
  items: MenuItem[];
};
