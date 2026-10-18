import type { LucideIcon } from "lucide-react";
import { Home, HardHat, Truck, Car, PackageOpen, Sofa } from "lucide-react";

// Les six pôles d'activité de MOTOM, dans l'ordre de l'affiche officielle.
// Les textes vivent dans les traductions (`poles.<slug>`) ; ce fichier ne porte
// que ce qui ne se traduit pas : route, icône, visuel.
export type PoleSlug =
  | "immobilier"
  | "construction"
  | "transport"
  | "location-voitures"
  | "demenagement"
  | "decoration";

export type Pole = {
  slug: PoleSlug;
  icon: LucideIcon;
  image: string;
  /** Page d'arrivée : catalogue pour l'immobilier et les voitures, page de service sinon */
  to: string;
  /** Pôle sans catalogue, présenté par la page générique PolePage */
  servicePage: boolean;
};

const unsplash = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const poles: Pole[] = [
  {
    slug: "immobilier",
    icon: Home,
    image: unsplash("1600596542815-ffad4c1539a9"),
    to: "/biens-a-vendre",
    servicePage: false,
  },
  {
    slug: "construction",
    icon: HardHat,
    image: unsplash("1504307651254-35680f356dfd"),
    to: "/construction",
    servicePage: true,
  },
  {
    slug: "transport",
    icon: Truck,
    image: unsplash("1601584115197-04ecc0da31d7"),
    to: "/transport",
    servicePage: true,
  },
  {
    slug: "location-voitures",
    icon: Car,
    image: unsplash("1650530579355-7ad9d4766043"),
    to: "/vehicules-a-louer",
    servicePage: false,
  },
  {
    slug: "demenagement",
    icon: PackageOpen,
    image: unsplash("1609143739217-01b60dad1c67"),
    to: "/demenagement",
    servicePage: true,
  },
  {
    slug: "decoration",
    icon: Sofa,
    image: unsplash("1586023492125-27b2c045efd7"),
    to: "/decoration-interieure",
    servicePage: true,
  },
];

export const servicePoles = poles.filter((p) => p.servicePage);

export const getPoleBySlug = (slug: PoleSlug) =>
  poles.find((p) => p.slug === slug)!;
