import { db } from "./src/lib/db";

async function main() {
  try {
    const products = await db.query(`
      SELECT p.product_id, p.name, c.name as category_name, v.variant_code 
      FROM product p
      JOIN category c ON p.category_id = c.category_id
      JOIN product_variant v ON p.product_id = v.product_id
    `);
    
    console.log("Found variants:", products.rows.length);

    for (const row of products.rows) {
      let imageUrl = null;
      const name = row.name.toLowerCase();
      
      if (name.includes('laptop')) {
        imageUrl = '/demo/laptop.jpg';
      } else if (name.includes('headphones') || name.includes('audio')) {
        imageUrl = '/demo/headphones.jpg';
      } else if (name.includes('galaxy') || name.includes('iphone') || name.includes('redmi')) {
        imageUrl = '/demo/phone.jpg';
      } else if (name.includes('air max') || name.includes('shoes')) {
        imageUrl = '/demo/shoes.jpg';
      } else if (name.includes('dualsense') || name.includes('controller')) {
        imageUrl = '/demo/controller.jpg';
      } else if (name.includes('watch')) {
        imageUrl = '/demo/watch.jpg';
      } else if (name.includes('shirt') || name.includes('polo')) {
        imageUrl = '/demo/shirt.jpg';
      } else if (name.includes('pants') || name.includes('chino')) {
        imageUrl = '/demo/pants.jpg';
      } else if (name.includes('mug')) {
        imageUrl = '/demo/mug.jpg';
      } else if (name.includes('serum')) {
        imageUrl = '/demo/serum.jpg';
      }
      
      if (imageUrl) {
        // Check if media exists
        const mediaCheck = await db.query('SELECT * FROM media WHERE variant_code = $1', [row.variant_code]);
        if (mediaCheck.rows.length === 0) {
          await db.query('INSERT INTO media (variant_code, image_url) VALUES ($1, $2)', [row.variant_code, imageUrl]);
          console.log(`Inserted media for ${row.name}`);
        } else {
          await db.query('UPDATE media SET image_url = $2 WHERE variant_code = $1', [row.variant_code, imageUrl]);
          console.log(`Updated media for ${row.name}`);
        }
      } else {
        console.log(`No image mapped for ${row.name}`);
      }
    }
    
    console.log("Done inserting all demo images!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}
main();
