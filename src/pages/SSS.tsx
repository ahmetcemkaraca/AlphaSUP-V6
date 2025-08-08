import { SEO } from "@/components/seo/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function SSS() {
  return (
    <main className="container py-10">
      <SEO title="Sıkça Sorulan Sorular | AlphaSUP" description="Rezervasyon, ödeme, iptal ve güvenlik ile ilgili en sık sorulan sorular." canonical="https://www.alphasup.com/sss" />
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Sıkça Sorulan Sorular</h1>
      <p className="mt-2 text-muted-foreground">Akıllınızdaki soruların yanıtları burada.</p>

      <section className="mt-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Hangi ödeme yöntemlerini kabul ediyorsunuz?</AccordionTrigger>
            <AccordionContent>
              Tüm kredi/debit kartları ile Stripe üzerinden güvenli ödeme alıyoruz.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Hava koşulları kötü olursa ne olur?</AccordionTrigger>
            <AccordionContent>
              Güvenlik önceliğimizdir. Uygun olmayan hava durumlarında ücretsiz erteleme veya iptal sunarız.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Rezervasyonumu nasıl iptal edebilirim?</AccordionTrigger>
            <AccordionContent>
              Rezervasyon onay e-postasındaki bağlantıyı kullanabilir veya bizimle iletişime geçebilirsiniz.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </main>
  );
}
