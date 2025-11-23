// pages/api/products.js
import { Product } from "@/models/Product";
import { mongooseConnect } from "@/lib/mongoose";
import { isAdminRequest } from "./auth/[...nextauth]";

export default async function handle(req, res) {
  const { method } = req;

  await mongooseConnect();

  // ✅ 讀取商品：所有使用者都可以
  if (method === "GET") {
    if (req.query?.id) {
      const product = await Product.findOne({ _id: req.query.id });
      return res.json(product);
    } else {
      const products = await Product.find();
      return res.json(products);
    }
  }

  // ✅ 寫操作：先檢查 admin，但不回 401
  const isAdmin = await isAdminRequest(req, res);
  if (!isAdmin) {
    // 200 + 統一格式，給前端判斷
    return res.json({ ok: false, error: "NOT_ADMIN" });
  }

  if (method === "POST") {
    const { title, description, price, images, category, properties } =
      req.body;

    const productDoc = await Product.create({
      title,
      description,
      price,
      images,
      category: category || undefined,
      properties,
    });

    return res.json({ ok: true, product: productDoc });
  }

  if (method === "PUT") {
    const { _id, title, description, price, images, category, properties } =
      req.body;

    await Product.updateOne(
      { _id },
      {
        title,
        description,
        price,
        images,
        category: category || undefined,
        properties,
      }
    );

    return res.json({ ok: true });
  }

  if (method === "DELETE") {
    if (req.query?.id) {
      await Product.deleteOne({ _id: req.query.id });
      return res.json({ ok: true });
    }
  }

  // 其他 method
  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
