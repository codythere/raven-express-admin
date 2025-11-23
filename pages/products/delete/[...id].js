import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function DeleteProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin; // ⭐ 這裡把 isAdmin 宣告出來
  const [productInfo, setProductInfo] = useState();

  useEffect(() => {
    if (id) {
      axios.get("/api/products?id=" + id).then((response) => {
        setProductInfo(response.data);
      });
    }
  }, [id]);

  async function deleteProduct() {
    // 前端保護
    if (!isAdmin) {
      toast.error("你目前沒有管理員權限，無法刪除商品");
      return;
    }

    const res = await axios.delete("/api/products?id=" + id);

    // 後端保護
    if (res.data?.ok === false && res.data?.error === "NOT_ADMIN") {
      toast.error("你目前沒有管理員權限，無法刪除商品");
      return;
    }

    toast.success("商品已刪除");
    router.push("/products");
  }

  function goBack() {
    router.push("/products");
  }

  return (
    <Layout>
      <h1 className="text-center">
        確定要刪除此商品？ &nbsp;"{productInfo?.title}"?
      </h1>
      <div className="flex gap-2 justify-center">
        <button onClick={deleteProduct} className="btn-red">
          刪除
        </button>
        <button className="btn-default" onClick={goBack}>
          取消
        </button>
      </div>
    </Layout>
  );
}
