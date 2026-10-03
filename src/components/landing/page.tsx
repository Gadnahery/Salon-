import { LandingSmoothScroll } from "@/components/landing/smooth-scroll";
import { ThemePortal } from "@/components/theme-portal";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  Bell,
  MapPin,
  Menu,
  Phone,
  Sparkles,
  Users,
  X,
  Instagram,
} from "lucide-react";
import { GallerySlideshow } from "./gallery-slideshow";
import { Button } from "@/components/ui/button";
import { LogoWord } from "@/components/salon/logo";
import { Photo } from "@/components/salon/photo";
import { Stars } from "@/components/salon/stars";
import { SALON, reviews, services } from "@/lib/salon/data";
import { categoryLabel, CATEGORY_ORDER } from "@/lib/salon/category-labels";
import { formatDuration, formatPriceRange } from "@/lib/salon/format";
import { cn } from "@/lib/utils";

const nav = [
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#gallery", label: "Gallery" },
  { href: "#reviews", label: "Reviews" },
  { href: "#location", label: "Location" },
];

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [category, setCategory] = useState<"all" | "hair" | "nails" | "makeup" | "treatments">("all");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const featured = services.filter((s) => s.popular);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <ThemePortal portal="public" />
      <LandingSmoothScroll />
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,color] duration-300",
          scrolled ? "glass-nav shadow-soft" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
          <a href="#top">
            <LogoWord light={!scrolled} />
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className={cn(
                  "text-support transition-colors duration-150",
                  scrolled ? "text-muted hover:text-ink" : "text-surface/80 hover:text-surface",
                )}
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/app/services" className="hidden md:block">
              <Button size="md" variant={scrolled ? "primary" : "inverse"} className={scrolled ? "h-12 bg-ink text-white" : "h-12"}>
                Book Appointment
              </Button>
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              className={cn(
                "flex size-11 items-center justify-center rounded-full md:hidden",
                scrolled ? "text-ink" : "text-surface",
              )}
              onClick={() => setMenu(true)}
            >
              <Menu className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 bg-bg px-6 py-6 md:hidden">
          <div className="flex items-center justify-between">
            <LogoWord />
            <button
              type="button"
              aria-label="Close menu"
              className="flex size-11 items-center justify-center"
              onClick={() => setMenu(false)}
            >
              <X className="size-5" strokeWidth={1.75} />
            </button>
          </div>
          <nav className="mt-12 flex flex-col gap-6">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenu(false)}
                className="font-display text-3xl font-normal tracking-tight"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <Link to="/app/services" className="mt-10 block" onClick={() => setMenu(false)}>
            <Button className="h-14 w-full bg-ink text-white">Book Appointment</Button>
          </Link>
          <Link
            to="/enter"
            search={{ as: "customer" }}
            className="mt-3 block"
            onClick={() => setMenu(false)}
          >
            <Button variant="secondary" className="h-14 w-full">
              Customer sign in
            </Button>
          </Link>
          <Link to="/enter" className="mt-4 block text-center text-support text-muted" onClick={() => setMenu(false)}>
            Staff & Admin
          </Link>
        </div>
      )}

      <section id="top" className="relative min-h-dvh">
        <div className="absolute inset-0 overflow-hidden">
          <div data-parallax className="absolute inset-[-8%] size-[116%]">
            <Photo
              src="/images/hero.jpg"
              alt="Warembo Village interior"
              className="size-full"
              priority
            />
          </div>
        </div>
        <div className="hero-scrim absolute inset-0" />
        <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col justify-end px-5 pb-20 pt-32 md:px-8 md:pb-24">
          <p
            className="animate-fade-up text-micro uppercase tracking-[0.22em] text-surface/80"
            style={{ animationDelay: "40ms" }}
          >
            Beauty · Care · Confidence
          </p>
          <h1
            className="animate-fade-up mt-4 max-w-xl font-display text-hero font-normal text-surface"
            style={{ animationDelay: "120ms" }}
          >
            More than Beauty.
          </h1>
          <p
            className="animate-fade-up mt-3 font-script text-2xl text-surface/90 md:text-3xl"
            style={{ animationDelay: "160ms" }}
          >
            It&apos;s a lifestyle.
          </p>
          <p
            className="animate-fade-up mt-5 max-w-md text-body text-surface/80"
            style={{ animationDelay: "200ms" }}
          >
            Hair Clinic, Hair Salon, Makeup Studio &amp; Nails Spa in Madale, Mivumoni — book in a few taps.
          </p>
          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "280ms" }}
          >
            <Link to="/app/services">
              <Button variant="inverse" className="h-14 px-7">
                Book an appointment
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </Button>
            </Link>
            <a href="#services">
              <Button variant="quiet" className="h-14 border border-surface/30 px-6">
                Explore services
              </Button>
            </a>
          </div>
          <div
            className="animate-fade-up mt-10 flex items-center gap-3 text-surface"
            style={{ animationDelay: "360ms" }}
          >
            <Stars value={5} light />
            <span className="text-support text-surface/80">4.9 · Madale, Mivumoni · Dar es Salaam</span>
          </div>
        </div>
      </section>

      <section id="services" data-reveal className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <p className="text-micro uppercase tracking-[0.18em] text-muted">Four houses of beauty</p>
        <h2 className="mt-3 font-display text-title font-normal tracking-tight">Find your next look.</h2>
        <p className="mt-3 max-w-lg text-body text-muted">
          Hair Clinic, Hair Salon, Makeup Studio and Nails Spa — choose a service that fits you.
        </p>
        <div className="mt-8 flex gap-2 overflow-x-auto hide-scroll">
          {(["all", "hair", "nails", "makeup", "treatments"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-support capitalize transition-colors duration-150",
                category === c ? "bg-ink text-white" : "border border-line bg-transparent text-ink",
              )}
            >
              {c === "all" ? "All" : categoryLabel(c)}
            </button>
          ))}
        </div>
        <div className="mt-10 flex gap-5 overflow-x-auto pb-4 hide-scroll md:grid md:grid-cols-3 md:overflow-visible">
          {featured
            .filter((s) => category === "all" || s.category === category)
            .map((s) => (
              <Link
                key={s.id}
                to="/app/services/$serviceId"
                params={{ serviceId: s.id }}
                className="group w-72 shrink-0 md:w-auto"
              >
                <div className="overflow-hidden rounded-[28px] shadow-soft">
                  <Photo
                    src={s.image}
                    alt={s.name}
                    position={s.imagePosition}
                    className="aspect-4/5 w-full"
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-4 text-body font-medium">{s.name}</p>
                <p className="mt-1 text-support text-muted">
                  {formatPriceRange(s.priceMin, s.priceMax)}
                  <span className="mx-2 text-line">·</span>
                  {formatDuration(s.durationMin, s.durationMax)}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-support text-ink">
                  Explore <ArrowRight className="size-3.5" strokeWidth={1.75} />
                </span>
              </Link>
            ))}
        </div>
      </section>

      <section data-reveal className="bg-surface">
        <div className="mx-auto grid max-w-6xl items-stretch gap-0 md:grid-cols-2">
          <Photo
            src="/images/sig-braiding.jpg"
            alt="Hair styling at Warembo Village"
            className="min-h-80 md:min-h-[36rem]"
          />
          <div className="flex flex-col justify-center px-5 py-16 md:px-16">
            <p className="text-micro uppercase tracking-[0.18em] text-muted">Signature experience</p>
            <h2 className="mt-3 font-display text-title font-normal">Hair that feels like you.</h2>
            <p className="mt-5 max-w-md text-body text-muted">
              Protective styles, unhurried hands, and a finish built around how you actually live. Amina and
              Sarah take the time the work deserves.
            </p>
            <Link to="/app/services" search={{ category: "hair" }} className="mt-8 inline-flex items-center gap-2 text-body">
              Explore hair services
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <p data-reveal className="text-micro uppercase tracking-[0.18em] text-muted">Why Warembo</p>
        <h2 className="mt-3 max-w-md font-display text-title font-normal">More than an appointment.</h2>
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
          {[
            { icon: Users, title: "Experienced stylists", body: "Professionals who understand your style." },
            { icon: CalendarCheck, title: "Easy booking", body: "Choose your service, stylist and time in minutes." },
            { icon: Bell, title: "Thoughtful reminders", body: "We'll let you know when it's time to come in." },
            { icon: Sparkles, title: "Simple payments", body: "Convenient mobile money when you're ready to book." },
          ].map((f) => (
            <div key={f.title} className="lg:px-6 first:lg:pl-0 last:lg:pr-0">
              <f.icon className="size-5 text-ink" strokeWidth={1.75} />
              <h3 className="mt-5 text-section font-normal">{f.title}</h3>
              <p className="mt-2 text-body text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="gallery" className="bg-surface px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-micro uppercase tracking-[0.18em] text-muted">The work</p>
          <h2 className="mt-3 font-display text-title font-normal">
            Real work.
            <br />
            Real results.
          </h2>
          <p className="mt-3 max-w-md text-body text-muted">A quiet look through the studio. The slideshow plays on its own.</p>
          <div className="mt-12">
            <GallerySlideshow />
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:px-8 md:py-28">
        <Photo src="/images/gallery-interior.jpg" alt="The salon floor" className="h-80 rounded-[24px] md:h-[30rem]" />
        <div>
          <p className="text-micro uppercase tracking-[0.18em] text-muted">Our story</p>
          <h2 className="mt-3 font-display text-title font-normal">
            Your salon.
            <br />
            Your space.
          </h2>
          <p className="mt-6 max-w-md text-body text-muted">
            Warembo Village is a beauty destination in Madale, Mivumoni. We built it for unhurried work — hair, nails, makeup —
            Nails Spa, Makeup Studio, and Hair Clinic — with the same care we would want for ourselves.
          </p>
          <Link to="/app" className="mt-8 inline-flex items-center gap-2 text-body">
            Meet the team
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </Link>
        </div>
      </section>

      <section id="reviews" className="bg-surface px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-micro uppercase tracking-[0.18em] text-muted">Client love</p>
          <h2 className="mt-3 font-display text-title font-normal">Loved by our clients.</h2>
          <blockquote className="mt-12 max-w-3xl">
            <Stars />
            <p className="mt-5 font-display text-title font-normal tracking-tight text-ink">
              “{reviews[0].quote}”
            </p>
            <footer className="mt-4 text-support text-muted">
              {reviews[0].name} · {reviews[0].service}
            </footer>
          </blockquote>
          <div className="mt-12 flex gap-4 overflow-x-auto pb-2 hide-scroll">
            {reviews.slice(1).map((r) => (
              <figure key={r.id} className="w-72 shrink-0 border-t border-line pt-6">
                <Stars />
                <blockquote className="mt-4 text-body text-ink">“{r.quote}”</blockquote>
                <figcaption className="mt-4 text-support text-muted">
                  {r.name} · {r.service}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="location" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <p className="text-micro uppercase tracking-[0.18em] text-muted">Location</p>
        <h2 className="mt-3 font-display text-title font-normal">Come see us.</h2>
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-section font-normal">{SALON.name}</p>
            <p className="mt-2 text-body text-muted">
              {SALON.addressLine1}
              <br />
              {SALON.addressLine2}
            </p>
            <p className="mt-8 text-micro uppercase tracking-[0.16em] text-muted">Opening hours</p>
            <p className="mt-2 text-body">
              Mon–Sat
              <br />
              {SALON.hoursShort}
            </p>
            <p className="mt-1 text-body text-muted">Sunday · Closed</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={SALON.mapsApp} target="_blank" rel="noreferrer">
                <Button variant="primary" size="md" className="h-12">
                  <MapPin className="size-4" strokeWidth={1.75} />
                  Get directions
                </Button>
              </a>
              <a href={SALON.phoneHref}>
                <Button variant="secondary" size="md" className="h-12">
                  <Phone className="size-4" strokeWidth={1.75} />
                  Call salon
                </Button>
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-line bg-brand-soft">
            <iframe
              title="Map of Warembo Village"
              src={SALON.mapEmbed}
              className="h-72 w-full md:h-96 grayscale"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <Photo src="/images/cta.jpg" alt="" className="absolute inset-0 size-full min-h-[28rem]" />
        <div className="cta-scrim absolute inset-0" />
        <div className="relative mx-auto flex min-h-[28rem] max-w-6xl flex-col items-center justify-center px-5 py-24 text-center md:px-8 md:py-32">
          <p className="text-micro uppercase tracking-[0.22em] text-surface/80">Ready when you are.</p>
          <h2 className="mt-4 font-display text-hero font-normal text-surface">Your next look is waiting.</h2>
          <p className="mx-auto mt-5 max-w-md text-body text-surface/75">
            Choose your service, pick your time, and you're done.
          </p>
          <Link to="/app/services" className="mt-10 inline-block">
            <Button variant="inverse" className="h-14 px-8">
              Book an appointment
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-line bg-bg">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-start md:justify-between md:px-8">
          <div>
            <LogoWord />
            <p className="mt-3 text-support text-muted">
              {SALON.addressLine1}, {SALON.addressLine2}
            </p>
            <p className="mt-1 text-support text-muted">{SALON.phone}</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-support text-muted">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-ink">
                {n.label}
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-5 text-support text-muted">
            <a href={SALON.instagram} className="inline-flex items-center gap-2 hover:text-ink">
              <Instagram className="size-4" strokeWidth={1.75} />
              Instagram
            </a>
            <a href={SALON.whatsapp} className="hover:text-ink">
              WhatsApp
            </a>
            <a href={SALON.facebook} className="hover:text-ink">
              Facebook
            </a>
            <a href={SALON.tiktok} className="hover:text-ink">
              TikTok
            </a>
          </div>
        </div>
          <div className="mx-auto max-w-6xl px-5 pb-10 text-support text-muted md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>© 2026 Warembo Village</span>
            <span className="flex flex-wrap gap-4">
              <Link to="/enter" search={{ as: "customer" }} className="hover:text-ink">
                Customer sign in
              </Link>
              <Link to="/enter" search={{ as: "staff" }} className="hover:text-ink">
                Staff
              </Link>
              <Link to="/enter" search={{ as: "admin" }} className="hover:text-ink">
                Admin
              </Link>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
