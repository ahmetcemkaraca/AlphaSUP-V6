import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-alphasup.jpg";
import sunset from "@/assets/tour-sunset.jpg";
import moonlight from "@/assets/tour-moonlight.jpg";
import { Link } from "react-router-dom";

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
        {services.map((s) => (
          <article key={s.id} className="group overflow-hidden rounded-lg border bg-card transition-transform hover:-translate-y-1 hover:shadow-xl">
            <div className="h-44 overflow-hidden">
              <img src={s.img} alt={`${s.title} - AlphaSUP`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-medium">{s.price}</span>
                <Button asChild variant="hero" size="sm">
                  <Link to={`/rezervasyon?service=${s.id}`}>Rezervasyon</Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
