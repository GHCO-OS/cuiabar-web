import burgerNSmokeJson from './burgerNSmoke.json';

const burgerNSmokeData = burgerNSmokeJson;

export const burgerNSmokeOrigin = burgerNSmokeData.origin;
export const burgerNSmokePreviewPath = burgerNSmokeData.previewPath;
export const burgerNSmokeInstagramUrl = burgerNSmokeData.instagramUrl;
export const burgerNSmokeGoogleProfileUrl = burgerNSmokeData.googleProfileUrl;
export const burgerNSmokeIfoodUrl = burgerNSmokeData.ifoodUrl;
export const burgerNSmokeMapsUrl = burgerNSmokeData.mapsUrl;
export const burgerNSmokeWhatsAppMessage = burgerNSmokeData.whatsappMessage;
export const burgerNSmokeWhatsAppUrl =
  `https://wa.me/551933058878?text=${encodeURIComponent(burgerNSmokeWhatsAppMessage)}`;

export const burgerNSmokeBrand = {
  ...burgerNSmokeData.brand,
  origin: burgerNSmokeOrigin,
  previewPath: burgerNSmokePreviewPath,
  instagramUrl: burgerNSmokeInstagramUrl,
  googleProfileUrl: burgerNSmokeGoogleProfileUrl,
  ifoodUrl: burgerNSmokeIfoodUrl,
  whatsappUrl: burgerNSmokeWhatsAppUrl,
  mapsUrl: burgerNSmokeMapsUrl,
};

export const burgerNSmokeQuickFacts = burgerNSmokeData.quickFacts;
export const burgerNSmokeManifesto = burgerNSmokeData.manifesto;
export const burgerNSmokeHighlights = burgerNSmokeData.highlights;
export const burgerNSmokeStats = burgerNSmokeData.stats;
export const burgerNSmokeTrustSignals = burgerNSmokeData.trustSignals;
export const burgerNSmokeMenuItems = burgerNSmokeData.menuItems;
export const burgerNSmokeFeaturedIds = burgerNSmokeData.featuredIds;
export const burgerNSmokeCombos = burgerNSmokeData.combos;
export const burgerNSmokeOccasions = burgerNSmokeData.occasions;
export const burgerNSmokeFaq = burgerNSmokeData.faq;
