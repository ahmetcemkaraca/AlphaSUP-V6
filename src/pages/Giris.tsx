import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import { emailPasswordSignIn } from "@/lib/api";

const SERVICES = [
  { id: "hourly", name: "Saatlik Kiralama" },
  { id: "daily", name: "Günlük Kiralama" },
  { id: "sunset", name: "Gün Batımı Turu" },
  { id: "moon", name: "Ay Işığı Turu" },
] as const;

export default function Giris() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await emailPasswordSignIn(email, password);
      toast({ title: "Giriş başarılı" });
      window.history.length > 1 ? window.history.back() : (window.location.href = "/");
    } catch (err: any) {
      toast({ title: "Giriş başarısız", description: err?.message || String(err), variant: "destructive" });
    }
  };

  return (
    <main className="container py-10">
      <SEO title="Giriş | AlphaSUP" description="Hesabınıza giriş yapın veya üyeliksiz devam edin." canonical="https://www.alphasup.com/giris" />

      <div className="mx-auto max-w-md rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-semibold">Giriş Yap</h1>
        <p className="mt-1 text-sm text-muted-foreground">Üyelik avantajları: hızlı ödeme, geçmiş rezervasyonlar ve daha fazlası.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">E‑posta</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="password">Şifre</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" />
          </div>
          <Button type="submit" variant="hero" className="w-full">Giriş Yap</Button>
          <p className="text-xs text-muted-foreground">Firebase Auth ile e‑posta/şifre girişi aktiftir.</p>
          <div className="mt-4 text-center">
            <a className="story-link" href="/rezervasyon">Üyeliksiz devam et</a>
          </div>
        </form>
      </div>
    </main>
  );
}
