"use client";

import { useState, useEffect } from "react";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { Product, isProductDiscountActive, getProductDiscountedPrice } from "@/types/product";
import { buildWhatsAppLink } from "@/lib/whatsapp";

interface BuyProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function BuyProductModal({ isOpen, onClose, product }: BuyProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setNote("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasDiscount = isProductDiscountActive(product);
  const unitPrice = hasDiscount ? getProductDiscountedPrice(product) || product.price : product.price;
  const totalPrice = unitPrice * quantity;
  
  // Max quantity logic (if seller set a limit)
  const maxQty = product.quantity && product.quantity > 0 ? product.quantity : 99;
  const canIncrease = quantity < maxQty;
  const canDecrease = quantity > 1;

  const handleSendOrder = () => {
    // Passive validation: Only add the note part if the user actually typed something
    const noteStr = note.trim() ? `\n\n📝 Note: ${note.trim()}` : "";
    
    const message = `Hi! I want to order *${quantity}* of "${product.name}" for a total of *K${totalPrice.toLocaleString()}*.${noteStr}\n\nIs it available?`;
    
    const url = buildWhatsAppLink(product.whatsapp, message);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-[var(--nexora-navy)] px-6 py-6 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <ShoppingBag size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">Buy Product</h2>
              <p className="mt-0.5 truncate text-sm text-gray-300">{product.name}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-5">
            <div>
              <p className="text-sm font-semibold text-gray-900">Quantity</p>
              <p className="text-xs text-gray-500">
                {product.quantity ? `Only ${product.quantity} available` : "How many do you need?"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => canDecrease && setQuantity((q) => q - 1)}
                disabled={!canDecrease}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-colors ${
                  canDecrease
                    ? "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    : "border-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center text-xl font-bold text-gray-900">{quantity}</span>
              <button
                type="button"
                onClick={() => canIncrease && setQuantity((q) => q + 1)}
                disabled={!canIncrease}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-colors ${
                  canIncrease
                    ? "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    : "border-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Live Total Price */}
          <div className="my-5 flex items-center justify-between rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-600">Total Price</p>
            <div className="text-right">
              {/* ⚡ Changed to bright red */}
              <p className="text-2xl font-extrabold text-red-600">
                K{totalPrice.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400">
                {quantity} × K{unitPrice.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Optional Note */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Add a note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              rows={2}
              placeholder="e.g., Do you have it in black? / I will pick it up tomorrow."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15"
            />
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleSendOrder}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--nexora-primary)] py-3.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
          >
            Send Order on WhatsApp
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}