import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useReviews, type Review } from "../lib/api";

function Avatar({ review }: { review: Review }) {
  const initials = review.author
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  if (review.avatar) {
    return (
      <img
        src={review.avatar}
        alt={review.author}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-semibold text-ink">
      {initials || "?"}
    </span>
  );
}

function getReviewsPerSlide(): number {
  if (typeof window === "undefined") return 1;
  if (window.matchMedia("(min-width: 1024px)").matches) return 3;
  if (window.matchMedia("(min-width: 768px)").matches) return 2;
  return 1;
}

export default function ReviewsSection() {
  const { t } = useTranslation();
  const { data: reviews = [], isLoading: loading } = useReviews();
  const [slideIndex, setSlideIndex] = useState(0);
  const [reviewsPerSlide, setReviewsPerSlide] = useState(getReviewsPerSlide);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const tablet = window.matchMedia("(min-width: 768px)");

    const update = () => {
      setReviewsPerSlide(desktop.matches ? 3 : tablet.matches ? 2 : 1);
    };

    update();
    desktop.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    setSlideIndex(0);
  }, [reviews.length, reviewsPerSlide]);

  const slideCount = Math.ceil(reviews.length / reviewsPerSlide);
  const activeSlide = Math.min(slideIndex, Math.max(slideCount - 1, 0));

  const stars = (n: number) => (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= n ? "fill-gold text-gold" : "text-line"}
        />
      ))}
    </span>
  );

  if (loading) return null;

  if (reviews.length === 0) {
    return (
      <section className="bg-sand py-20 md:py-24">
        <div className="container-page">
          <SectionHeading
            title={t("home.testimonials.title")}
            description={t("home.testimonials.description")}
          />
          <div className="mt-10 rounded-xl border border-line bg-white px-6 py-10 text-center">
            <p className="text-sm text-slate">{t("home.reviews.empty")}</p>
            <Link to="/contact" className="btn btn-outline mt-5">
              {t("common.contactUs")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const nextSlide = () => setSlideIndex((activeSlide + 1) % slideCount);
  const prevSlide = () =>
    setSlideIndex((activeSlide - 1 + slideCount) % slideCount);

  const card = (r: Review) => (
    <div className="flex h-full flex-col rounded-xl border border-line bg-white p-6">
      {stars(r.rating)}
      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate">{r.comment}</p>
      <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
        <Avatar review={r} />
        <div>
          <p className="text-[0.8125rem] font-medium text-ink">{r.author}</p>
          {r.created_at && (
            <p className="mt-0.5 text-[0.6875rem] text-muted">
              {new Date(r.created_at).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const slides = Array.from({ length: slideCount }, (_, index) =>
    reviews.slice(
      index * reviewsPerSlide,
      index * reviewsPerSlide + reviewsPerSlide,
    ),
  );

  return (
    <section className="bg-sand py-20 md:py-24">
      <div className="container-page">
        <SectionHeading
          title={t("home.testimonials.title")}
          description={t("home.testimonials.description")}
        />

        <div className="mt-12">
          <div className="relative">
            {slideCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute -left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink"
                  aria-label={t("home.reviews.prev")}
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute -right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink"
                  aria-label={t("home.reviews.next")}
                >
                  <ChevronRight size={17} />
                </button>
              </>
            )}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {slides.map((slide, index) => (
                  <div key={index} className="w-full shrink-0 px-1">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {slide.map((r) => (
                        <div key={r.id}>{card(r)}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {slideCount > 1 && (
            <div className="mt-4 flex justify-center gap-1.5">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSlideIndex(index)}
                  aria-label={t("home.testimonialPage", { number: index + 1 })}
                  aria-current={index === activeSlide}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === activeSlide ? "w-6 bg-ink" : "w-1.5 bg-line"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
