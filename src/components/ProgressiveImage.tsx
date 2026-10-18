import { useState, useRef, useEffect } from "react";

type ProgressiveImageProps = {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  
  placeholder?: string;
  
  aspectRatio?: string;
  loading?: "lazy" | "eager";
};


export default function ProgressiveImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  placeholder,
  aspectRatio,
  loading = "lazy",
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [shouldLoad, setShouldLoad] = useState(loading === "eager");

  
  useEffect(() => {
    if (loading !== "lazy" || shouldLoad) return;

    const el = imgRef.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: "200px" }, 
    );

    observerRef.current.observe(el);

    return () => observerRef.current?.disconnect();
  }, [loading, shouldLoad]);

  
  
  const blurPlaceholder =
    placeholder ||
    `${src}?auto=format&fit=crop&w=40&q=10&blur=200`;

  const isError = error || (!src || src.trim() === "");

  if (isError) {
    return (
      <div
        className={`bg-navy/10 flex items-center justify-center ${wrapperClassName}`}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <div className="text-center p-4">
          <div className="w-8 h-8 mx-auto rounded-full bg-navy/20 flex items-center justify-center mb-2">
            <svg
              className="w-4 h-4 text-navy/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          <p className="text-[10px] text-navy/30">Image indisponible</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${wrapperClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {}
      {!loaded && (
        <img
          src={blurPlaceholder}
          alt=""
          aria-hidden
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-0" : "opacity-100"
          }`}
          style={{ filter: "blur(20px)", transform: "scale(1.1)" }}
        />
      )}

      {}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}

      {}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          loading="eager" 
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}

      {}
      {!loaded && shouldLoad && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gold/60 rounded-full animate-progress" />
          </div>
        </div>
      )}
    </div>
  );
}
