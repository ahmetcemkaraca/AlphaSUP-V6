import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";

export default function Admin() {
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Giriş yakında aktif",
      description: "Supabase bağlantısı sonrası personel girişi ve yetkiler etkinleştirilecektir.",
    });
  };

  // Fiyat ayarları (demo - yerel durum)
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [day, setDay] = useState<number>(new Date().getDate());
  const [serviceId, setServiceId] = useState<string>("hourly");
  const [price, setPrice] = useState<number>(450);
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const SERVICES = [
    { id: "hourly", name: "Saatlik Kiralama" },
    { id: "daily", name: "Günlük Kiralama" },
    { id: "sunset", name: "Gün Batımı Turu" },
    { id: "moon", name: "Ay Işığı Turu" },
  ];
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 8; h <= 20; h++) slots.push(`${String(h).padStart(2, "0")}:00`);
    return slots;
  }, []);
  type PriceMap = Record<string, { [day: number]: { [serviceId: string]: { price: number; hours: string[] } } }>; // yyyy-mm -> day -> service -> data
  const [data, setData] = useState<PriceMap>({});

  const saveForDay = () => {
    if (selectedHours.length === 0) return toast({ title: "Saat seçilmedi", description: "Lütfen en az bir saat seçin.", variant: "destructive" });
    setData((prev) => ({
      ...prev,
      [month]: {
        ...(prev[month] || {}),
        [day]: {
          ...((prev[month] || {})[day] || {}),
          [serviceId]: { price, hours: selectedHours },
        },
      },
    }));
    toast({ title: "Kaydedildi", description: `${day}.${month.split("-")[1]} için ${selectedHours.length} slot` });
  };
  return (
    <main className="container py-10">
      <SEO title="Yönetici Girişi | AlphaSUP" description="AlphaSUP yönetici paneli girişi" canonical="https://www.alphasup.com/admin" />

      {/* Giriş Kartı */}
      <div className="mx-auto max-w-md rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-semibold">Yönetici Paneli</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bu alan yetkili personel içindir.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">E‑posta</Label>
            <Input id="email" type="email" required className="mt-2" />
          </div>
          <div>
            <Label htmlFor="password">Şifre</Label>
            <Input id="password" type="password" required className="mt-2" />
          </div>
          <Button type="submit" variant="hero" className="w-full">Giriş Yap</Button>
          <p className="text-xs text-muted-foreground">Not: Personel yetkilendirme, rol bazlı erişim ve güvenli oturum açma için Supabase entegrasyonu gerekir.</p>
        </form>
      </div>

      {/* Fiyat Ayarları */}
      <section className="mt-12 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Fiyat Ayarları</h2>
          <span className="text-xs text-muted-foreground">Demo: Veriler tarayıcıda tutulur</span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Sol: Seçimler */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div>
              <Label>Ay</Label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Gün</Label>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {Array.from({ length: new Date(Number(month.split('-')[0]), Number(month.split('-')[1]), 0).getDate() }).map((_, i) => {
                  const d = i + 1;
                  const active = d === day;
                  return (
                    <button key={d} onClick={() => setDay(d)} className={`rounded-md border px-2 py-1 text-sm ${active ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>{d}</button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Hizmet</Label>
              <select className="mt-2 w-full rounded-md border bg-background px-3 py-2" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Saatler</Label>
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((t) => {
                  const checked = selectedHours.includes(t);
                  return (
                    <label key={t} className={`rounded-md border px-2 py-1 text-sm text-center ${checked ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>
                      <input type="checkbox" className="hidden" checked={checked} onChange={(e) => setSelectedHours((prev) => e.target.checked ? [...prev, t] : prev.filter((x) => x !== t))} />
                      {t}
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Fiyat (₺)</Label>
              <Input type="number" min={0} value={price} onChange={(e) => setPrice(parseInt(e.target.value || '0'))} className="mt-2" />
            </div>
            <Button variant="hero" onClick={saveForDay}>Günü Kaydet</Button>
          </div>

          {/* Sağ: Özet */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Seçilen Gün Özeti</h3>
            <div className="mt-3 text-sm">
              {data[month]?.[day] ? (
                <ul className="space-y-2">
                  {Object.entries(data[month][day]).map(([sid, info]) => (
                    <li key={sid} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <strong>{SERVICES.find((s) => s.id === sid)?.name}</strong>
                        <span className="text-muted-foreground">₺{info.price}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {info.hours.map((h) => (
                          <span key={h} className="rounded bg-secondary px-2 py-0.5 text-xs">{h}</span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Henüz kayıt yok.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
