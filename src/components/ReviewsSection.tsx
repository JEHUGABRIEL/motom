import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeading from "./SectionHeading";

type Review = {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  comment: string;
  created_at?: string;
};

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

export default function ReviewsSection() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((rows) => setReviews(Array.isArray(rows) ? rows : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

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

  const nextSlide = () => setSlideIndex((i) => (i + 1) % reviews.length);
  const prevSlide = () => setSlideIndex((i) => (i - 1 + reviews.length) % reviews.length);

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

  return (
    <section className="bg-sand py-20 md:py-24">
      <div className="container-page">
        <SectionHeading
          title={t("home.testimonials.title")}
          description={t("home.testimonials.description")}
        />

        <div className="mt-12 hidden grid-cols-3 gap-6 lg:grid">
          {reviews.slice(0, 6).map((r) => (
            <div key={r.id}>{card(r)}</div>
          ))}
        </div>

        <div className="mt-10 lg:hidden">
          <div className="relative">
            {reviews.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute -left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink"
                  aria-label={t("home.reviews.prev")}
                >
                  <ChevronLeft size={17} />
                </button>
                <button
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
                style={{ transform: `translateX(-${slideIndex * 100}%)` }}
              >
                {reviews.map((r) => (
                  <div key={r.id} className="w-full shrink-0 px-1">
                    {card(r)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-1.5">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === slideIndex ? "w-6 bg-ink" : "w-1.5 bg-line"
                }`}
                aria-label={t("home.goToProperty", { number: i + 1 })}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
