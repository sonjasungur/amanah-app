/**
 * Images for the public pages (design "Royal Imperial", owner order 25.11.2026). All images are the operator's
 * own computer-generated artwork (no third-party photos, no licences to observe), self-hosted under
 * /public/images/wasiyya. No background patterns and no star ornaments.
 */
export type TopicImageId = "startseite" | "janazah" | "testament" | "licht" | "sadaqa";

export interface TopicImage {
  src: string;
  alt: string;
}

export const TOPIC_IMAGES: Record<TopicImageId, TopicImage> = {
  startseite: {
    src: "/images/wasiyya/hero-startseite.jpg",
    alt: "Unter einem goldenen Bogen: ein dunkelblauer Vorsorgeordner, ein Füller, Datteln und eine leuchtende Laterne vor einem Fenster mit Moschee in der Dämmerung.",
  },
  janazah: { src: "/images/wasiyya/janazah.jpg", alt: "Eine Moschee mit Kuppel und zwei Minaretten vor dem Licht der Morgendämmerung." },
  testament: { src: "/images/wasiyya/testament.jpg", alt: "Ein aufgeschlagenes Buch mit goldenem Lesebändchen und ein Füller auf einem Holztisch." },
  sadaqa: { src: "/images/wasiyya/sadaqa.jpg", alt: "Von einem Tropfen breiten sich goldene Ringe auf dunklem Wasser aus – Gutes, das weiterwirkt." },
  licht: { src: "/images/wasiyya/licht.jpg", alt: "Warmes Morgenlicht fällt durch ein hohes Bogenfenster in einen ruhigen Raum." },
};

export const IMAGE_CREDIT = "Alle Bilder auf dieser Website sind eigene, computergenerierte Gestaltungen der MSC Engineering GmbH.";
