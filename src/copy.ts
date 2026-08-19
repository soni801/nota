export const CATEGORY_LABELS = {
  norge: "Norge",
  usa: "USA",
  internasjonalt: "Internasjonalt og geopolitikk",
  teknologi: "Teknologi og AI",
  okonomi: "Økonomi",
  vitenskap: "Vitenskap",
} as const;

export const messages = {
  unauthorized: "Ugyldig eller manglende token.",
  invalidJson: "Ugyldig JSON.",
  invalidDate: "Feltet date må være YYYY-MM-DD.",
  articleCount: "articles må inneholde mellom 1 og 30 saker.",
  articleMustBeObject: "Hver sak må være et objekt.",
  requiredFields: "Hver sak trenger title, dek og summary.",
  unknownCategory: (category: string) => `Ukjent kategori: ${category}.`,
  dateMismatch: "Artikkelens date må matche utgavens date.",
  coverRequired: "Hver sak trenger et forsidebilde med url og alt.",
  invalidFigures: "Ugyldig figures-liste. Hver figur trenger url, alt og after ≥ 0.",
  invalidCoverage: "Ugyldig coverage-liste.",
  sourcesRequired: "Hver sak trenger minst én kilde med navn og URL.",
  invalidId: "Ugyldig id.",
  articleNotFound: "Saken finnes ikke.",
  dayNotFound: "Ingen utgave for denne dagen.",
} as const;
