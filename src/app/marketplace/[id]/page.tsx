"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { getProductById, getProductsByCategory } from "@/services/productService";
import { Product, PRODUCT_CONDITIONS } from "@/types/product";
import { getUniversityFullName, getUniversityShortLabel } from "@/lib/universityLabels";
import { trackListing } from "@/lib/trackListing";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { optimizeCardImage } from "@/lib/imageUrl";
import { useAuth } from "@/lib/AuthContext";
import { WhatsAppContactButton } from "@/components/whatsapp/WhatsAppContactButton";
import { ReportButton } from "@/components/shared/ReportButton";
import { ShareButton } from "@/components/shared/ShareButton";
import { RelatedListings } from "@/components/shared/RelatedListings";
import { LoginRequiredModal } from "@/components/shared/LoginRequiredModal";
import { ProductCard } from "@/components/products/ProductCard";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Eye,
  ShieldCheck,
  Tag,
  ImagePlus,
  Store,
  ChevronRight,
  Sparkles,
  Handshake,
  MessageCircle, // ⚡ Added for WhatsApp button
} from "lucide-react";

// ⚡ Lazy-load the lightbox
const ImageLightbox = dynamic(
  () => import("@/components/shared/ImageLightbox").then((mod) => mod.ImageLightbox),
  { ssr: false }
);

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await getProductById(id);
        if (!data) setNotFound(true);
        else setProduct(data);
      } catch {
        setNotFound(true);
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!id || tracked.current) return;
    if (!product) return;
    if (product.adminHidden) return;
    tracked.current = true;
    trackListing("product", id, "views");
  }, [id, product]);

  useEffect(() => {
    if (!product) return;
    let active = true;
    const loadRelated = async () => {
      try {
        const items = await getProductsByCategory(
          product.category,
          product.id,
          product.universityId,
          8
        );
        if (active) setRelated(items);
      } catch {
        // silent
      }
    };
    loadRelated();
    return () => {
      active = false;
    };
  }, [product]);

  if (isFetching) {
    return (
      <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
        <Navbar />
        <div className="container-medium py-10">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-3/4 rounded bg-gray-200" />
            <div className="h-40 w-full rounded-xl bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (notFound || !product) {
    return (
      <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
        <Navbar />
        <div className="container-medium py-16 text-center">
          <p className="text-sm text-gray-500">Product not found.</p>
          <button
            onClick={() => router.push("/marketplace")}
            className="mt-4 text-sm font-medium text-[var(--nexora-primary)] hover:underline"
          >
            ← Back to Marketplace
          </button>
        </div>
        <Footer />
      </main>
    );
  }

  const rawImages = product.imageUrls || [];
  const images = rawImages.map((u) => optimizeCardImage(u));
  const isSold = product.status === "sold";
  const conditionLabel =
    PRODUCT_CONDITIONS.find((c) => c.id === product.condition)?.label ||
    product.condition;

  const displayPrice = isRevealed && product.lastPrice ? product.lastPrice : product.price;
  
  const prefillMessage = `Hi, I found your "${product.name}" listed on Peza for K${displayPrice.toLocaleString()}. Is it still available?`;

  const viewMorePhotosHref = buildWhatsAppLink(
    product.whatsapp,
    `Hi, I saw your "${product.name}" on Peza. Can you share more photos?`
  );

  const handleViewMorePhotos = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
      return;
    }
    trackListing("product", product.id, "whatsappClicks");
  };

  const handleNegotiate = () => {
    if (!product.isNegotiable || !product.lastPrice) {
      toast.info("The seller is firm on this one! They've already listed their best price. 😊", {
        icon: "🤝",
        duration: 4000,
      });
      return;
    }
    setIsRevealed(true);
    toast.success("You unlocked the seller's last price!", {
      description: "The final price is now shown below.",
    });
  };

  const relatedTitle = product.category
    ? `More ${product.category}`
    : "More products";
  const relatedSubtitle = product.universityId
    ? `near ${getUniversityShortLabel(product.universityId)}`
    : undefined;
  const relatedSeeAllHref = `/marketplace?cat=${product.category}`;

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-medium py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[var(--nexora-navy)]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div
          className={
            related.length > 0
              ? "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
              : "grid grid-cols-1 gap-6"
          }
        >
          <div className="min-w-0">
            {images.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="relative mb-3 block aspect-[4/3] w-full overflow-hidden rounded-2xl"
                >
                  <Image
                    src={images[0]}
                    alt={product.name}
                    fill
                    priority
                    className="object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                </button>

                {images.length > 1 && (
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    {images.slice(1, 3).map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxIndex(i + 1)}
                        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100"
                      >
                        <Image
                          src={url}
                          alt={`${product.name} ${i + 2}`}
                          fill
                          className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {viewMorePhotosHref && !isSold && (
                  <a
                    href={viewMorePhotosHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleViewMorePhotos}
                    className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--nexora-primary)] hover:text-[var(--nexora-primary)]"
                  >
                    <ImagePlus size={14} />
                    View more photos on WhatsApp
                  </a>
                )}
              </>
            )}

            <div className="card-premium p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold text-[var(--nexora-navy)] sm:text-2xl">
                    {product.name}
                  </h1>

                  <div className="mt-3 flex flex-col gap-3">
                    {isRevealed && product.isNegotiable ? (
                      <div className="flex flex-col rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                          <Sparkles size={14} /> Final Price Unlocked
                        </p>
                        <p className="mt-1 text-3xl font-extrabold text-emerald-700">
                          K{product.lastPrice?.toLocaleString()}
                        </p>
                        <p className="text-sm text-emerald-600/80 line-through mt-0.5">
                          Original: K{product.price.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-[var(--nexora-primary)]">
                          K{product.price.toLocaleString()}
                        </p>
                        {product.isNegotiable && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 border border-blue-200">
                            Negotiable
                          </span>
                        )}
                      </div>
                    )}

                    {!isSold && !isRevealed && (
                      <button
                        type="button"
                        onClick={handleNegotiate}
                        className={`mt-1 inline-flex w-fit items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-md transition-all active:scale-95 ${
                          product.isNegotiable
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:opacity-95"
                            : "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Handshake size={18} />
                        {product.isNegotiable ? "🤝 Negotiate Price" : "Ask for Last Price"}
                      </button>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Tag size={11} />
                      {product.category}
                    </span>
                    <span>·</span>
                    <span>{conditionLabel}</span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin size={14} className="shrink-0" />
                    {product.location}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {getUniversityFullName(product.universityId)}
                  </p>
                </div>

                {isSold && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    Sold
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                  <Eye size={12} />
                  {product.views || 0} views
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs text-green-700">
                  <ShieldCheck size={12} />
                  Verified Seller
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 transition-colors hover:border-[var(--nexora-primary)]/40 hover:bg-blue-50/40">
                <Link
                  href={`/provider/${product.ownerId}`}
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--nexora-navy)] text-white">
                    <Store size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Sold by</p>
                    <p className="truncate text-sm font-semibold text-[var(--nexora-navy)] group-hover:underline">
                      View seller profile
                    </p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-gray-400" />
                </Link>
              </div>

              {!isSold && (
                <div className="mt-4">
                  <WhatsAppContactButton
                    whatsapp={product.whatsapp}
                    message={prefillMessage}
                    onTrack={() =>
                      trackListing(
                        "product",
                        product.id,
                        "whatsappClicks"
                      )
                    }
                    size="lg"
                    fullWidth
                    label={
                      isRevealed
                        ? `Buy at K${product.lastPrice?.toLocaleString()} on WhatsApp`
                        : "Contact Seller on WhatsApp"
                    }
                  />
                </div>
              )}
            </div>

            {/* ⚡ Share & Report Actions */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const url = window.location.href;
                    const text = `Check out this ${product.name} I found on Peza! 👇\n${url}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                <MessageCircle size={14} fill="currentColor" />
                Share on WhatsApp
              </button>
              <ShareButton targetType="product" targetTitle={product.name} />
              <span className="hidden text-gray-300 sm:inline">·</span>
              <ReportButton
                targetType="product"
                targetId={product.id}
                targetTitle={product.name}
                targetOwnerId={product.ownerId}
              />
            </div>

            <div className="card-premium mt-4 p-5">
              <h2 className="mb-2 text-sm font-semibold text-[var(--nexora-navy)]">
                Description
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {product.description}
              </p>
            </div>

            <div className="mt-4 text-center text-[11px] text-gray-400">
              Peza connects you with the seller — payment and delivery are arranged between you both.
            </div>
          </div>

          {related.length > 0 && (
            <RelatedListings
              title={relatedTitle}
              subtitle={relatedSubtitle}
              count={related.length}
              seeAllHref={relatedSeeAllHref}
              seeAllLabel="See all"
              icon={<Sparkles size={16} />}
            >
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </RelatedListings>
          )}
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          alt={product.name}
        />
      )}

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign in to contact"
        subtitle="Create a free Peza account to message this seller — it keeps everyone on Peza safe and accountable."
      />

      <Footer />
    </main>
  );
}