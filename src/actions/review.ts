"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth";

// ─── Submit Review ────────────────────────────────────────────
// Only verified purchasers can review — is_verified set to true
// if they have a delivered order containing this product.
export async function submitReviewAction(
  productId: number,
  rating: number,
  comment: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireCustomer();

  if (rating < 1 || rating > 5) return { error: "Rating must be between 1 and 5" };

  // Check if customer purchased this product (delivered order)
  const purchased = await prisma.orderItem.findFirst({
    where: {
      product_id: productId,
      order: {
        customer_id: session.id,
        status: "delivered",
      },
    },
  });

  // Check if already reviewed
  const existing = await prisma.review.findFirst({
    where: { product_id: productId, customer_id: session.id },
  });
  if (existing) return { error: "You have already reviewed this product" };

  await prisma.review.create({
    data: {
      product_id: productId,
      customer_id: session.id,
      rating,
      comment: comment.trim() || null,
      is_verified: !!purchased, // true only if they bought it
    },
  });

  revalidatePath(`/products/${productId}`);
  return { success: true };
}
