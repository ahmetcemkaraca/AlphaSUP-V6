import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function Admin() {
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Giriş yakında aktif",
      description: "Supabase bağlantısı sonrası personel girişi ve yetkiler etkinleştirilecektir.",
    });
  };

  return (
    <main className="container py-10">
      <SEO title="Yönetici Girişi | AlphaSUP" description="AlphaSUP yönetici paneli girişi" canonical="https://www.alphasup.com/admin" />
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
          <p className="text-xs text-muted-foreground">
            Not: Personel yetkilendirme, rol bazlı erişim ve güvenli oturum açma için Supabase entegrasyonu gerekir.
          </p>
        </form>
      </div>
    </main>
  );
}
