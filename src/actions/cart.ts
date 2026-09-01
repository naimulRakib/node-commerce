"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth";

// ─── Add to Cart ──────────────────────────────────────────────
export async function addToCartAction(
  productId: number,
  variantCode: string | null,
  quantity: number = 1
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireCustomer();

  const cart = await prisma.cart.findUnique({ where: { customer_id: session.id } });
  if (!cart) return { error: "Cart not found" };

  // Upsert: if same variant already in cart, increment quantity
  if (variantCode) {
    const existing = await prisma.cartItem.findUnique({
      where: { uq_cart_item: { cart_id: cart.cart_id, variant_code: variantCode } },
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { cart_item_id: existing.cart_item_id },
        data: { quantity: { increment: quantity } },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cart_id: cart.cart_id,
          product_id: productId,
          variant_code: variantCode,
          quantity,
        },
      });
    }
  } else {
    // Product with no variant
    const existing = await prisma.cartItem.findFirst({
      where: { cart_id: cart.cart_id, product_id: productId, variant_code: null },
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { cart_item_id: existing.cart_item_id },
        data: { quantity: { increment: quantity } },
      });
    } else {
      await prisma.cartItem.create({
        data: { cart_id: cart.cart_id, product_id: productId, quantity },
      });
    }
  }

  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}

// ─── Update Cart Item Quantity ────────────────────────────────
export async function updateCartItemAction(
  cartItemId: number,
  quantity: number
): Promise<{ error?: string }> {
  await requireCustomer();

  if (quantity < 1) {
    await prisma.cartItem.delete({ where: { cart_item_id: cartItemId } });
  } else {
    await prisma.cartItem.update({
      where: { cart_item_id: cartItemId },
      data: { quantity },
    });
  }

  revalidatePath("/cart");
  return {};
}

// ─── Remove Cart Item ─────────────────────────────────────────
export async function removeCartItemAction(cartItemId: number): Promise<void> {
  await requireCustomer();
  await prisma.cartItem.delete({ where: { cart_item_id: cartItemId } });
  revalidatePath("/cart");
}

// ─── Validate Coupon ──────────────────────────────────────────
export async function validateCouponAction(
  code: string,
  subtotal: number
): Promise<{
  valid: boolean;
  discountAmount?: number;
  error?: string;
  coupon?: { code: string; discount_type: string; discount_value: number };
}> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || !coupon.is_active) return { valid: false, error: "Invalid coupon code" };
  if (coupon.expiry_date && coupon.expiry_date < new Date()) return { valid: false, error: "Coupon has expired" };
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, error: "Coupon usage limit reached" };
  }
  if (subtotal < Number(coupon.min_spend)) {
    return { valid: false, error: `Minimum spend of ৳${Number(coupon.min_spend).toLocaleString()} required` };
  }

  let discountAmount = 0;
  if (coupon.discount_type === "percentage") {
    discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
    if (coupon.max_discount) {
      discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
    }
  } else {
    discountAmount = Number(coupon.discount_value);
  }

  return {
    valid: true,
    discountAmount,
    coupon: {
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
    },
  };
}

// ─── Add to Wishlist ──────────────────────────────────────────
export async function addToWishlistAction(
  productId: number,
  variantCode: string | null
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireCustomer();

  const wishlist = await prisma.wishlist.findUnique({ where: { customer_id: session.id } });
  if (!wishlist) return { error: "Wishlist not found" };

  await prisma.wishlistItem.upsert({
    where: { uq_wishlist_item: { wishlist_id: wishlist.wishlist_id, variant_code: variantCode ?? "" } },
    update: {},
    create: {
      wishlist_id: wishlist.wishlist_id,
      product_id: productId,
      variant_code: variantCode,
    },
  });

  revalidatePath("/account/wishlist");
  return { success: true };
}
