import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-alphasup.jpg";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <main>
      <SEO
        title="AlphaSUP | SUP Kiralama ve Turlar"
        description="SUP kiralama, gün batımı ve ay ışığı turları. Hızlı rezervasyon, güvenli ödeme, mobil uyumlu deneyim."
        canonical="https://www.alphasup.com/"
      />

      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <img src={hero} alt="AlphaSUP kahraman görseli" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
        </div>
        <div className="container min-h-[70vh] flex flex-col items-start justify-center py-16">
          <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">Bodrum • Muğla</span>
          <h1 className="mt-4 max-w-2xl text-4xl md:text-5xl font-bold tracking-tight">
            Dingin sularda unutulmaz Stand-Up Paddle deneyimi
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            AlphaSUP ile saatlik/günlük kiralama ve rehberli turlara hemen katılın. Hızlı, güvenli ve mobil uyumlu rezervasyon.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/rezervasyon">Hemen Rezervasyon</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/hizmetler">Hizmetleri Keşfet</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <h2 className="text-2xl font-semibold">Neden AlphaSUP?</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[{
            title: "Güvenli & Rehberli",
            desc: "Profesyonel ekip ve güvenlik ekipmanları ile her seviyeye uygun.",
          }, {
            title: "Hızlı Rezervasyon",
            desc: "Sadece birkaç adımda mobil uyumlu rezervasyon deneyimi.",
          }, {
            title: "Esnek İptal",
            desc: "Olumsuz hava koşullarında ücretsiz erteleme veya iptal.",
          }].map((f) => (
            <article key={f.title} className="rounded-lg border bg-card p-6 transition hover:shadow-lg">
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-16">
        <h2 className="text-2xl font-semibold">Misafir Yorumları</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {[{
            name: "Ela K.",
            text: "Gün batımı turu harikaydı! Rehberimiz çok ilgiliydi.",
          },{
            name: "Mert D.",
            text: "İlk kez denedim, ekipmanlar çok temiz ve güvenliydi.",
          }].map((r) => (
            <blockquote key={r.name} className="rounded-lg border bg-card p-6 shadow-sm">
              <p className="text-sm">“{r.text}”</p>
              <footer className="mt-3 text-xs text-muted-foreground">— {r.name}</footer>
            </blockquote>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Index;
