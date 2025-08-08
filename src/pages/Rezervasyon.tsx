import { useMemo, useState } from "react";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WeatherWidget from "@/components/booking/WeatherWidget";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

const SERVICES = [
  { id: "hourly", name: "Saatlik Kiralama", price: 450, duration: "1 saat" },
  { id: "daily", name: "Günlük Kiralama", price: 1800, duration: "1 gün" },
  { id: "sunset", name: "Gün Batımı Turu", price: 950, duration: "2 saat" },
  { id: "moon", name: "Ay Işığı Turu", price: 1100, duration: "2 saat" },
] as const;

const EXTRAS = [
  { id: "vest", name: "Can yeleği (ekstra)", price: 50 },
  { id: "case", name: "Su geçirmez telefon kılıfı", price: 30 },
  { id: "photo", name: "Fotoğraf/Video paketi", price: 120 },
] as const;

type ExtraId = typeof EXTRAS[number]["id"];

type Step = 1 | 2 | 3 | 4;

export default function Rezervasyon() {
  const [params] = useSearchParams();
  const preselect = params.get("service") || undefined;

  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState<string>(preselect || "hourly");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [people, setPeople] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<ExtraId[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [waiverAccepted, setWaiverAccepted] = useState(false);

  const serviceObj = useMemo(() => SERVICES.find((s) => s.id === service)!, [service]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 8; h <= 20; h++) slots.push(`${String(h).padStart(2, "0")}:00`);
    return slots;
  }, []);

  // Basit bir sahte doluluk simülasyonu
  const bookedSlots = useMemo(() => {
    if (!date) return new Set<string>();
    const key = date.toDateString() + service;
    const set = new Set<string>();
    if (key.includes("Mon")) set.add("10:00");
    if (key.includes("Tue")) set.add("18:00");
    if (key.includes("Wed")) set.add("12:00");
    return set;
  }, [date, service]);

  const total = useMemo(() => {
    const base = serviceObj.price * people;
    const extras = selectedExtras.reduce((sum, id) => sum + (EXTRAS.find((e) => e.id === id)?.price || 0), 0);
    const discount = coupon.trim().toUpperCase() === "SUMMER10" ? 0.1 * (base + extras) : 0;
    return Math.max(0, base + extras - discount);
  }, [serviceObj, people, selectedExtras, coupon]);

  const canNext1 = service && date && time;
  const canNext2 = people > 0;
  const canPay = name && email && phone && waiverAccepted;

  const goPay = () => {
    if (!canPay) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen tüm alanları doldurun ve feragat formunu onaylayın.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Ödeme başlatılacak",
      description:
        "Stripe ile güvenli ödeme için Supabase entegrasyonunu etkinleştirdikten sonra buradan yönlendirme yapılacak.",
    });
  };

  return (
    <main className="container py-8">
      <SEO
        title="Rezervasyon | AlphaSUP"
        description="Adım adım kolay rezervasyon: hizmet, tarih-saat, kişi sayısı, iletişim ve güvenli ödeme."
        canonical="https://www.alphasup.com/rezervasyon"
      />

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Rezervasyon</h1>
      <p className="mt-2 text-muted-foreground">Sizi birkaç adımda rezervasyona ulaştıralım.</p>

      {/* Adım göstergesi */}
      <div className="mt-6 grid grid-cols-4 gap-2 text-xs">
        {["Hizmet & Tarih", "Kişi & Ekstralar", "İletişim", "Özet & Ödeme"].map((t, i) => (
          <div key={t} className={`rounded-full px-3 py-2 text-center ${i + 1 <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{t}</div>
        ))}
      </div>

      {/* Adım 1 */}
      {step === 1 && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div>
              <Label htmlFor="service">Hizmet</Label>
              <select
                id="service"
                className="mt-2 w-full rounded-md border bg-background px-3 py-2"
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — ₺{s.price}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Tarih</Label>
              <div className="mt-2">
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
              </div>
            </div>

            <div>
              <Label>Saat</Label>
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {timeSlots.map((t) => {
                  const disabled = bookedSlots.has(t);
                  const active = t === time;
                  return (
                    <button
                      key={t}
                      disabled={disabled}
                      onClick={() => setTime(t)}
                      className={`rounded-md border px-3 py-2 text-sm transition ${active ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <WeatherWidget date={date} />
            <div className="rounded-md border p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Seçili hizmet</span>
                <strong>{SERVICES.find((s) => s.id === service)?.name}</strong>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Temel ücret</span>
                <strong>₺{SERVICES.find((s) => s.id === service)?.price}</strong>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Adım 2 */}
      {step === 2 && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div>
              <Label htmlFor="people">Kişi Sayısı</Label>
              <Input id="people" type="number" min={1} value={people} onChange={(e) => setPeople(parseInt(e.target.value || "1"))} className="mt-2 w-32" />
            </div>

            <div>
              <Label>Ekstralar</Label>
              <div className="mt-2 grid gap-3">
                {EXTRAS.map((ex) => {
                  const checked = selectedExtras.includes(ex.id);
                  return (
                    <label key={ex.id} className="flex items-center justify-between rounded-md border p-3">
                      <span>{ex.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">₺{ex.price}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setSelectedExtras((prev) =>
                              e.target.checked ? [...prev, ex.id] : prev.filter((i) => i !== ex.id)
                            )
                          }
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="coupon">İndirim Kodu</Label>
              <div className="mt-2 flex gap-2">
                <Input id="coupon" placeholder="Örn: SUMMER10" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                <Button type="button" variant="outline" onClick={() => toast({ title: "Kupon uygulandı", description: coupon || "Kod boş" })}>Uygula</Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Not: Örnek amaçlı SUMMER10 kodu %10 indirim uygular.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-md border p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Ara toplam</span>
                <strong>₺{total}</strong>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Adım 3 */}
      {step === 3 && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Ad Soyad</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="email">E‑posta</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2" />
              </div>
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={waiverAccepted} onChange={(e) => setWaiverAccepted(e.target.checked)} />
              <span>
                Sorumluluk feragatnamesini okudum ve onaylıyorum. <a className="underline" href="#" onClick={(e) => { e.preventDefault(); alert("Bu bir örnek feragat metnidir. Supabase ile dijital imza saklama etkinleştirildiğinde burada onay süreci tamamlanacaktır."); }}>Metni görüntüle</a>
              </span>
            </label>
          </div>
          <div className="space-y-4">
            <div className="rounded-md border p-4 text-sm">
              <div className="flex items-center justify-between"><span>Toplam</span><strong>₺{total}</strong></div>
              <p className="mt-2 text-xs text-muted-foreground">Ödeme bir sonraki adımda Stripe ile güvenle alınacaktır.</p>
            </div>
          </div>
        </section>
      )}

      {/* Adım 4 */}
      {step === 4 && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Özet</h2>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Hizmet: <strong className="text-foreground">{serviceObj.name}</strong></li>
              <li>Tarih: <strong className="text-foreground">{date?.toLocaleDateString()}</strong></li>
              <li>Saat: <strong className="text-foreground">{time}</strong></li>
              <li>Kişi: <strong className="text-foreground">{people}</strong></li>
              <li>Ekstralar: <strong className="text-foreground">{selectedExtras.length ? selectedExtras.join(", ") : "—"}</strong></li>
            </ul>
          </div>
          <div className="space-y-4">
            <div className="rounded-md border p-4 text-sm">
              <div className="flex items-center justify-between"><span>Ödenecek</span><strong>₺{total}</strong></div>
            </div>
          </div>
        </section>
      )}

      {/* Alt aksiyonlar */}
      <div className="mt-8 flex flex-wrap gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)}>Geri</Button>
        )}
        {step < 4 && (
          <Button
            variant="hero"
            onClick={() => {
              if (step === 1 && !canNext1) return toast({ title: "Devam edilemiyor", description: "Lütfen hizmet, tarih ve saat seçin.", variant: "destructive" });
              if (step === 2 && !canNext2) return toast({ title: "Devam edilemiyor", description: "Lütfen kişi sayısını belirtin.", variant: "destructive" });
              setStep((s) => (s + 1) as Step);
            }}
          >
            Devam
          </Button>
        )}
        {step === 4 && (
          <Button variant="hero" onClick={goPay}>Ödeme Yap</Button>
        )}
      </div>
    </main>
  );
}
