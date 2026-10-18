import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, Quote, Send, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [author, setAuthor] = useState("");
  const [avatar, setAvatar] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!author.trim()) {
      setError(t("home.reviews.errorName"));
      return;
    }
    if (rating < 1) {
      setError(t("home.reviews.errorRating"));
      return;
    }
    if (!comment.trim()) {
      setError(t("home.reviews.errorComment"));
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, avatar, rating, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setDone(true);
        setAuthor("");
        setAvatar("");
        setRating(0);
        setComment("");
      } else {
        setError(data.error || t("home.reviews.errorSend"));
      }
    } catch {
      setError(t("home.reviews.errorSend"));
    } finally {
      setSending(false);
    }
  };

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

  return (
    <section className="py-16 bg-white">
      <div className="container-page">
        <SectionHeading
          title={t("home.testimonials.title")}
          align="center"
          description={t("home.testimonials.description")}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-14">
          {}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate text-sm">
                {t("home.reviews.loading")}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-slate text-sm">
                {t("home.reviews.empty")}
              </div>
            ) : (
              <>
                {}
                <div className="hidden lg:grid grid-cols-2 gap-6">
                  {reviews.slice(0, 4).map((r) => (
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
            )}
          </div>

          {}
          <div className="bg-navy rounded-2xl p-8 text-white h-fit lg:sticky lg:top-24">
            <h3 className="font-display font-semibold text-lg mb-1">
              {t("home.reviews.formTitle")}
            </h3>
            <p className="text-white/50 text-sm mb-6">
              {t("home.reviews.formSubtitle")}
            </p>

            {done ? (
              <div className="text-center py-8">
                <CheckCircle2 size={36} className="text-green-400 mx-auto mb-4" />
                <p className="text-white/80 text-sm mb-6">
                  {t("home.reviews.thanks")}
                </p>
                <button
                  onClick={() => setDone(false)}
                  className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-navy font-semibold text-sm transition-all"
                >
                  {t("home.reviews.another")}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    {t("home.reviews.name")}
                  </label>
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder={t("home.reviews.namePlaceholder")}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    {t("home.reviews.avatar")}
                  </label>
                  <input
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder={t("home.reviews.avatarPlaceholder")}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    {t("home.reviews.rating")}
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        onMouseEnter={() => setHoverRating(i)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-0.5"
                        aria-label={`${i} étoiles`}
                      >
                        <Star
                          size={24}
                          className={
                            i <= (hoverRating || rating)
                              ? "text-gold fill-gold"
                              : "text-white/20"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    {t("home.reviews.comment")}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t("home.reviews.commentPlaceholder")}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-all resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                    <AlertCircle size={15} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-light disabled:opacity-60 text-navy font-semibold py-3 rounded-xl transition-all"
                >
                  <Send size={16} />
                  {sending ? t("home.reviews.sending") : t("home.reviews.send")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}