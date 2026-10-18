// Identité de l'agence — source unique, reprise de l'affiche officielle MOTOM
// (docs/affiche-motom.jpg). Les champs laissés vides ne sont pas affichés sur le
// site : les renseigner ici suffit à les faire apparaître partout.
export const site = {
  name: "MOTOM",
  shortName: "Motom",
  legalName: "Agence Immobilière MOTOM",
  tagline: "Votre projet immobilier, notre priorité !",
  slogan: "Plus qu'une agence, un partenaire de confiance",
  signature: "MOTOM, votre projet, notre engagement !",
  city: "Bangui",
  country: "République Centrafricaine",
  address: "PK11, près de la station Sassou, Bangui – RCA",
  phones: [
    { label: "+236 74 51 23 41", href: "tel:+23674512341" },
    { label: "+236 75 27 06 06", href: "tel:+23675270606" },
  ],
  phone: "+236 74 51 23 41",
  phoneHref: "tel:+23674512341",
  whatsapp: "+236 70 10 86 02",
  whatsappHref: "https://wa.me/23670108602",
  email: "",
  emailHref: "",
  hours: [] as { days: string; time: string }[],
  legal: {
    niu: "",
    rccm: "",
  },
  social: {
    facebook: "",
    instagram: "",
  },
  mapsEmbed:
    "https://www.google.com/maps?q=PK11+Bangui,+Central+African+Republic&output=embed",
} as const;

export type Site = typeof site;
