/**
 * Images for the public pages (design "Royal Imperial", owner order 25.11.2026). All images are the operator's
 * own computer-generated artwork (no third-party photos, no licences to observe), self-hosted under
 * /public/images/wasiyya. No background patterns and no star ornaments.
 */
export type TopicImageId = "hero" | "janazah" | "testament" | "licht";

export interface TopicImage {
  src: string;
  alt: string;
}

export const TOPIC_IMAGES: Record<TopicImageId, TopicImage> = {
  hero: { src: "/images/wasiyya/hero.jpg", alt: "Eine goldene Laterne leuchtet warm in der Dunkelheit." },
  janazah: { src: "/images/wasiyya/janazah.jpg", alt: "Eine Moschee mit Kuppel und zwei Minaretten vor dem Licht der Morgendämmerung." },
  testament: { src: "/images/wasiyya/testament.jpg", alt: "Ein aufgeschlagenes Buch mit goldenem Lesebändchen und ein Füller auf einem Holztisch." },
  licht: { src: "/images/wasiyya/licht.jpg", alt: "Warmes Morgenlicht fällt durch ein hohes Bogenfenster in einen ruhigen Raum." },
};

export const IMAGE_CREDIT = "Alle Bilder auf dieser Website sind eigene, computergenerierte Gestaltungen der MSC Engineering GmbH.";
