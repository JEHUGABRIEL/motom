import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
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
        className="w-12 h-12 rounded-full object-cover ring-2 ring-gold/40 shrink-0"
        loading="lazy"
      />
    );
  }
  return (
    <span className="w-12 h-12 rounded-full bg-navy text-gold font-semibold text-sm flex items-center justify-center ring-2 ring-gold/40 shrink-0">
      {initials || "?"}
    </span>
  );
}


export default function ReviewsSection() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  const load = () => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((rows) => setReviews(Array.isArray(rows) ? rows : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const stars = (n: number, big = false) => (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={big ? 16 : 14}
          className={i <= n ? "text-gold fill-gold" : "text-navy/15"}
        />
      ))}
    </span>
  );

  const nextSlide = () => setSlideIndex((i) => (i + 1) % Math.max(reviews.length, 1));
  const prevSlide = () => setSlideIndex((i) => (i - 1 + Math.max(reviews.length, 1)) % Math.max(reviews.length, 1));

  // Sans avis publié, la section n'apparaît pas (aucun formulaire public)
  if (loading || reviews.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container-page">
        <SectionHeading
          title={t("home.testimonials.title")}
          align="center"
          description={t("home.testimonials.description")}
        />

        <div className="mt-14">
          <div>
              <>
                {}
                <div className="hidden lg:grid grid-cols-3 gap-6">
                  {reviews.slice(0, 6).map((r) => (
                    <div
                      key={r.id}
                      className="bg-cream rounded-2xl p-7 border border-navy/5 relative"
                    >
                      <Quote className="text-gold" size={26} />
                      <p className="text-slate text-sm leading-relaxed mt-3">
                        {r.comment}
                      </p>
                      <div className="mt-5">{stars(r.rating)}</div>
                      <div className="flex items-center gap-3 mt-4">
                        <Avatar review={r} />
                        <div>
                          <p className="font-semibold text-navy text-sm">{r.author}</p>
                          {r.created_at && (
                            <p className="text-[11px] text-slate mt-0.5">
                              {new Date(r.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {}
                <div className="lg:hidden">
                  <div className="relative">
                    {reviews.length > 1 && (
                      <>
                        <button
                          onClick={prevSlide}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-navy text-gold flex items-center justify-center shadow-lg hover:bg-gold hover:text-navy transition-all"
                          aria-label={t("home.reviews.prev")}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={nextSlide}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-navy text-gold flex items-center justify-center shadow-lg hover:bg-gold hover:text-navy transition-all"
                          aria-label={t("home.reviews.next")}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                    <div className="overflow-hidden px-12">
                      <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${slideIndex * 100}%)` }}
                      >
                        {reviews.map((r) => (
                          <div key={r.id} className="w-full shrink-0 px-1">
                            <div className="bg-cream rounded-2xl p-7 border border-navy/5 relative h-full">
                              <Quote className="text-gold" size={26} />
                              <p className="text-slate text-sm leading-relaxed mt-3">
                                {r.comment}
                              </p>
                              <div className="mt-5">{stars(r.rating)}</div>
                              <div className="flex items-center gap-3 mt-4">
                                <Avatar review={r} />
                                <div>
                                  <p className="font-semibold text-navy text-sm">{r.author}</p>
                                  {r.created_at && (
                                    <p className="text-[11px] text-slate mt-0.5">
                                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="flex justify-center items-center gap-1.5 mt-4">
                    {reviews.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === slideIndex ? "w-6 bg-gold" : "w-1.5 bg-navy/20 hover:bg-navy/40"
                        }`}
                        aria-label={t("home.goToProperty", { number: i + 1 })}
                      />
                    ))}
                  </div>
                </div>
              </>
          </div>

        </div>
      </div>
    </section>
  );
}