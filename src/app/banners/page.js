"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Plus, Power, Trash } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import ImageUploader from "@/components/layout/ImageUploader";
import { fetcher } from "@/lib/fetcher";

const getFirst = (obj, keys, fallback = "") => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && `${value}` !== "") return value;
  }
  return fallback;
};

const normalizeBanner = (banner) => ({
  ...banner,
  _id: getFirst(banner, ["_id", "id"]),
  title: getFirst(banner, ["title", "name", "heading"]),
  image: getFirst(banner, ["image", "banner", "url", "imageUrl"]),
  isActive:
    banner?.isActive ??
    banner?.active ??
    banner?.is_enabled ??
    (banner?.status === "active"),
  createdAt: getFirst(banner, ["createdAt", "created_at"]),
});

export default function BannersPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", image: "" });
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetcher("/banners");
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setItems(list.map(normalizeBanner));
    } catch (err) {
      toast.error(err.message || "Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        (item.title || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const buildBannerPayload = (data) => {
    const hasImage = Boolean(data.image);
    const hasTitle = Boolean(data.title?.trim());

    if (!hasImage && !hasTitle) return null;

    return {
      ...(hasTitle ? { title: data.title.trim() } : {}),
      ...(hasImage ? { image: data.image } : {}),
    };
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    setActionLoading("create");
    try {
      const payload = buildBannerPayload(form);
      const res = await fetcher("/banners", "POST", payload);
      const newItem = normalizeBanner(res?.data || res || {});
      if (newItem?._id) {
        setItems((prev) => [newItem, ...prev]);
      } else {
        fetchBanners();
      }
      setForm({ title: "", image: "" });
      toast.success("Banner added");
    } catch (err) {
      toast.error(err.message || "Failed to add banner");
    } finally {
      setActionLoading("");
    }
  };

  const handleUpdate = async () => {
    if (!editItem?._id) return;

    setActionLoading(`update-${editItem._id}`);
    try {
      const payload = buildBannerPayload(editItem);
      const res = await fetcher(`/banners/${editItem._id}`, "PUT", payload);
      const updated = normalizeBanner(res?.data || res || editItem);
      setItems((prev) =>
        prev.map((item) => (item._id === editItem._id ? updated : item)),
      );
      setEditItem(null);
      toast.success("Banner updated");
    } catch (err) {
      toast.error(err.message || "Failed to update banner");
    } finally {
      setActionLoading("");
    }
  };

  const handleToggle = async (item) => {
    if (!item?._id) return;

    setActionLoading(`toggle-${item._id}`);
    try {
      const res = await fetcher(`/banners/toggle/${item._id}`, "PATCH");
      const updated = normalizeBanner(res?.data || res || item);
      setItems((prev) =>
        prev.map((row) => (row._id === item._id ? updated : row)),
      );
      toast.success("Banner status updated");
    } catch (err) {
      toast.error(err.message || "Failed to toggle banner");
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?._id) return;

    setActionLoading(`delete-${deleteItem._id}`);
    try {
      await fetcher(`/banners/${deleteItem._id}`, "DELETE");
      setItems((prev) => prev.filter((item) => item._id !== deleteItem._id));
      setDeleteItem(null);
      toast.success("Banner deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete banner");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="bg-card border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Add Banner</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Banner title (optional)"
            />
          </div>

          <ImageUploader
            value={form.image}
            onChange={(img) => setForm({ ...form, image: img })}
          />
        </div>

        <Button type="submit" className="mt-4" disabled={actionLoading === "create"}>
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>
      </form>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Banner List</h3>
          <Button variant="outline" onClick={fetchBanners} disabled={loading}>
            Refresh
          </Button>
        </div>

        <div className="mb-4 flex justify-end">
          <Input
            className="w-full max-w-80"
            placeholder="Search by banner title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-left">SL</th>
              <th className="border p-2 text-left">Title</th>
              <th className="border p-2 text-left">Image</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <tr key={item._id || index} className="border-b">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 font-semibold">{item.title || "-"}</td>
                  <td className="p-2">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title || "Banner"}
                        className="h-10 w-16 object-cover rounded border"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        type="button"
                        className="p-2 border rounded-full bg-black text-white"
                        onClick={() => setEditItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        className="p-2 border rounded-full bg-blue-600 text-white disabled:opacity-60"
                        onClick={() => handleToggle(item)}
                        disabled={actionLoading === `toggle-${item._id}`}
                      >
                        <Power className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        className="p-2 border rounded-full bg-red-500 text-white disabled:opacity-60"
                        onClick={() => setDeleteItem(item)}
                        disabled={actionLoading === `delete-${item._id}`}
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
                  {loading ? "Loading banners..." : "No banners found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                value={editItem?.title || ""}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    title: e.target.value,
                  })
                }
              />
            </div>

            <ImageUploader
              value={editItem?.image}
              onChange={(img) => setEditItem({ ...editItem, image: img })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={actionLoading === `update-${editItem?._id}`}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete banner?"
        description="This banner will be permanently removed."
      />
    </div>
  );
}
