import { useMemo, useState } from "react";
import { createReservation } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function Rezervasyon() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const preselect = params.get("service") || undefined;

  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState<string>(preselect || "hourly");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [people, setPeople] = useState(1);
  const [boardType, setBoardType] = useState<string>("allround-10");
  const [selectedExtras, setSelectedExtras] = useState<ExtraId[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authChoiceOpen, setAuthChoiceOpen] = useState(false);

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

  const canNext1 = Boolean(service);
  const canNext2 = Boolean(date && time);
  const canNext3 = people > 0 && Boolean(boardType);
  const canNext4 = termsAccepted;
  const canPay = name && email && phone;

  const goPay = async () => {
    if (!canPay) {
      toast({ title: "Eksik bilgi", description: "Lütfen müşteri bilgilerini doldurun.", variant: "destructive" });
      return;
    }
    try {
      const id = await createReservation({
        serviceId: service,
        dateISO: date ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        time: time || "",
        people,
        boardType,
        extras: selectedExtras,
        totalTRY: total,
        customer: { name, email, phone },
        coupon: coupon || undefined,
        termsAccepted,
        userUid: auth.currentUser?.uid ?? null,
      });
      toast({ title: "Rezervasyon oluşturuldu", description: `ID: ${id}` });
      setStep(6);
    } catch (err: any) {
      toast({ title: "Rezervasyon başarısız", description: err?.message || String(err), variant: "destructive" });
    }
  };

  return (
    <main className="container py-8">
      <SEO
        title="Rezervasyon | AlphaSUP"
        description="Adım adım kolay rezervasyon: hizmet, tarih-saat, ekipman ve ödeme."
        canonical="https://www.alphasup.com/rezervasyon"
      />

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Rezervasyon</h1>
      <p className="mt-2 text-muted-foreground">Sizi birkaç adımda rezervasyona ulaştıralım.</p>

      {/* Adım göstergesi */}
      <div className="mt-6 grid grid-cols-6 gap-2 text-xs">
        {[
          "Hizmet Seçimi",
          "Tarih & Saat",
          "Board & Ek Hizmetler",
          "Şartlar ve Koşullar",
          "Müşteri Bilgileri",
          "Ödeme",
        ].map((t, i) => (
          <div key={t} className={`rounded-full px-3 py-2 text-center ${i + 1 <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{t}</div>
        ))}
      </div>

      {/* Adım 1: Hizmet Seçimi */}
      {step === 1 && (
        <section className="mt-8">
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
        </section>
      )}

      {/* Adım 2: Tarih & Saat */}
      {step === 2 && (
        <section className="mt-8 space-y-6">
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
        </section>
      )}

      {/* Adım 3: Board & Ek Hizmetler */}
      {step === 3 && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div>
              <Label htmlFor="people">Kişi Sayısı</Label>
              <Input id="people" type="number" min={1} value={people} onChange={(e) => setPeople(parseInt(e.target.value || "1"))} className="mt-2 w-32" />
            </div>
            <div>
              <Label>Board Tipi</Label>
              <RadioGroup value={boardType} onValueChange={setBoardType} className="mt-2 grid gap-3 sm:grid-cols-3">
                {[
                  { id: "allround-10", label: "All‑round 10'" },
                  { id: "touring-12", label: "Touring 12'" },
                  { id: "race-14", label: "Race 14'" },
                ].map((b) => (
                  <label key={b.id} className="flex items-center gap-3 rounded-md border p-3">
                    <RadioGroupItem value={b.id} id={b.id} />
                    <span className="text-sm">{b.label}</span>
                  </label>
                ))}
              </RadioGroup>
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

      {/* Adım 4: Şartlar ve Koşullar */}
      {step === 4 && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-md border p-4 text-sm max-h-60 overflow-auto">
              <h2 className="text-lg font-semibold">Şartlar ve Koşullar</h2>
              <p className="mt-2 text-muted-foreground text-sm">Bu bir örnek metindir. Supabase ile dijital imza saklama etkinleştirildiğinde burada onay süreci tamamlanacaktır.</p>
              <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Emniyet kurallarına uyulacaktır.</li>
                <li>Hava ve deniz koşullarına göre program değişebilir.</li>
                <li>Ekipmanlar hasarsız teslim edilecektir.</li>
              </ul>
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              <span>Şartlar ve koşulları okudum ve kabul ediyorum.</span>
            </label>
          </div>
          <div className="space-y-4">
            <div className="rounded-md border p-4 text-sm">
              <div className="flex items-center justify-between"><span>Toplam</span><strong>₺{total}</strong></div>
            </div>
          </div>
        </section>
      )}

      {/* Adım 5: Müşteri Bilgileri */}
      {step === 5 && (
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
          </div>
          <div className="space-y-4">
            <div className="rounded-md border p-4 text-sm">
              <div className="flex items-center justify-between"><span>Toplam</span><strong>₺{total}</strong></div>
            </div>
          </div>
        </section>
      )}

      {/* Adım 6: Ödeme */}
      {step === 6 && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Özet</h2>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Hizmet: <strong className="text-foreground">{serviceObj.name}</strong></li>
              <li>Tarih: <strong className="text-foreground">{date?.toLocaleDateString()}</strong></li>
              <li>Saat: <strong className="text-foreground">{time}</strong></li>
              <li>Kişi: <strong className="text-foreground">{people}</strong></li>
              <li>Board: <strong className="text-foreground">{boardType}</strong></li>
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
        {step < 6 && (
          <Button
            variant="hero"
            onClick={() => {
              if (step === 1 && !canNext1) return toast({ title: "Devam edilemiyor", description: "Lütfen bir hizmet seçin.", variant: "destructive" });
              if (step === 2 && !canNext2) return toast({ title: "Devam edilemiyor", description: "Lütfen tarih ve saat seçin.", variant: "destructive" });
              if (step === 2 && canNext2) return setAuthChoiceOpen(true);
              if (step === 3 && !canNext3) return toast({ title: "Devam edilemiyor", description: "Lütfen kişi sayısı ve board tipini seçin.", variant: "destructive" });
              if (step === 4 && !canNext4) return toast({ title: "Devam edilemiyor", description: "Lütfen şartları kabul edin.", variant: "destructive" });
              setStep((s) => (s + 1) as Step);
            }}
          >
            Devam
          </Button>
        )}
        {step === 6 && (
          <Button variant="hero" onClick={goPay}>Ödeme Yap</Button>
        )}
      </div>

      {/* Giriş mi, Üyeliksiz mi? */}
      <Dialog open={authChoiceOpen} onOpenChange={setAuthChoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nasıl devam etmek istersiniz?</DialogTitle>
            <DialogDescription>Giriş yaparsanız geçmiş rezervasyonlarınıza erişebilirsiniz. Üyeliksiz de devam edebilirsiniz.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setAuthChoiceOpen(false); navigate(`/giris?redirect=/rezervasyon`); }}>Giriş Yap</Button>
            <Button variant="hero" onClick={() => { setAuthChoiceOpen(false); setStep(3); }}>Üyeliksiz Devam Et</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
