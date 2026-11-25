import { Disclaimer } from "@/components/ui/disclaimer";
import { TopicFunctionLinks, TopicHero } from "@/components/marketing/topic-page";
import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/bestatter");

export default function BestatterPage() {
  return (
    <div>
      <TopicHero
        eyebrow="In Vorbereitung"
        title="Islamische Bestatter"
        image="janazah"
        intro={
          <p>
            Ein öffentliches Verzeichnis erscheint hier erst, wenn echte, geprüfte Partner vorliegen. Derzeit gibt es
            keine Einträge und keine Verifizierungen.
          </p>
        }
      />
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <div className="rounded-2xl gold-frame p-8 text-center" data-testid="bestatter-empty-state">
          <p className="text-foreground font-semibold mb-2">Noch keine geprüften Bestatter</p>
          <p className="text-muted leading-relaxed">
            Bitte wende dich im akuten Fall an eine Moschee, einen Imam oder einen islamischen Bestattungsdienst in
            deiner Region. Wir erfinden keine Anbieter, Telefonnummern oder Websites.
          </p>
        </div>

        <TopicFunctionLinks
          actions={[
            { href: "/dashboard/bestattung", label: "Bestattung oder Überführung", text: "Deinen Bestatter oder deine Moschee und deine Wünsche notieren." },
            { href: "/dashboard/notfallkarte", label: "Notfallkarte", text: "Wen die Familie im Ernstfall zuerst anrufen soll." },
          ]}
        />

        <div className="mt-10">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
