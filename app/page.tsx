import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { HeroMedia } from "@/components/motion/hero-media";
import { Magnetic } from "@/components/motion/magnetic";
import { Reveal } from "@/components/motion/reveal";
import { ServiceList } from "@/components/motion/service-list";
import { SplitWords } from "@/components/motion/split-words";
import { Spotlight } from "@/components/motion/spotlight";
import { TiltCard } from "@/components/motion/tilt-card";
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

const serviceImages = [
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80",
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80",
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80",
  "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80",
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
    <div className="overflow-x-clip">
      <SiteHeader />

      <section className="relative h-[100svh] max-h-[920px] min-h-[640px] overflow-hidden lg:max-h-[860px] xl:max-h-[820px] 2xl:max-h-[780px]">
        <HeroMedia alt={t.heroAlt} />

        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/30 to-transparent md:via-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent to-60%" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-background/35 via-background/10 to-transparent md:h-44" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 animate-glow bg-[radial-gradient(circle,hsl(var(--primary)/0.18),transparent_70%)] md:h-56 md:w-56" />
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay grain-overlay" />
        <Spotlight />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-5 pb-20 pt-28 md:px-8 md:pb-28 lg:pb-32">
          <div className="max-w-3xl md:pl-2">
            <div
              className="mb-6 h-px w-16 origin-left scale-x-0 bg-primary/90 animate-hero-line"
              aria-hidden
            />

            <h1 className="sr-only">{shopName()}</h1>
            <p className="font-display text-[clamp(2.35rem,6.8vw,4.6rem)] font-medium leading-[1.12] tracking-[-0.025em] text-foreground">
              <SplitWords text={t.heroLine1} className="block" delay={120} />
              <SplitWords
                text={t.heroLine2}
                className="mt-1.5 block"
                wordClassName="gold-text"
                delay={340}
              />
              <span
                className="mt-5 block max-w-lg animate-fade-up text-base font-normal leading-relaxed tracking-normal text-foreground/70 md:mt-6 md:text-lg"
                style={{ animationDelay: "720ms" }}
              >
                {t.heroLine3}
              </span>
            </p>

            <div
              className="mt-9 flex animate-fade-up flex-wrap items-center gap-5 md:mt-11 md:gap-8"
              style={{ animationDelay: "880ms" }}
            >
              <Magnetic>
                <Button
                  asChild
                  size="lg"
                  className="h-14 min-w-[13.5rem] px-9 text-[15px] tracking-[0.08em] md:h-[3.75rem] md:min-w-[15.5rem] md:px-11 md:text-[15px]"
                >
                  <Link href="/book">{t.bookAppointment}</Link>
                </Button>
              </Magnetic>
              <a
                href="#craft"
                className="group relative inline-flex items-center gap-3 pb-1 text-[15px] tracking-[0.06em] text-foreground/75 transition-colors duration-500 ease-soft hover:text-foreground md:text-base"
              >
                {t.exploreCraft}
                <span
                  className="transition-transform duration-500 ease-soft group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
                <span
                  className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-50 bg-foreground/35 transition duration-500 ease-soft group-hover:scale-x-100 group-hover:bg-primary/80"
                  aria-hidden
                />
              </a>
            </div>
          </div>
        </div>

        <a
          href="#craft"
          className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 md:block"
          aria-label={t.scroll}
        >
          <span className="block h-9 w-px animate-scroll-cue bg-gradient-to-b from-primary/80 via-primary/35 to-transparent" />
        </a>
      </section>

      <section id="craft" className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-12 md:gap-10 md:px-8 md:pb-36 md:pt-28 lg:gap-12">
          <Reveal from="left" className="md:col-span-5">
            <p className="font-display text-sm tracking-[0.2em] text-primary uppercase">
              {t.craftEyebrow}
            </p>
            <h2 className="mt-3 font-display text-4xl leading-[1.1] text-foreground md:text-5xl lg:text-6xl">
              <SplitWords text={t.craftTitle1} className="block" />
              <SplitWords text={t.craftTitle2} className="mt-1 block" delay={140} />
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground md:mt-6">
              {t.craftBody}
            </p>
          </Reveal>

          <div className="relative md:col-span-7 md:pl-6 lg:pl-10">
            <Reveal from="right" delay={120}>
              <TiltCard className="img-reveal edge-frame relative aspect-[4/3] md:aspect-[5/4]">
                <Image
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1400&q=85"
                  alt={t.craftAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 55vw"
                  className="img-zoom object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-background/40 to-transparent" />
              </TiltCard>
            </Reveal>

            <Reveal
              from="scale"
              delay={360}
              className="absolute -bottom-12 left-0 hidden w-40 md:block lg:-left-4 lg:w-48"
            >
              <div className="img-reveal relative aspect-[3/4] border border-border/60 shadow-[0_40px_80px_-30px_hsl(0_0%_0%/0.85)]">
                <Image
                  src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=700&q=85"
                  alt=""
                  fill
                  sizes="192px"
                  className="img-zoom object-cover object-center"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="sticky top-0 h-[100svh] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=2000&q=85"
              alt={t.atmosphereAlt}
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-background/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
            <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay grain-overlay" />
          </div>
        </div>

        <div className="relative z-10 pb-10 md:pb-16">
          <div className="mx-auto flex min-h-[40svh] max-w-6xl items-center px-5 py-12 md:min-h-[44svh] md:px-8 md:py-16">
            <div>
              <Reveal from="mask">
                <p className="font-display text-sm tracking-[0.2em] text-primary uppercase">
                  {t.storyEyebrow}
                </p>
              </Reveal>
              <p className="mt-5 max-w-4xl font-display text-3xl leading-[1.15] text-foreground md:mt-6 md:text-5xl lg:text-6xl">
                <SplitWords text={t.atmosphereLine} />
              </p>
            </div>
          </div>

          {t.storyChapters.map((chapter, i) => (
            <div
              key={chapter.index}
              className="mx-auto flex min-h-[28svh] max-w-6xl items-center px-5 py-8 md:min-h-[32svh] md:px-8 md:py-10"
            >
              <Reveal
                from={i % 2 === 0 ? "left" : "right"}
                className={i % 2 === 0 ? "md:mr-auto" : "md:ml-auto"}
              >
                <div className="max-w-md border-l border-primary/40 bg-background/55 p-6 backdrop-blur-md md:p-8">
                  <span className="font-display text-sm tracking-[0.3em] text-primary">
                    {chapter.index}
                  </span>
                  <h3 className="mt-3 font-display text-3xl md:text-4xl">
                    {chapter.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {chapter.body}
                  </p>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      <div className="marquee-wrap overflow-hidden border-y border-border/50 bg-card/20 py-4 md:py-5">
        <div className="marquee gap-10 whitespace-nowrap">
          {[0, 1].map((pass) => (
            <div key={pass} className="flex shrink-0 items-center gap-10 pr-10">
              {services.map((s) => (
                <span
                  key={`${pass}-${s.id}`}
                  className="flex items-center gap-8 font-display text-xl tracking-[0.12em] text-foreground/45 uppercase md:gap-10 md:text-2xl"
                >
                  {translateServiceName(s.name, locale, dict)}
                  <span className="text-primary/70" aria-hidden>
                    ✦
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section id="services" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <Reveal from="up" className="max-w-xl">
          <p className="font-display text-sm tracking-[0.2em] text-primary uppercase">
            {t.menuEyebrow}
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight md:mt-5 md:text-5xl">
            {t.servicesTitle}
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground md:mt-5">
            {t.servicesBody}
          </p>
        </Reveal>
        <div className="mt-12 md:mt-14">
          <ServiceList
            items={services.map((s, i) => ({
              id: s.id,
              name: translateServiceName(s.name, locale, dict),
              meta: `${s.duration_minutes} ${t.minutes}`,
              price: formatPrice(s.price),
              image: serviceImages[i % serviceImages.length],
            }))}
          />
        </div>
        <Reveal delay={160} from="up" className="mt-10 md:mt-12">
          <Magnetic>
            <Button asChild size="lg">
              <Link href="/book">{t.chooseService}</Link>
            </Button>
          </Magnetic>
        </Reveal>
      </section>

      <section id="barbers" className="border-t border-border/60 bg-card/20">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <Reveal className="max-w-xl">
            <p className="font-display text-sm tracking-[0.2em] text-primary uppercase">
              {t.teamEyebrow}
            </p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">
              {t.teamTitle}
            </h2>
            <p className="mt-3 text-muted-foreground md:mt-4">{t.teamBody}</p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:mt-12 md:grid-cols-2 md:gap-8">
            {barbers.map((barber, i) => (
              <Reveal
                key={barber.id}
                delay={i * 110}
                from={i % 2 === 0 ? "left" : "right"}
                className={i % 2 === 1 ? "md:mt-10" : undefined}
              >
                <article className="group">
                  <TiltCard className="img-reveal edge-frame relative aspect-[4/5] md:aspect-[5/6]">
                    {barber.photo_url && (
                      <Image
                        src={barber.photo_url}
                        alt={barber.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 40vw"
                        className="img-zoom object-cover object-top"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 translate-y-1 p-5 transition-transform duration-700 ease-soft group-hover:translate-y-0 md:p-7">
                      <h3 className="font-display text-3xl md:text-4xl">
                        {barber.name}
                      </h3>
                      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {translateBio(barber.bio, locale, dict)}
                      </p>
                      <Button asChild className="mt-4" size="sm">
                        <Link href={`/book?barber=${barber.id}`}>
                          {t.bookWith} {barber.name.split(" ")[0]}
                        </Link>
                      </Button>
                    </div>
                  </TiltCard>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="visit" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
          <Reveal from="left">
            <p className="font-display text-sm tracking-[0.2em] text-primary uppercase">
              {t.visitEyebrow}
            </p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">
              {t.visitTitle}
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              {t.visitBody}
            </p>
            <dl className="mt-8 space-y-5 text-sm md:mt-10 md:space-y-6">
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
                  <a
                    href="tel:+302310952223"
                    className="transition-colors duration-300 hover:text-primary"
                  >
                    231 095 2223
                  </a>
                </dd>
              </div>
            </dl>
          </Reveal>
          <Reveal
            delay={120}
            from="right"
            className="md:sticky md:top-28 md:self-start"
          >
            <div className="img-reveal edge-frame relative aspect-[4/5] lg:aspect-[3/4]">
              <Image
                src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1200&q=80"
                alt={t.visitAlt}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="img-zoom object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
            </div>
          </Reveal>
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
        <Spotlight />
        <Reveal className="relative mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
          <h2 className="max-w-2xl font-display text-4xl leading-tight md:text-6xl">
            <SplitWords text={t.ctaTitle} />
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground md:mt-5">{t.ctaBody}</p>
          <Magnetic className="mt-8 md:mt-10">
            <Button asChild size="lg">
              <Link href="/book">{t.bookNow}</Link>
            </Button>
          </Magnetic>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
