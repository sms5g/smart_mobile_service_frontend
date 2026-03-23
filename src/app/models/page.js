"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Edit, Plus, Trash } from "lucide-react";
import { toast } from "react-toastify";
import ImageUploader from "@/components/layout/ImageUploader";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { fetcher } from "@/lib/fetcher";

export default function Models() {
  const [items, setItems] = useState([]);
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    brand: "",
    name: "",
    image: "",
  });
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchData = async () => {
    try {
      const [modelRes, brandRes] = await Promise.all([
        fetcher("/models"),
        fetcher("/brands"),
      ]);
      setItems(modelRes.data || modelRes || []);
      setBrands(brandRes.data || brandRes || []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = items.filter((item) =>
    (item.name || item.model_name || "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.brand) return;

    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand,
        ...(form.image ? { image: form.image } : {}),
      };

      const res = await fetcher("/models", "POST", payload);
      setItems((prev) => [res.data || res, ...prev]);
      setForm({ brand: "", name: "", image: "" });
      toast.success("Model added");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!editItem?._id) return;
    try {
      const payload = {
        name: (editItem.name || editItem.model_name || "").trim(),
        brand:
          editItem.brand?._id ||
          editItem.brand_id?._id ||
          editItem.brand_id ||
          editItem.brand,
        ...(editItem.image || editItem.model_image
          ? { image: editItem.image || editItem.model_image }
          : {}),
      };
      const res = await fetcher(`/models/${editItem._id}`, "PUT", payload);

      setItems((prev) =>
        prev.map((item) =>
          item._id === editItem._id ? res.data || res : item,
        ),
      );
      setEditItem(null);
      toast.success("Model updated");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?._id) return;
    try {
      await fetcher(`/models/${deleteItem._id}`, "DELETE");
      setItems((prev) => prev.filter((item) => item._id !== deleteItem._id));
      setDeleteItem(null);
      toast.success("Model deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="bg-card border rounded-2xl p-6 shadow-sm"
      >
        <h3 className="font-semibold mb-4">Add Model</h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Select
              value={form.brand}
              onValueChange={(value) => setForm({ ...form, brand: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand._id} value={brand._id}>
                    {brand.name || brand.brand_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Model name"
            />
          </div>

          <ImageUploader
            value={form.image}
            onChange={(img) => setForm({ ...form, image: img })}
          />

          <Button type="submit" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Model
          </Button>
        </div>
      </form>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Model List</h3>

        <div className="mb-4 flex justify-end">
          <Input
            className="w-full max-w-80"
            placeholder="Search by model name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2">SL</th>
              <th className="border p-2">Brand</th>
              <th className="border p-2">Model Name</th>
              <th className="border p-2">Image</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <tr key={item._id}>
                  <td className="p-2 text-center">{index + 1}</td>
                  <td className="p-2 text-center">
                    {item.brand?.name ||
                      item.brand_id?.name ||
                      item.brand_id?.brand_name ||
                      "—"}
                  </td>
                  <td className="p-2 font-semibold text-center ">
                    {item.name || item.model_name}
                  </td>
                  <td className="p-2 text-center ">
                    {item.image || item.model_image ? (
                      <img
                        src={item.image || item.model_image}
                        alt={item.name || item.model_name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex justify-center gap-3">
                      <button
                        className="p-2 text-sm border rounded-full bg-black text-white"
                        onClick={() => setEditItem(item)}
                        type="button"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-sm border rounded-full bg-red-500 text-white"
                        onClick={() => setDeleteItem(item)}
                        type="button"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="border p-4 text-center">
                  No models found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={editItem?.name || editItem?.model_name || ""}
              onChange={(e) =>
                setEditItem({
                  ...editItem,
                  name: e.target.value,
                })
              }
            />

            <ImageUploader
              value={editItem?.image || editItem?.model_image || ""}
              onChange={(img) =>
                setEditItem({
                  ...editItem,
                  image: img,
                  model_image: img,
                })
              }
            />
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
