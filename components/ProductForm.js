import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Spinner from "./Spinner";
import { ReactSortable } from "react-sortablejs";
import { Category } from "@/models/Category";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function ProductForm({
  _id,
  title: exsitingTitle,
  description: exsitingDescription,
  price: existingPrice,
  images: existingImages,
  category: assignedCategory,
  properties: assignedProperties,
}) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;
  const [title, setTitle] = useState(exsitingTitle || "");
  const [description, setDescription] = useState(exsitingDescription || "");
  const [category, setCategory] = useState(assignedCategory || "");
  const [productProperties, setProductProperties] = useState(
    assignedProperties || {}
  );
  const [price, setPrice] = useState(existingPrice || "");
  const [images, setImages] = useState(existingImages || []);
  const [goToProduct, setGoToProduct] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setCategoriesLoading(true);
    axios.get("/api/categories").then((result) => {
      setCategories(result.data);
      setCategoriesLoading(false);
    });
  }, []);

  async function saveProduct(Event) {
    Event.preventDefault();

    // ✅ 前端先檢查一次，直接跳 toast，不打 API
    if (!isAdmin) {
      toast.error("你目前沒有管理員權限，無法修改商品資訊");
      return;
    }

    const data = {
      title,
      description,
      price,
      images,
      category,
      properties: productProperties,
    };

    if (_id) {
      // update
      await axios.put("/api/products", { ...data, _id });
    } else {
      // create
      await axios.post("/api/products", data);
    }
    setGoToProduct(true);
  }
  if (goToProduct) {
    router.push("/products");
  }
  async function uploadImages(Event) {
    // ✅ 前端先檢查一次，直接跳 toast，不打 API
    if (!isAdmin) {
      toast.error("你目前沒有管理員權限，無法上傳商品圖檔");
      return;
    }

    const files = Event.target?.files;
    if (files?.length > 0) {
      setIsUploading(true);
      const data = new FormData(); // 將多個 data 儲存在 form-data，後續比較好 parse
      for (const file of files) {
        data.append("file", file);
      }
      const res = await axios.post("/api/upload", data);
      setImages((oldImages) => {
        return [...oldImages, ...res.data.links];
      });
      setIsUploading(false);
    }
  }

  function updateImagesOrder(images) {
    setImages(images);
  }

  function setProductProp(propName, value) {
    setProductProperties((prev) => {
      const newProductProps = { ...prev };
      newProductProps[propName] = value;
      return newProductProps;
    });
  }

  const propertiesToFill = [];
  if (categories.length > 0 && category) {
    let catInfo = categories.find(({ _id }) => {
      return _id === category;
    });
    propertiesToFill.push(...catInfo.properties);
    while (catInfo?.parent?._id) {
      const parentCat = categories.find(({ _id }) => {
        return _id === catInfo?.parent?._id;
      });
      propertiesToFill.push(...parentCat.properties);
      catInfo = parentCat; // 無限向上尋找，確認 parentCategory 之上沒有更上層的 parentCategory
    }
  }

  return (
    <form onSubmit={saveProduct}>
      <label>商品名稱</label>
      <input
        type="text"
        placeholder="輸入商品名稱"
        value={title}
        onChange={(Event) => setTitle(Event.target.value)}
      />
      <label>分類</label>
      <select
        onChange={(Event) => {
          setCategory(Event.target.value);
        }}
        value={category}
      >
        <option value="">請選擇</option>
        {categories.length > 0 &&
          categories.map((category) => (
            <option value={category._id}>{category.name}</option>
          ))}
      </select>
      {categoriesLoading && (
        <div className="py-4">
          <Spinner fullWidth={true} />
        </div>
      )}
      {propertiesToFill.length > 0 && (
        <div>
          {propertiesToFill.map((p) => (
            <div>
              <label>{p.name}</label>
              <div>
                <select
                  value={productProperties[p.name]}
                  onChange={(Event) => {
                    setProductProp(p.name, Event.target.value);
                  }}
                >
                  {p.values.map((value) => (
                    <option value={value}>{value}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
      <label>商品照片</label>
      <div className="mb-2 flex flex-wrap gap-1">
        <ReactSortable
          list={images}
          setList={updateImagesOrder}
          className="flex flex-wrap gap-1"
        >
          {!!images?.length &&
            images.map((link) => (
              <div
                key={link}
                className="h-24 bg-white p-4 shadow-sm rounded-sm border border-gray-200"
              >
                <img src={link} alt="" className="rounded-lg" />
              </div>
            ))}
        </ReactSortable>
        {isUploading && (
          <div className="w-24 h-24 flex items-center justify-center ">
            <Spinner />
          </div>
        )}
        <label className="w-24 h-24 flex  justify-center items-center text-sm gap-1 text-primary rounded-sm bg-white cursor-pointer shadow-sm border border-primary flex flex-col">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <div>加入照片</div>
          <input type="file" onChange={uploadImages} className="hidden" />
        </label>
      </div>
      <label>商品描述</label>
      <textarea
        placeholder="輸入商品描述"
        value={description}
        onChange={(Event) => setDescription(Event.target.value)}
      ></textarea>
      <label>價格</label>
      <input
        type="number"
        placeholder="設定價格"
        value={price}
        onChange={(Event) => setPrice(Event.target.value)}
      />
      <button type="submit" className="btn-primary">
        儲存
      </button>
    </form>
  );
}
