import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { PathSelector } from "@/components/onboarding/path-selector";
import { moduleConfigs } from "@/lib/modules/config";
import { pricingPlans } from "@/lib/mock/pricing";

export default function HomePage() {
  const freeFeatures = pricingPlans.filter((p) => p.category === "free");

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-accent font-medium mb-4">Für Krankheit. Für Janazah. Für Barzakh. Für deine Familie.</p>
          <h1 className="text-3xl md:text-5xl font-bold text-primary leading-tight mb-6">
            Islamisch vorbereitet — bevor deine Familie im schwersten Moment entscheiden muss.
          </h1>
          <p className="text-lg text-muted mb-8 max-w-2xl mx-auto">
            Erstelle deinen AmanahOrdner für Krankheit, Patientenverfügung, Janazah, Testament, Schulden, Barzakh und Sadaqa Jariya — speziell für Muslime in Deutschland.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/check"><Button size="lg">Kostenlosen Amanah-Check starten</Button></Link>
            <Link href="/dashboard"><Button size="lg" variant="outline">AmanahOrdner erstellen</Button></Link>
          </div>
        </div>
      </section>

      {/* USP */}
      <section className="py-12 max-w-4xl mx-auto px-4">
        <p className="text-center text-muted text-lg">
          AmanahOrdner verbindet islamisches Wissen, Vorsorge, Testament-Vorbereitung, Kulturfilter, Bestatter-Notfallkette und Sadaqa Jariya in einem geführten System.
        </p>
      </section>

      {/* 3 Kernfragen */}
      <section className="py-12 bg-sand/50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-primary text-center mb-8">Drei Fragen, die jeder Muslim klären sollte</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <span className="text-3xl">🏥</span>
              <h3 className="font-semibold mt-3 mb-2">Im Krankenhaus</h3>
              <p className="text-sm text-muted">Wenn ich nicht sprechen kann: Wer entscheidet?</p>
            </Card>
            <Card className="text-center">
              <span className="text-3xl">🕌</span>
              <h3 className="font-semibold mt-3 mb-2">Bei meinem Tod</h3>
              <p className="text-sm text-muted">Weiß meine Familie, was islamisch richtig ist?</p>
            </Card>
            <Card className="text-center">
              <span className="text-3xl">🌙</span>
              <h3 className="font-semibold mt-3 mb-2">Im Barzakh</h3>
              <p className="text-sm text-muted">Habe ich Schulden, Amanah und Sadaqa Jariya vorbereitet?</p>
            </Card>
          </div>
        </div>
      </section>

      <PathSelector />

      {/* Module */}
      <section className="py-12 max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-primary text-center mb-8">13 Module — ein Ordner</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleConfigs.map((mod) => (
            <Link key={mod.id} href={mod.path}>
              <Card className="hover:border-primary/30 transition-all h-full">
                <span className="text-2xl">{mod.icon}</span>
                <h3 className="font-semibold mt-2">{mod.title}</h3>
                <p className="text-sm text-muted">{mod.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Preise */}
      <section className="py-12 bg-sand/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-primary mb-6">Kostenlos starten</h2>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {freeFeatures.map((f) => (
              <span key={f.id} className="bg-card px-4 py-2 rounded-full text-sm border border-primary/10">{f.name}</span>
            ))}
          </div>
          <Link href="/preise"><Button variant="outline">Alle Preise ansehen</Button></Link>
        </div>
      </section>

      {/* Gemeinsam1 */}
      <section className="py-12 max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-xl font-bold text-primary mb-3">Sadaqa Jariya mit Gemeinsam1</h2>
        <p className="text-muted mb-4">
          Bereite nicht nur deine Dokumente vor, sondern auch das Gute, das nach dir bleiben soll.
        </p>
        <p className="text-sm text-muted">
          AmanahOrdner ist ein digitales Vorsorgeprodukt. Spenden laufen direkt über Gemeinsam1 e.V.
        </p>
        <Link href="/sadaqa-jariya" className="inline-block mt-4"><Button variant="secondary">Sadaqa Jariya entdecken</Button></Link>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12">
        <Disclaimer />
      </section>
    </div>
  );
}
