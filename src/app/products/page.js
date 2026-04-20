"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, Trash, Upload, X } from "lucide-react";
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
  const [modelOptions, setModelOptions] = useState([]);
  const [editModelOptions, setEditModelOptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingEditImages, setIsUploadingEditImages] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingEditModels, setIsLoadingEditModels] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [editFormResetKey, setEditFormResetKey] = useState(0);

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

  const normalizeModelOptions = useCallback((items = []) => {
    const uniqueModels = new Map();

    items.forEach((model) => {
      const id = String(model?._id || model?.id || "");
      if (!id) return;

      uniqueModels.set(id, {
        ...model,
        _id: id,
        name: model.name || model.model_name || "",
        disabled: Boolean(model.isChecked),
      });
    });

    return Array.from(uniqueModels.values());
  }, []);

  const fetchModelOptions = useCallback(
    async (categoryId, brandIds = []) => {
      if (!categoryId || !brandIds.length) return [];

      const responses = await Promise.all(
        brandIds.map((brandId) =>
          fetcher(
            `/products/getModelOptions?category=${encodeURIComponent(
              categoryId,
            )}&brand=${encodeURIComponent(brandId)}`,
          ),
        ),
      );

      return normalizeModelOptions(
        responses.flatMap((response) => response?.data || response || []),
      );
    },
    [normalizeModelOptions],
  );

  useEffect(() => {
    let isCurrent = true;

    const loadModels = async () => {
      if (!form.category || !form.brandIds.length) {
        setModelOptions([]);
        setIsLoadingModels(false);
        return;
      }

      try {
        setIsLoadingModels(true);
        const options = await fetchModelOptions(form.category, form.brandIds);

        if (isCurrent) {
          setModelOptions(options);
          setForm((prev) => ({
            ...prev,
            modelIds: prev.modelIds.filter((modelId) =>
              options.some(
                (option) =>
                  String(option._id) === String(modelId) && !option.disabled,
              ),
            ),
          }));
        }
      } catch (error) {
        if (isCurrent) {
          setModelOptions([]);
          toast.error(error.message || "Failed to fetch model options");
        }
      } finally {
        if (isCurrent) setIsLoadingModels(false);
      }
    };

    loadModels();

    return () => {
      isCurrent = false;
    };
  }, [fetchModelOptions, form.brandIds, form.category]);

  useEffect(() => {
    let isCurrent = true;

    const loadModels = async () => {
      if (!editItem || !editForm.category || !editForm.brandIds.length) {
        setEditModelOptions([]);
        setIsLoadingEditModels(false);
        return;
      }

      try {
        setIsLoadingEditModels(true);
        const options = await fetchModelOptions(
          editForm.category,
          editForm.brandIds,
        );

        if (isCurrent) {
          setEditModelOptions(options);
          setEditForm((prev) => ({
            ...prev,
            modelIds: prev.modelIds.filter((modelId) =>
              options.some((option) => String(option._id) === String(modelId)),
            ),
          }));
        }
      } catch (error) {
        if (isCurrent) {
          setEditModelOptions([]);
          toast.error(error.message || "Failed to fetch model options");
        }
      } finally {
        if (isCurrent) setIsLoadingEditModels(false);
      }
    };

    loadModels();

    return () => {
      isCurrent = false;
    };
  }, [editForm.brandIds, editForm.category, editItem, fetchModelOptions]);

  const handleReferenceImageUpload = async (
    files,
    input,
    setTargetForm = setForm,
    setUploading = setIsUploadingImages,
  ) => {
    const validFiles = Array.from(files || []);
    if (!validFiles.length) return;

    try {
      setUploading(true);
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

      setTargetForm((prev) => ({
        ...prev,
        referenceImages: [...prev.referenceImages, ...uploadedImages],
      }));
      toast.success("Reference image uploaded");
    } catch (error) {
      toast.error(error.message || "Failed to upload reference images");
    } finally {
      setUploading(false);
      if (input) input.value = "";
    }
  };

  const removeReferenceImage = (imageUrl, setTargetForm = setForm) => {
    setTargetForm((prev) => ({
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

    const hasUnavailableModel = form.modelIds.some((modelId) =>
      modelOptions.some(
        (model) => String(model._id) === String(modelId) && model.disabled,
      ),
    );

    if (hasUnavailableModel) {
      toast.error("Selected model is already added");
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

  const handleUpdate = async () => {
    if (!editItem?._id) return;

    if (
      !editForm.category ||
      !editForm.brandIds.length ||
      !editForm.modelIds.length ||
      !editForm.price ||
      isRichTextEmpty(editForm.description)
    ) {
      toast.error("All required fields must be filled");
      return;
    }

    try {
      const payload = {
        category: editForm.category,
        brand: editForm.brandIds,
        model: editForm.modelIds,
        price: Number(editForm.price),
        description: editForm.description,
        referenceImages: editForm.referenceImages,
      };

      await fetcher(`/products/${editItem._id}`, "PUT", payload);

      setEditItem(null);
      setEditForm(INITIAL_FORM);
      toast.success("Product updated");
      refreshProducts();
    } catch (error) {
      toast.error(error.message || "Failed to update product");
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

  const brandMap = useMemo(
    () =>
      new Map(
        brands.map((brand) => [
          String(brand._id),
          brand.name || brand.brand_name || "",
        ]),
      ),
    [brands],
  );

  const modelMap = useMemo(
    () =>
      new Map(
        [...models, ...modelOptions, ...editModelOptions].map((model) => [
          String(model._id),
          model.name || model.model_name || "",
        ]),
      ),
    [editModelOptions, modelOptions, models],
  );

  const categoryMap = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          String(category._id),
          category.name || category.category_name || "",
        ]),
      ),
    [categories],
  );

  const getOptionLabel = useCallback((value, map, fieldNames = []) => {
    if (!value) return "";

    if (typeof value === "object") {
      for (const fieldName of fieldNames) {
        if (value[fieldName]) return value[fieldName];
      }

      const id = value._id || value.id;
      return id ? map.get(String(id)) || "" : "";
    }

    return map.get(String(value)) || String(value);
  }, []);

  const normalizeValues = useCallback((value) => {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }, []);

  const getOptionId = useCallback((value) => {
    if (!value) return "";
    if (typeof value === "object") return String(value._id || value.id || "");
    return String(value);
  }, []);

  const getSelectedIds = useCallback(
    (value) => normalizeValues(value).map(getOptionId).filter(Boolean),
    [getOptionId, normalizeValues],
  );

  const getBrandLabel = useCallback(
    (item) => {
      const labels = normalizeValues(item.brand || item.brand_id || item.brands)
        .map((brand) => getOptionLabel(brand, brandMap, ["name", "brand_name"]))
        .filter(Boolean);

      return labels.length ? labels.join(", ") : "-";
    },
    [brandMap, getOptionLabel, normalizeValues],
  );

  const getModelLabel = useCallback(
    (item) => {
      const labels = normalizeValues(item.model || item.model_id || item.models)
        .map((model) => getOptionLabel(model, modelMap, ["name", "model_name"]))
        .filter(Boolean);

      return labels.length ? labels.join(", ") : "-";
    },
    [getOptionLabel, modelMap, normalizeValues],
  );

  const getCategoryLabel = useCallback(
    (item) =>
      getOptionLabel(item.category || item.category_id, categoryMap, [
        "name",
        "category_name",
      ]) || "-",
    [categoryMap, getOptionLabel],
  );

  const openEditDialog = useCallback(
    (item) => {
      const brandIds = getSelectedIds(
        item.brand || item.brand_id || item.brands,
      );
      const modelIds = getSelectedIds(
        item.model || item.model_id || item.models,
      );
      const categoryId = getOptionId(item.category || item.category_id);

      setEditItem(item);
      setEditForm({
        category: categoryId,
        brandIds,
        modelIds,
        price: String(item.price || item.amount || ""),
        description: item.description || "",
        referenceImages: item.referenceImages || item.reference_images || [],
      });
      setEditFormResetKey((prev) => prev + 1);
    },
    [getOptionId, getSelectedIds],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const brandQuery = brandSearch.trim().toLowerCase();
    const modelQuery = modelSearch.trim().toLowerCase();

    return productItems.filter((p) => {
      const brandLabel = getBrandLabel(p);
      const modelLabel = getModelLabel(p);
      const categoryLabel = getCategoryLabel(p);
      const priceLabel = String(p.price || p.amount || "");

      const textMatch =
        `${p.name || p.title || ""} ${stripHtml(p.description || "")} ${brandLabel} ${modelLabel} ${categoryLabel} ${priceLabel}`
          .toLowerCase()
          .includes(query);

      const brandMatch = brandLabel.toLowerCase().includes(brandQuery);

      const modelMatch = modelLabel.toLowerCase().includes(modelQuery);

      return textMatch && brandMatch && modelMatch;
    });
  }, [
    productItems,
    search,
    brandSearch,
    modelSearch,
    getBrandLabel,
    getModelLabel,
    getCategoryLabel,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pageStartIndex = (currentPage - 1) * pageSize;
  const pageEndIndex = pageStartIndex + pageSize;

  const paginatedProducts = useMemo(
    () => filteredProducts.slice(pageStartIndex, pageEndIndex),
    [filteredProducts, pageEndIndex, pageStartIndex],
  );

  const paginationPages = useMemo(() => {
    const maxVisiblePages = 5;
    const start = Math.max(
      1,
      Math.min(
        currentPage - Math.floor(maxVisiblePages / 2),
        totalPages - maxVisiblePages + 1,
      ),
    );
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const firstVisibleProduct = filteredProducts.length ? pageStartIndex + 1 : 0;
  const lastVisibleProduct = Math.min(pageEndIndex, filteredProducts.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, brandSearch, modelSearch, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="overflow-hidden rounded-2xl border border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,247,255,0.95))] shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-[28px]"
      >
        <div className="border-b border-border/50 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Catalog Manager
          </p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">
            Add Product
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a product entry with model mapping, rich details, and
            reference images.
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 rounded-2xl border border-border/60 bg-card/80 p-4">
              <Label>Category</Label>
              <Select
                key={`category-${formResetKey}`}
                value={form.category}
                onValueChange={(value) =>
                  setForm({ ...form, category: value, modelIds: [] })
                }
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
                options={modelOptions}
                value={form.modelIds}
                onChange={(value) => setForm({ ...form, modelIds: value })}
                placeholder={
                  isLoadingModels ? "Loading models..." : "Select Model(s)"
                }
                valueKey="_id"
                labelKey="name"
                disabledKey="disabled"
                disabledLabel="Already added"
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
                    <Image
                      src={image}
                      alt={`Reference ${index + 1}`}
                      fill
                      sizes="80px"
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

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
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
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Per Page Products
            </Label>
            <Input
              placeholder="10"
              type="number"
              // min="1"
              value={pageSize}
              onChange={(e) =>  
                setPageSize(Math.max(1, Number(e.target.value)))
              }
              className=" rounded-md"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
          <div className="space-y-2">
            <Input
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Search brand..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="rounded-md"
            />
          </div>
          <div className="space-y-2 sm:col-span-2 xl:col-span-1">
            <Input
              placeholder="Search model..."
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              className="rounded-md"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full rounded-md"
              onClick={() => {
                setSearch("");
                setBrandSearch("");
                setModelSearch("");
                setCurrentPage(1);
              }}
              disabled={!search && !brandSearch && !modelSearch}
            >
              Reset
            </Button>
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
            <p className="mt-2 text-2xl font-semibold">
              {filteredProducts.length}
            </p>
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
          {paginatedProducts?.length ? (
            paginatedProducts.map((item, index) => (
              <div
                key={item._id}
                className="rounded-2xl border border-border/60 bg-background p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Product #{pageStartIndex + index + 1}
                    </p>
                    <p className="mt-1 font-semibold">{getBrandLabel(item)}</p>
                    <p className="text-sm text-muted-foreground">
                      {getModelLabel(item)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-black p-2 text-white"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-red-500 p-2 text-white"
                      onClick={() => setDeleteItem(item)}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Category
                    </p>
                    <p className="mt-1 font-medium">{getCategoryLabel(item)}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Price
                    </p>
                    <p className="mt-1 font-medium">
                      {item.price || item.amount || "-"}
                    </p>
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
              {paginatedProducts?.length ? (
                paginatedProducts.map((item, index) => (
                  <TableRow key={item._id}>
                    <TableCell>{pageStartIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {getBrandLabel(item)}
                    </TableCell>
                    <TableCell>{getModelLabel(item)}</TableCell>
                    <TableCell>{getCategoryLabel(item)}</TableCell>
                    <TableCell>{item.price || item.amount || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {stripHtml(item.description) || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        className="mr-2 rounded-full bg-black p-2 text-white"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
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

        <div className="flex flex-col gap-3 border-t border-border/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-muted-foreground">
            Showing {firstVisibleProduct}-{lastVisibleProduct} of{" "}
            {filteredProducts.length} products
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {paginationPages.map((page) => (
              <Button
                key={page}
                type="button"
                variant={currentPage === page ? "default" : "outline"}
                className="h-9 min-w-9 rounded-xl px-3"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}

            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={!!editItem}
        onOpenChange={(open) => {
          if (!open) {
            setEditItem(null);
            setEditForm(INITIAL_FORM);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  key={`edit-category-${editFormResetKey}`}
                  value={editForm.category}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, category: value, modelIds: [] })
                  }
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

              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  placeholder="Amount"
                  type="number"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Brand</Label>
                <MultiSelect
                  key={`edit-brand-${editFormResetKey}`}
                  options={brands.map((brand) => ({
                    ...brand,
                    name: brand.name || brand.brand_name,
                  }))}
                  value={editForm.brandIds}
                  onChange={(value) =>
                    setEditForm({
                      ...editForm,
                      brandIds: value,
                      modelIds: [],
                    })
                  }
                  placeholder="Select Brand(s)"
                  valueKey="_id"
                  labelKey="name"
                />
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <MultiSelect
                  key={`edit-model-${editFormResetKey}`}
                  options={editModelOptions}
                  value={editForm.modelIds}
                  onChange={(value) =>
                    setEditForm({ ...editForm, modelIds: value })
                  }
                  placeholder={
                    isLoadingEditModels
                      ? "Loading models..."
                      : "Select Model(s)"
                  }
                  valueKey="_id"
                  labelKey="name"
                  disabledKey="disabled"
                  disabledLabel="Already added"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                key={`edit-description-${editFormResetKey}`}
                value={editForm.description}
                onChange={(value) =>
                  setEditForm({ ...editForm, description: value })
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Reference Images</Label>
              <div className="flex flex-wrap items-center gap-3">
                {editForm.referenceImages.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="relative h-20 w-20 overflow-hidden rounded-xl border bg-muted shadow-sm"
                  >
                    <Image
                      src={image}
                      alt={`Reference ${index + 1}`}
                      fill
                      sizes="80px"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeReferenceImage(image, setEditForm)}
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                <label className="flex h-24 min-w-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/70 px-4 text-sm text-muted-foreground transition-colors hover:bg-muted/50">
                  <Upload className="h-4 w-4" />
                  <span className="text-center font-medium">
                    {isUploadingEditImages ? "Uploading..." : "Upload Images"}
                  </span>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploadingEditImages}
                    onChange={(e) =>
                      handleReferenceImageUpload(
                        e.target.files,
                        e.target,
                        setEditForm,
                        setIsUploadingEditImages,
                      )
                    }
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
