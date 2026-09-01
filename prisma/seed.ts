import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ─── Categories ─────────────────────────────────────────────
  const catElectronics = await prisma.category.upsert({
    where: { category_id: 1 },
    update: {},
    create: { name: "Electronics" },
  });
  const catFashion = await prisma.category.upsert({
    where: { category_id: 2 },
    update: {},
    create: { name: "Fashion" },
  });
  const catHome = await prisma.category.upsert({
    where: { category_id: 3 },
    update: {},
    create: { name: "Home & Living" },
  });
  const catFootwear = await prisma.category.upsert({
    where: { category_id: 4 },
    update: {},
    create: { name: "Footwear" },
  });
  const catBeauty = await prisma.category.upsert({
    where: { category_id: 5 },
    update: {},
    create: { name: "Beauty" },
  });
  const catGaming = await prisma.category.upsert({
    where: { category_id: 6 },
    update: {},
    create: { name: "Gaming" },
  });
  const catKitchen = await prisma.category.upsert({
    where: { category_id: 7 },
    update: {},
    create: { name: "Kitchen" },
  });
  const catSports = await prisma.category.upsert({
    where: { category_id: 8 },
    update: {},
    create: { name: "Sports" },
  });

  // Subcategories (demonstrates self-referencing Category hierarchy)
  await prisma.category.upsert({
    where: { category_id: 9 },
    update: {},
    create: { name: "Phones", parent_category_id: catElectronics.category_id },
  });
  await prisma.category.upsert({
    where: { category_id: 10 },
    update: {},
    create: { name: "Laptops", parent_category_id: catElectronics.category_id },
  });

  console.log("✅ Categories seeded");

  const whDhaka = await prisma.warehouse.upsert({
    where: { warehouse_no: 1 },
    update: {},
    create: {
      name: "Dhaka Central Warehouse",
      address_line: "123 Tejgaon Industrial Area",
      city: "Dhaka",
      district: "Dhaka",
      capacity: 10000,
    },
  });
  await prisma.warehouse.upsert({
    where: { warehouse_no: 2 },
    update: {},
    create: {
      name: "Chittagong Port Warehouse",
      address_line: "45 Port Road",
      city: "Chittagong",
      district: "Chittagong",
      capacity: 5000,
    },
  });

  console.log("✅ Warehouses seeded");

  // ─── Couriers ────────────────────────────────────────────────
  await prisma.courier.upsert({
    where: { courier_id: 1 },
    update: {},
    create: {
      name: "Sundarban Courier",
      phone: "01700000001",
      email: "info@sundarban.com",
      coverage_areas: {
        create: [
          { district: "Dhaka", city: "Dhaka" },
          { district: "Chittagong", city: "Chittagong" },
          { district: "Sylhet", city: "Sylhet" },
        ],
      },
    },
  });
  await prisma.courier.upsert({
    where: { courier_id: 2 },
    update: {},
    create: {
      name: "SA Paribahan",
      phone: "01700000002",
      email: "info@saparibahan.com",
      coverage_areas: {
        create: [
          { district: "Dhaka", city: "Dhaka" },
          { district: "Rajshahi", city: "Rajshahi" },
          { district: "Khulna", city: "Khulna" },
        ],
      },
    },
  });
  await prisma.courier.upsert({
    where: { courier_id: 3 },
    update: {},
    create: {
      name: "Pathao Courier",
      phone: "01700000003",
      email: "courier@pathao.com",
      coverage_areas: {
        create: [
          { district: "Dhaka", city: "Dhaka" },
          { district: "Chittagong", city: "Chittagong" },
          { district: "Rajshahi", city: "Rajshahi" },
          { district: "Khulna", city: "Khulna" },
          { district: "Sylhet", city: "Sylhet" },
        ],
      },
    },
  });

  console.log("✅ Couriers seeded");

  // ─── Products ────────────────────────────────────────────────
  const products = [
    {
      name: "Premium Leather Sneakers",
      product_code: "SNKR-001",
      description: "Handcrafted premium leather sneakers with memory foam insoles. Perfect for all-day comfort.",
      base_price: 4200,
      category_id: catFootwear.category_id,
      variants: [
        { variant_code: "SNKR-001-BLK-40", color: "Black", size: "40", sku: "SNKR-001-BLK-40", quantity: 25 },
        { variant_code: "SNKR-001-WHT-40", color: "White", size: "40", sku: "SNKR-001-WHT-40", quantity: 15 },
        { variant_code: "SNKR-001-BRN-42", color: "Brown", size: "42", sku: "SNKR-001-BRN-42", quantity: 10 },
      ],
    },
    {
      name: "Wireless Noise-Cancel Headphones",
      product_code: "HDPH-001",
      description: "Industry-leading noise cancellation with 30-hour battery life and premium sound quality.",
      base_price: 8900,
      category_id: catElectronics.category_id,
      variants: [
        { variant_code: "HDPH-001-BLK", color: "Black", size: null, sku: "HDPH-001-BLK", quantity: 30 },
        { variant_code: "HDPH-001-WHT", color: "White", size: null, sku: "HDPH-001-WHT", quantity: 20 },
        { variant_code: "HDPH-001-NVY", color: "Navy Blue", size: null, sku: "HDPH-001-NVY", quantity: 15 },
      ],
    },
    {
      name: "Minimalist Smart Watch",
      product_code: "WTCH-001",
      description: "Track fitness, receive notifications, and monitor health with this stylish smartwatch.",
      base_price: 11500,
      category_id: catElectronics.category_id,
      variants: [
        { variant_code: "WTCH-001-BLK", color: "Midnight Black", size: null, sku: "WTCH-001-BLK", quantity: 20 },
        { variant_code: "WTCH-001-GLD", color: "Gold", size: null, sku: "WTCH-001-GLD", quantity: 10, price_override: 12500 },
        { variant_code: "WTCH-001-RED", color: "Red", size: null, sku: "WTCH-001-RED", quantity: 8 },
      ],
    },
    {
      name: "Linen Summer Shirt",
      product_code: "SHRT-001",
      description: "Breathable 100% linen shirt perfect for hot weather. Available in multiple colors.",
      base_price: 1850,
      category_id: catFashion.category_id,
      variants: [
        { variant_code: "SHRT-001-BGE-M", color: "Beige", size: "M", sku: "SHRT-001-BGE-M", quantity: 40 },
        { variant_code: "SHRT-001-BLU-M", color: "Sky Blue", size: "M", sku: "SHRT-001-BLU-M", quantity: 35 },
        { variant_code: "SHRT-001-BGE-L", color: "Beige", size: "L", sku: "SHRT-001-BGE-L", quantity: 30 },
        { variant_code: "SHRT-001-BLU-L", color: "Sky Blue", size: "L", sku: "SHRT-001-BLU-L", quantity: 25 },
      ],
    },
    {
      name: "Ergonomic Office Chair",
      product_code: "CHIR-001",
      description: "Lumbar support, adjustable height, mesh back. Spend hours at your desk without discomfort.",
      base_price: 18500,
      category_id: catHome.category_id,
      variants: [
        { variant_code: "CHIR-001-BLK", color: "Black", size: null, sku: "CHIR-001-BLK", quantity: 15 },
        { variant_code: "CHIR-001-GRY", color: "Gray", size: null, sku: "CHIR-001-GRY", quantity: 10 },
      ],
    },
    {
      name: "Skincare Glow Set (6pc)",
      product_code: "SKIN-001",
      description: "Complete skincare routine: cleanser, toner, serum, moisturizer, eye cream, and SPF.",
      base_price: 2950,
      category_id: catBeauty.category_id,
      variants: [
        { variant_code: "SKIN-001-SET", color: null, size: null, sku: "SKIN-001-SET", quantity: 50 },
      ],
    },
    {
      name: "Gaming Mechanical Keyboard",
      product_code: "KBRD-001",
      description: "RGB backlit mechanical keyboard with Cherry MX switches. N-key rollover for competitive gaming.",
      base_price: 6200,
      category_id: catGaming.category_id,
      variants: [
        { variant_code: "KBRD-001-BLK-RED", color: "Black/Red", size: null, sku: "KBRD-001-BLK-RED", quantity: 25 },
        { variant_code: "KBRD-001-WHT-BLU", color: "White/Blue", size: null, sku: "KBRD-001-WHT-BLU", quantity: 20 },
      ],
    },
    {
      name: "Stainless Steel Water Bottle",
      product_code: "BOTL-001",
      description: "Triple-wall insulation keeps drinks cold 24h / hot 12h. BPA-free. 750ml capacity.",
      base_price: 890,
      category_id: catSports.category_id,
      variants: [
        { variant_code: "BOTL-001-BLU", color: "Ocean Blue", size: "750ml", sku: "BOTL-001-BLU", quantity: 80 },
        { variant_code: "BOTL-001-GRN", color: "Forest Green", size: "750ml", sku: "BOTL-001-GRN", quantity: 75 },
        { variant_code: "BOTL-001-ORG", color: "Sunset Orange", size: "750ml", sku: "BOTL-001-ORG", quantity: 60 },
      ],
    },
    {
      name: "Cast Iron Skillet",
      product_code: "SKLT-001",
      description: "Pre-seasoned 10-inch cast iron skillet. Perfect sear on every cook. Oven-safe to 500°F.",
      base_price: 3200,
      category_id: catKitchen.category_id,
      variants: [
        { variant_code: "SKLT-001-10IN", color: "Black", size: "10 inch", sku: "SKLT-001-10IN", quantity: 30 },
        { variant_code: "SKLT-001-12IN", color: "Black", size: "12 inch", sku: "SKLT-001-12IN", quantity: 20 },
      ],
    },
    {
      name: "Running Pro Shoes",
      product_code: "RNSHO-001",
      description: "Lightweight and responsive running shoes with carbon fiber plate technology.",
      base_price: 5500,
      category_id: catFootwear.category_id,
      variants: [
        { variant_code: "RNSHO-001-BLK-42", color: "Black/White", size: "42", sku: "RNSHO-001-BLK-42", quantity: 20 },
        { variant_code: "RNSHO-001-RED-42", color: "Red/Black", size: "42", sku: "RNSHO-001-RED-42", quantity: 15 },
        { variant_code: "RNSHO-001-BLK-44", color: "Black/White", size: "44", sku: "RNSHO-001-BLK-44", quantity: 12 },
      ],
    },
  ];

  for (const p of products) {
    const { variants, ...productData } = p;
    const product = await prisma.product.upsert({
      where: { product_code: productData.product_code },
      update: {},
      create: {
        ...productData,
        base_price: productData.base_price,
      },
    });

    // Create variants + inventory
    for (const v of variants) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { quantity, price_override, ...variantData } = v as any;
      await prisma.productVariant.upsert({
        where: { variant_code: variantData.variant_code },
        update: {},
        create: {
          ...variantData,
          product_id: product.product_id,
          quantity,
          price_override: price_override ?? null,
        },
      });

      // Product-level inventory in Dhaka warehouse
      await prisma.inventory.upsert({
        where: { uq_inventory_warehouse_product: { warehouse_no: whDhaka.warehouse_no, product_id: product.product_id } },
        update: {},
        create: {
          warehouse_no: whDhaka.warehouse_no,
          product_id: product.product_id,
          quantity: quantity * 2,
          reorder_level: 5,
        },
      });

      // Variant-level inventory
      await prisma.variantInventory.upsert({
        where: { uq_variant_inventory: { variant_code: variantData.variant_code, warehouse_no: whDhaka.warehouse_no } },
        update: {},
        create: {
          variant_code: variantData.variant_code,
          warehouse_no: whDhaka.warehouse_no,
          quantity,
          reorder_level: 3,
        },
      });
    }
  }

  console.log("✅ Products & inventory seeded");

  // ─── Coupons ─────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      discount_type: "percentage",
      discount_value: 10,
      min_spend: 500,
      max_discount: 500,
      usage_limit: 1000,
    },
  });
  await prisma.coupon.upsert({
    where: { code: "FLAT200" },
    update: {},
    create: {
      code: "FLAT200",
      discount_type: "fixed",
      discount_value: 200,
      min_spend: 1500,
    },
  });
  await prisma.coupon.upsert({
    where: { code: "SAVE20" },
    update: {},
    create: {
      code: "SAVE20",
      discount_type: "percentage",
      discount_value: 20,
      min_spend: 2000,
      max_discount: 1000,
      usage_limit: 500,
    },
  });

  console.log("✅ Coupons seeded");

  // ─── Admin User ──────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@nodecommerce.com" },
    update: {},
    create: {
      email: "admin@nodecommerce.com",
      password_hash: adminHash,
      name: "Super Admin",
      role: "super_admin",
    },
  });

  console.log("✅ Admin user seeded (admin@nodecommerce.com / admin123)");

  // ─── Test Customer ───────────────────────────────────────────
  const custHash = await bcrypt.hash("customer123", 12);
  const testCustomer = await prisma.customer.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      name: "Rahim Uddin",
      email: "test@example.com",
      phone: "01712345678",
      password_hash: custHash,
      is_verified: true,
    },
  });

  // Profile
  await prisma.profile.upsert({
    where: { customer_id: testCustomer.customer_id },
    update: {},
    create: {
      customer_id: testCustomer.customer_id,
      full_name: "Rahim Uddin",
      gender: "Male",
    },
  });

  // Address
  const existingAddr = await prisma.address.findFirst({ where: { customer_id: testCustomer.customer_id } });
  if (!existingAddr) {
    await prisma.address.create({
      data: {
        customer_id: testCustomer.customer_id,
        label: "home",
        address_line1: "House 12, Road 5, Dhanmondi",
        city: "Dhaka",
        district: "Dhaka",
        postal_code: "1209",
        is_default: true,
      },
    });
  }

  // Wallet
  await prisma.wallet.upsert({
    where: { customer_id: testCustomer.customer_id },
    update: {},
    create: { customer_id: testCustomer.customer_id, balance: 500 },
  });

  // Cart
  await prisma.cart.upsert({
    where: { customer_id: testCustomer.customer_id },
    update: {},
    create: { customer_id: testCustomer.customer_id },
  });

  // Wishlist
  await prisma.wishlist.upsert({
    where: { customer_id: testCustomer.customer_id },
    update: {},
    create: { customer_id: testCustomer.customer_id },
  });

  // Add a few reviews from test customer
  const allProducts = await prisma.product.findMany({ take: 3 });
  for (const prod of allProducts) {
    const existing = await prisma.review.findFirst({
      where: { product_id: prod.product_id, customer_id: testCustomer.customer_id },
    });
    if (!existing) {
      await prisma.review.create({
        data: {
          product_id: prod.product_id,
          customer_id: testCustomer.customer_id,
          rating: 5,
          comment: "Excellent product! Highly recommend.",
          is_verified: true,
        },
      });
    }
  }

  console.log("✅ Test customer seeded (test@example.com / customer123)");

  console.log("\n🎉 Seed complete!");
  console.log("   Admin:    admin@nodecommerce.com / admin123");
  console.log("   Customer: test@example.com / customer123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
