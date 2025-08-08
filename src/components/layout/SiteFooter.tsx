export default function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-10 grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold">AlphaSUP</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ege’nin berrak sularında unutulmaz SUP deneyimleri. Kiralama ve rehberli turlar için hızlı ve güvenli rezervasyon.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Bağlantılar</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/hizmetler" className="hover:underline">Hizmetler</a></li>
            <li><a href="/rezervasyon" className="hover:underline">Rezervasyon</a></li>
            <li><a href="/sss" className="hover:underline">SSS</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">İletişim</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>E-posta: info@alphasup.com</li>
            <li>Telefon: +90 555 555 55 55</li>
            <li>Konum: Bodrum, Muğla</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-4 text-xs text-muted-foreground flex items-center justify-between">
          <p>© {new Date().getFullYear()} AlphaSUP. Tüm hakları saklıdır.</p>
          <a href="/admin" className="hover:underline">Yönetici Girişi</a>
        </div>
      </div>
    </footer>
  );
}
