import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-alphasup.jpg";
import sunset from "@/assets/tour-sunset.jpg";
import moonlight from "@/assets/tour-moonlight.jpg";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
const services = [
  {
    id: "hourly",
    title: "Saatlik Kiralama",
    desc: "Kendi temponuzda keşfedin. Saatlik SUP kiralama seçeneği ile özgürlüğün tadını çıkarın.",
    price: "₺450 / saat",
    img: hero,
  },
  {
    id: "daily",
    title: "Günlük Kiralama",
    desc: "Tüm gün dilediğiniz koyu keşfedin. Malzeme dahil konforlu deneyim.",
    price: "₺1.800 / gün",
    img: hero,
  },
  {
    id: "sunset",
    title: "Gün Batımı Turu",
    desc: "Altın saatlerde büyüleyici bir yolculuk. Rehber eşliğinde güvenli ve keyifli.",
    price: "₺950 / kişi",
    img: sunset,
  },
  {
    id: "moon",
    title: "Ay Işığı Turu",
    desc: "Ay ışığında dingin sularda benzersiz bir deneyim. Sınırlı kontenjan.",
    price: "₺1.100 / kişi",
    img: moonlight,
  },
];

export default function Hizmetler() {
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const next3Days = useMemo(() => {
    const today = new Date();
    return [1, 2, 3].map((i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);
  return (
    <main className="container py-10">
      <SEO
        title="Hizmetler | AlphaSUP"
        description="SUP kiralama ve rehberli turlar: saatlik, günlük, gün batımı ve ay ışığı turları. Hemen keşfedin."
        canonical="https://www.alphasup.com/hizmetler"
      />

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Hizmetler</h1>
      <p className="mt-2 text-muted-foreground">Size en uygun SUP deneyimini seçin.</p>

      <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => {
          const isSelected = selected === s.id;
          const isExpanded = expanded === s.id;
          return (
            <article
              key={s.id}
              className={`group overflow-hidden rounded-lg border bg-card transition-all hover:-translate-y-1 hover:shadow-xl ${isSelected ? "ring-2 ring-primary shadow-[var(--shadow-glow)]" : ""}`}
              onClick={() => setSelected(s.id)}
            >
              <div className="h-44 overflow-hidden">
                <img src={s.img} alt={`${s.title} - AlphaSUP hizmet görseli`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{s.price}</span>
                  <Button variant="hero" size="sm" onClick={(e) => { e.stopPropagation(); setExpanded(isExpanded ? null : s.id); }}>
                    Şimdi Rezerve Et
                  </Button>
                </div>

                {isExpanded && (
                  <div className="mt-4 animate-fade-in rounded-md bg-muted/30 p-3 text-sm">
                    <p>Bu hizmet; deneyim seviyenize uygun, güvenli ve keyifli bir SUP deneyimi sunar.</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {next3Days.map((d) => (
                        <div key={d.toDateString()} className="rounded-md border p-2">
                          <div className="text-xs text-muted-foreground">{d.toLocaleDateString("tr-TR")}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {["10:00", "14:00", "18:00"].map((t) => (
                              <span key={t} className="rounded bg-secondary px-2 py-1 text-xs">{t}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/rezervasyon?service=${s.id}`}>Rezervasyona Devam Et</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
