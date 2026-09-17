import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { getDictionary, translateBio, translateServiceName } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";
import { withGenericStaff } from "@/lib/staff-display";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, shopName } from "@/lib/utils";
import type { Barber, Service } from "@/types/database";

const demoBarbers: Barber[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    user_id: null,
    name: "Alex",
    photo_url:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80",
    bio: "Cuts, fades, and clean finishes.",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    user_id: null,
    name: "Chris",
    photo_url:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
    bio: "Beards, trims, and classic shaves.",
    active: true,
    created_at: new Date().toISOString(),
  },
];

const demoServices: Service[] = [
  {
    id: "1",
    name: "Haircut",
    duration_minutes: 30,
    price: 20,
    active: true,
    created_at: "",
  },
  {
    id: "2",
    name: "Haircut + Beard",
    duration_minutes: 45,
    price: 30,
    active: true,
    created_at: "",
  },
  {
    id: "3",
    name: "Beard Trim",
    duration_minutes: 20,
    price: 12,
    active: true,
    created_at: "",
  },
  {
    id: "4",
    name: "Hot Towel Shave",
    duration_minutes: 40,
    price: 25,
    active: true,
    created_at: "",
  },
];

async function getBarbers(): Promise<Barber[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("supabase")) {
    return withGenericStaff(demoBarbers);
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("barbers")
      .select("*")
      .eq("active", true)
      .order("name");
    if (error || !data?.length) return withGenericStaff(demoBarbers);
    return withGenericStaff(data as Barber[]);
  } catch {
    return withGenericStaff(demoBarbers);
  }
}

async function getServices(): Promise<Service[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("supabase")) {
    return demoServices;
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("price");
    if (error || !data?.length) return demoServices;
    return data as Service[];
  } catch {
    return demoServices;
  }
}

export default async function HomePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.home;
  const [barbers, services] = await Promise.all([getBarbers(), getServices()]);
  return (
    <div className="overflow-x-hidden">
      <SiteHeader />

      <section className="relative h-[100svh] max-h-[920px] min-h-[640px] overflow-hidden lg:max-h-[860px] xl:max-h-[820px] 2xl:max-h-[780px]">
        <Image
          src="/banner.jpg"
          alt={t.heroAlt}
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center md:object-[center_42%]"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/30 to-transparent md:via-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent to-60%" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-background/35 via-background/10 to-transparent md:h-44" />
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay grain-overlay" />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:px-8 md:pb-24 lg:pb-28">
          <div className="max-w-3xl md:pl-2">
            <div
              className="mb-7 h-px w-16 origin-left scale-x-0 bg-primary/90 animate-hero-line"
              aria-hidden
            />

            <h1 className="sr-only">{shopName()}</h1>
            <p
              className="animate-fade-up font-display text-[clamp(2.35rem,6.8vw,4.6rem)] font-medium leading-[1.08] tracking-[-0.025em] text-foreground"
              style={{ animationDelay: "90ms" }}
            >
              <span className="block">{t.heroLine1}</span>
              <span className="mt-1 block text-primary/95">{t.heroLine2}</span>
              <span className="mt-4 block max-w-lg text-base font-normal leading-relaxed tracking-normal text-foreground/70 md:mt-5 md:text-lg">
                {t.heroLine3}
              </span>
            </p>

            <div
              className="mt-11 flex animate-fade-up flex-wrap items-center gap-5 md:mt-14 md:gap-8"
              style={{ animationDelay: "240ms" }}
            >
              <Button
                asChild
                size="lg"
                className="h-14 min-w-[13.5rem] px-9 text-[15px] tracking-[0.08em] md:h-[3.75rem] md:min-w-[15.5rem] md:px-11 md:text-[15px]"
              >
                <Link href="/book">{t.bookAppointment}</Link>
              </Button>
              <a
                href="#craft"
                className="group relative inline-flex items-center gap-3 pb-1 text-[15px] tracking-[0.06em] text-foreground/75 transition hover:text-foreground md:text-base"
              >
                {t.exploreCraft}
                <span
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
                <span
                  className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-50 bg-foreground/35 transition duration-300 group-hover:scale-x-100 group-hover:bg-primary/80"
                  aria-hidden
                />
              </a>
            </div>
          </div>
        </div>

        <a
          href="#craft"
          className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 md:block"
          aria-label={t.scroll}
        >
          <span className="block h-11 w-px animate-scroll-cue bg-gradient-to-b from-primary/80 via-primary/35 to-transparent" />
        </a>
      </section>

      <section id="craft" className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 md:grid-cols-2 md:gap-16 md:px-8 md:py-32">
          <div className="animate-fade-up">
            <p className="font-display text-sm tracking-[0.2em] text-primary uppercase">
              {t.craftEyebrow}
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-foreground md:text-5xl lg:text-6xl">
              {t.craftTitle1}
              <br />
              {t.craftTitle2}
            </h2>
            <p className="mt-6 max-w-md text-muted-foreground leading-relaxed">
              {t.craftBody}
            </p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden animate-fade-up md:aspect-[4/5] lg:aspect-[5/6]">
            <Image
              src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80"
              alt={t.craftAlt}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-background/40 to-transparent" />
          </div>
        </div>
      </section>

      <section className="relative h-[42vh] min-h-[280px] overflow-hidden md:h-[48vh] md:min-h-[360px] lg:h-[420px] xl:h-[460px]">
        <Image
          src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=2000&q=85"
          alt={t.atmosphereAlt}
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-background/55" />
        <div className="relative z-10 flex h-full items-end px-5 pb-12 md:px-8 md:pb-16">
          <p className="mx-auto max-w-6xl font-display text-3xl text-foreground md:text-5xl lg:text-6xl">
            {t.atmosphereLine}
          </p>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <div className="max-w-xl">
          <p className="font-display text-sm tracking-[0.2em] text-primary uppercase">
            {t.menuEyebrow}
          </p>
          <h2 className="mt-4 font-display text-4xl md:text-5xl">
            {t.servicesTitle}
          </h2>
          <p className="mt-4 text-muted-foreground">{t.servicesBody}</p>
        </div>
        <ul className="mt-14 divide-y divide-border border-y border-border">
          {services.map((s, i) => (
            <li
              key={s.id}
              className="group flex animate-fade-up flex-wrap items-baseline justify-between gap-4 py-6"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div>
                <p className="font-display text-2xl transition group-hover:text-primary md:text-3xl">
                  {translateServiceName(s.name, locale, dict)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {s.duration_minutes} {t.minutes}
                </p>
              </div>
              <p className="font-display text-2xl text-primary md:text-3xl">
                {formatPrice(s.price)}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <Button asChild size="lg">
            <Link href="/book">{t.chooseService}</Link>
          </Button>
        </div>
      </section>

      <section id="barbers" className="border-t border-border/60 bg-card/20">
        <div className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
          <div className="max-w-xl">
            <p className="font-display text-sm tracking-[0.2em] text-primary uppercase">
              {t.teamEyebrow}
            </p>
            <h2 className="mt-4 font-display text-4xl md:text-5xl">
              {t.teamTitle}
            </h2>
            <p className="mt-4 text-muted-foreground">{t.teamBody}</p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-2 md:gap-10">
            {barbers.map((barber, i) => (
              <article
                key={barber.id}
                className="group animate-fade-up"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="relative aspect-[4/5] overflow-hidden md:aspect-[5/6]">
                  {barber.photo_url && (
                    <Image
                      src={barber.photo_url}
                      alt={barber.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover object-top transition duration-700 group-hover:scale-[1.03]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                    <h3 className="font-display text-3xl md:text-4xl">
                      {barber.name}
                    </h3>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      {translateBio(barber.bio, locale, dict)}
                    </p>
                    <Button asChild className="mt-5" size="sm">
                      <Link href={`/book?barber=${barber.id}`}>
                        {t.bookWith} {barber.name.split(" ")[0]}
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="visit" className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-14 md:grid-cols-2 md:gap-20">
          <div>
            <p className="font-display text-sm tracking-[0.2em] text-primary uppercase">
              {t.visitEyebrow}
            </p>
            <h2 className="mt-4 font-display text-4xl md:text-5xl">
              {t.visitTitle}
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              {t.visitBody}
            </p>
            <dl className="mt-10 space-y-6 text-sm">
              <div>
                <dt className="text-muted-foreground">{t.addressLabel}</dt>
                <dd className="mt-1 font-display text-xl leading-snug text-foreground">
                  <span className="block">{t.addressLine1}</span>
                  <span className="block text-lg text-foreground/80">
                    {t.addressLine2}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t.hoursLabel}</dt>
                <dd className="mt-3 space-y-2.5 text-foreground">
                  {t.hoursSchedule.map((row) => (
                    <div
                      key={row.day}
                      className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border/40 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {row.day}
                      </span>
                      <span className="font-display text-lg text-foreground">
                        {row.time}
                      </span>
                    </div>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t.phoneLabel}</dt>
                <dd className="mt-1 font-display text-xl">
                  <a href="tel:+302310952223" className="hover:text-primary">
                    231 095 2223
                  </a>
                </dd>
              </div>
            </dl>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden md:aspect-auto md:min-h-[480px] lg:min-h-[560px]">
            <Image
              src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1200&q=80"
              alt={t.visitAlt}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border/60">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1800&q=80"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-28">
          <h2 className="max-w-2xl font-display text-4xl leading-tight md:text-6xl">
            {t.ctaTitle}
          </h2>
          <p className="mt-5 max-w-md text-muted-foreground">{t.ctaBody}</p>
          <Button asChild size="lg" className="mt-10">
            <Link href="/book">{t.bookNow}</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
