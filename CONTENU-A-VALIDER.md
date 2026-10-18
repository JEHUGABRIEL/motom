# Contenu à valider par l'Agence MOTOM

Repris de l'affiche officielle (`docs/affiche-motom.jpg`) : nom, slogans, les six pôles
et leurs accroches, l'adresse (PK11, près de la station Sassou), les téléphones
(+236 74 51 23 41 / +236 75 27 06 06) et le WhatsApp (+236 70 10 86 02).

## Informations manquantes (masquées sur le site tant qu'elles sont vides)

À renseigner dans `src/data/site.ts` :

- [ ] Adresse e-mail de l'agence
- [ ] Pages Facebook / Instagram
- [ ] Horaires d'ouverture (en attendant, le site invite à appeler ou écrire sur WhatsApp)
- [ ] NIU et RCCM (pied de page et mentions légales)
- [ ] Position exacte de l'agence sur Google Maps (la carte pointe sur « PK11 Bangui »)

## Textes rédigés à partir de l'affiche, à relire

- [ ] Prestations détaillées de chaque pôle (`poles.<slug>.points`, pages Construction,
      Transport, Déménagement, Décoration)
- [ ] Zones desservies par le transport (« Bangui et les provinces »)
- [ ] Conditions de location des voitures (caution, pièces, chauffeur…)
- [ ] FAQ (gérée au back-office après la mise en ligne)

## Visuels

- [ ] Logo officiel en fichier (SVG ou PNG HD) : `public/logo.svg` en est une
      interprétation
- [ ] Vraies photos des réalisations (construction, déménagement, décoration, camions,
      voitures). Les pôles utilisent pour l'instant des photos Unsplash (`src/data/poles.ts`)
- [ ] Annonces réelles (biens, voitures) à publier depuis `/admin`
