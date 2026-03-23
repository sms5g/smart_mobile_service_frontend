"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import RichTextEditor, {
  isRichTextEmpty,
  stripHtml,
} from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash, Upload, X } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { fetcher } from "@/lib/fetcher";
import { MultiSelect } from "@/components/ui/multiselectDropdown";

const INITIAL_FORM = {
  category: "",
  brandIds: [],
  modelIds: [],
  price: "",
  description: "",
  referenceImages: [],
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [productRes, modelRes, brandRes, categoryRes] = await Promise.all(
          [
            fetcher("/products"),
            fetcher("/models"),
            fetcher("/brands"),
            fetcher("/categories"),
          ],
        );
        setProducts(productRes.data || productRes || []);
        setModels(modelRes.data || modelRes || []);
        setBrands(brandRes.data || brandRes || []);
        setCategories(categoryRes.data || categoryRes || []);
      } catch (error) {
        toast.error(error.message || "Failed to fetch data");
      }
    };

    fetchInitialData();
  }, []);

  const refreshProducts = async () => {
    const res = await fetcher("/products");
    setProducts(res.data || res || []);
  };

  const handleReferenceImageUpload = async (files, input) => {
    const validFiles = Array.from(files || []);
    if (!validFiles.length) return;

    try {
      setIsUploadingImages(true);
      const uploadedImages = [];

      for (const file of validFiles) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files are allowed");
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each image must be under 5MB");
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetcher("/files/upload", "POST", formData);
        const imageUrl = response?.url;

        if (!response?.success || !imageUrl) {
          throw new Error("Reference image upload failed");
        }

        uploadedImages.push(imageUrl);
      }

      setForm((prev) => ({
        ...prev,
        referenceImages: [...prev.referenceImages, ...uploadedImages],
      }));
      toast.success("Reference image uploaded");
    } catch (error) {
      toast.error(error.message || "Failed to upload reference images");
    } finally {
      setIsUploadingImages(false);
      if (input) input.value = "";
    }
  };

  const removeReferenceImage = (imageUrl) => {
    setForm((prev) => ({
      ...prev,
      referenceImages: prev.referenceImages.filter(
        (image) => image !== imageUrl,
      ),
    }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    if (
      !form.category ||
      !form.brandIds.length ||
      !form.modelIds.length ||
      !form.price ||
      isRichTextEmpty(form.description)
    ) {
      toast.error("All required fields must be filled");
      return;
    }

    try {
      const payload = {
        category: form.category,
        brand: form.brandIds,
        model: form.modelIds,
        price: Number(form.price),
        description: form.description,
        ...(form.referenceImages.length
          ? {
              referenceImages: form.referenceImages,
            }
          : {}),
      };

      await fetcher("/products", "POST", {
        ...payload,
      });

      setForm(INITIAL_FORM);
      setFormResetKey((prev) => prev + 1);

      toast.success("Product added");
      refreshProducts();
    } catch (error) {
      toast.error(error.message || "Failed to add product");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?._id) return;
    try {
      await fetcher(`/products/${deleteItem._id}`, "DELETE");
      toast.success("Product deleted");
      setDeleteItem(null);
      refreshProducts();
    } catch (error) {
      toast.error(error.message || "Failed to delete product");
    }
  };

  const productItems = useMemo(
    () =>
      Array.isArray(products?.products)
        ? products.products
        : Array.isArray(products)
          ? products
          : [],
    [products],
  );

  const getBrandLabel = (item) => {
    if (Array.isArray(item.brand)) {
      return item.brand
        .map((brand) => brand?.name || brand?.brand_name || brand)
        .filter(Boolean)
        .join(", ");
    }
    return item.brand?.name || item.brand?.brand_name || "-";
  };

  const getModelLabel = (item) => {
    if (Array.isArray(item.model)) {
      return item.model
        .map((model) => model?.name || model?.model_name || model)
        .filter(Boolean)
        .join(", ");
    }
    return item.model?.name || item.model?.model_name || "-";
  };

  const filteredProducts = useMemo(
    () =>
      productItems.filter((p) => {
        const textMatch = `${p.name || p.title || ""} ${stripHtml(p.description || "")} ${getBrandLabel(p)} ${getModelLabel(p)}`
          .toLowerCase()
          .includes(search.toLowerCase());

        const brandMatch = getBrandLabel(p)
          .toLowerCase()
          .includes(brandSearch.toLowerCase());

        const modelMatch = getModelLabel(p)
          .toLowerCase()
          .includes(modelSearch.toLowerCase());

        return textMatch && brandMatch && modelMatch;
      }),
    [productItems, search, brandSearch, modelSearch],
  );

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="overflow-hidden rounded-[28px] border border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,247,255,0.95))] shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
      >
        <div className="border-b border-border/50 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Catalog Manager
          </p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">
            Add Product
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a product entry with model mapping, rich details, and reference images.
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 rounded-2xl border border-border/60 bg-card/80 p-4">
              <Label>Category</Label>
              <Select
                key={`category-${formResetKey}`}
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name || cat.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-2xl border border-border/60 bg-card/80 p-4">
              <Label>Brand</Label>
              <MultiSelect
                key={`brand-${formResetKey}`}
                options={brands.map((brand) => ({
                  ...brand,
                  name: brand.name || brand.brand_name,
                }))}
                value={form.brandIds}
                onChange={(value) =>
                  setForm({ ...form, brandIds: value, modelIds: [] })
                }
                placeholder="Select Brand(s)"
                valueKey="_id"
                labelKey="name"
              />
            </div>

            <div className="space-y-2 rounded-2xl border border-border/60 bg-card/80 p-4">
              <Label>Model</Label>
              <MultiSelect
                key={`model-${formResetKey}`}
                options={models
                  .filter((m) => {
                    if (!form.brandIds.length) return true;
                    const modelBrand =
                      m.brand?._id || m.brand_id?._id || m.brand_id || m.brand;
                    return form.brandIds.includes(String(modelBrand));
                  })
                  .map((model) => ({
                    ...model,
                    name: model.name || model.model_name,
                  }))}
                value={form.modelIds}
                onChange={(value) => setForm({ ...form, modelIds: value })}
                placeholder="Select Model(s)"
                valueKey="_id"
                labelKey="name"
              />
            </div>

            <div className="space-y-2 rounded-2xl border border-border/60 bg-card/80 p-4">
              <Label>Price</Label>
              <Input
                placeholder="Amount"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                key={`description-${formResetKey}`}
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <Label>Reference Images</Label>
                <p className="text-xs text-muted-foreground">
                  Upload multiple supporting images before saving the product.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {form.referenceImages.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="relative h-20 w-20 overflow-hidden rounded-xl border bg-muted shadow-sm"
                  >
                    <img
                      src={image}
                      alt={`Reference ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeReferenceImage(image)}
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                <label className="flex h-24 min-w-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/70 px-4 text-sm text-muted-foreground transition-colors hover:bg-muted/50">
                  <Upload className="h-4 w-4" />
                  <span className="text-center font-medium">
                    {isUploadingImages ? "Uploading..." : "Upload Images"}
                  </span>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploadingImages}
                    onChange={(e) =>
                      handleReferenceImageUpload(e.target.files, e.target)
                    }
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Required fields: category, brand, model, price, and description.
            </p>
            <Button type="submit" className="h-11 rounded-xl px-6">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 border-b border-border/50 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Product Library
            </p>
            <h3 className="mt-2 text-xl font-semibold">Browse Products</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Filter by brand and model to quickly find the exact catalog entry.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:min-w-[620px]">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                General
              </Label>
              <Input
                placeholder="Search product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Brand
              </Label>
              <Input
                placeholder="Search brand..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2 sm:col-span-2 xl:col-span-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Model
              </Label>
              <Input
                placeholder="Search model..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-border/50 bg-muted/20 px-5 py-4 sm:grid-cols-3 sm:px-6">
          <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total Products
            </p>
            <p className="mt-2 text-2xl font-semibold">{productItems.length}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Visible Results
            </p>
            <p className="mt-2 text-2xl font-semibold">{filteredProducts.length}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Active Filters
            </p>
            <p className="mt-2 text-lg font-semibold">
              {[search, brandSearch, modelSearch].filter(Boolean).length}
            </p>
          </div>
        </div>

        <div className="block lg:hidden space-y-3 p-4 sm:p-6">
          {filteredProducts?.length ? (
            filteredProducts.map((item, index) => (
              <div
                key={item._id}
                className="rounded-2xl border border-border/60 bg-background p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Product #{index + 1}
                    </p>
                    <p className="mt-1 font-semibold">{getBrandLabel(item)}</p>
                    <p className="text-sm text-muted-foreground">
                      {getModelLabel(item)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full bg-red-500 p-2 text-white"
                    onClick={() => setDeleteItem(item)}
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Category
                    </p>
                    <p className="mt-1 font-medium">
                      {item.category?.name || item.category?.category_name || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Price
                    </p>
                    <p className="mt-1 font-medium">{item.price || item.amount || "-"}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Description
                  </p>
                  <p className="mt-1 text-sm text-foreground/85">
                    {stripHtml(item.description) || "-"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No products match the current filters.
            </div>
          )}
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SL</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.length ? (
                filteredProducts.map((item, index) => (
                  <TableRow key={item._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{getBrandLabel(item)}</TableCell>
                    <TableCell>{getModelLabel(item)}</TableCell>
                    <TableCell>
                      {item.category?.name || item.category?.category_name || "-"}
                    </TableCell>
                    <TableCell>{item.price || item.amount || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {stripHtml(item.description) || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        className="rounded-full bg-red-500 p-2 text-white"
                        onClick={() => setDeleteItem(item)}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No products match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
