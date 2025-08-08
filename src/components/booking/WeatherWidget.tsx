import { useEffect, useMemo, useState } from "react";

interface WeatherData {
  temperature: number | null;
  windspeed: number | null;
  time: string | null;
}

// Basit, anahtar gerektirmeyen Open-Meteo entegrasyonu (Bodrum koordinatları)
export default function WeatherWidget({ date }: { date?: Date }) {
  const [data, setData] = useState<WeatherData>({ temperature: null, windspeed: null, time: null });
  const [loading, setLoading] = useState(false);

  const targetISO = useMemo(() => {
    const d = date ? new Date(date) : new Date();
    // Öğlen 12:00 verisini hedefleyelim
    d.setHours(12, 0, 0, 0);
    return d.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  }, [date]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=37.034&longitude=27.430&hourly=temperature_2m,windspeed_10m&timezone=auto"
        );
        const json = await res.json();
        const times: string[] = json?.hourly?.time || [];
        const temps: number[] = json?.hourly?.temperature_2m || [];
        const winds: number[] = json?.hourly?.windspeed_10m || [];
        const idx = times.findIndex((t) => t.startsWith(targetISO));
        if (!active) return;
        if (idx !== -1) {
          setData({ temperature: Math.round(temps[idx]), windspeed: Math.round(winds[idx]), time: times[idx] });
        } else {
          setData({ temperature: temps[0] ?? null, windspeed: winds[0] ?? null, time: times[0] ?? null });
        }
      } catch (e) {
        console.error("WeatherWidget error", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [targetISO]);

  return (
    <aside className="rounded-md border bg-card p-4 text-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Hava Durumu (Bodrum)</h4>
        <span className="text-xs text-muted-foreground">Open‑Meteo</span>
      </div>
      {loading ? (
        <p className="mt-2 text-muted-foreground">Yükleniyor…</p>
      ) : (
        <div className="mt-2 flex items-center gap-4">
          <div>
            <div className="text-2xl font-semibold">
              {data.temperature !== null ? `${data.temperature}°C` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">Sıcaklık</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">
              {data.windspeed !== null ? `${data.windspeed} km/s` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">Rüzgar</div>
          </div>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Seçilen tarih/saat için tahmini değerlerdir.</p>
    </aside>
  );
}
