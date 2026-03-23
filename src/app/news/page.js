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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarDays, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { fetcher } from "@/lib/fetcher";

const getFirst = (obj, keys, fallback = "") => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && `${value}` !== "") return value;
  }
  return fallback;
};

const normalizeNews = (item = {}) => ({
  ...item,
  _id: getFirst(item, ["_id", "id"]),
  title: getFirst(item, ["title", "name"]),
  description: getFirst(item, ["description", "content", "text"]),
  publishDate: getFirst(item, ["publishDate", "publish_date", "date"]),
});

export default function NewsPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    publishDate: new Date().toISOString().slice(0, 10),
  });
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await fetcher("/news?page=1&limit=100");
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : Array.isArray(res?.data?.news)
            ? res.data.news
            : [];
      setItems(list.map(normalizeNews));
    } catch (error) {
      toast.error(error.message || "Failed to fetch news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const filteredNews = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    );
  }, [items, search]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (
      !form.title.trim() ||
      isRichTextEmpty(form.description) ||
      !form.publishDate
    ) {
      toast.error("Please fill all news fields");
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        publishDate: form.publishDate,
      };
      const res = await fetcher("/news", "POST", payload);
      const created = normalizeNews(res?.data || res || payload);
      if (created._id) {
        setItems((prev) => [created, ...prev]);
      } else {
        loadNews();
      }
      setForm({
        title: "",
        description: "",
        publishDate: new Date().toISOString().slice(0, 10),
      });
      toast.success("News added");
    } catch (error) {
      toast.error(error.message || "Failed to add news");
    }
  };

  const handleUpdate = async () => {
    if (!editItem?._id) return;
    try {
      const payload = {
        title: editItem.title,
        description: editItem.description,
        publishDate: editItem.publishDate,
      };
      const res = await fetcher(`/news/${editItem._id}`, "PUT", payload);
      const updated = normalizeNews(res?.data || res || payload);
      setItems((prev) =>
        prev.map((item) => (item._id === editItem._id ? { ...item, ...updated } : item)),
      );
      setEditItem(null);
      toast.success("News updated");
    } catch (error) {
      toast.error(error.message || "Failed to update news");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?._id) return;
    try {
      await fetcher(`/news/${deleteItem._id}`, "DELETE");
      setItems((prev) => prev.filter((item) => item._id !== deleteItem._id));
      setDeleteItem(null);
      toast.success("News deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete news");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="bg-card border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Add News</h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="News title"
            />
          </div>

          <div className="space-y-2">
            <Label>Publish Date</Label>
            <div className="relative">
              <CalendarDays className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                type="date"
                value={form.publishDate}
                onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label>Description</Label>
          <RichTextEditor
            value={form.description}
            onChange={(value) => setForm({ ...form, description: value })}
            placeholder="Write news for your users..."
            className=""
          />
        </div>

        <Button type="submit" className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Add News
        </Button>
      </form>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h3 className="font-semibold">News List</h3>
          <Button variant="outline" onClick={loadNews} disabled={loading}>
            Refresh
          </Button>
        </div>

        <div className="mb-4 flex justify-end">
          <Input
            className="w-full max-w-80"
            placeholder="Search by title/description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-left">SL</th>
              <th className="border p-2 text-left">Title</th>
              <th className="border p-2 text-left">Publish Date</th>
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNews.length > 0 ? (
              filteredNews.map((item, index) => (
                <tr key={item._id || index} className="border-b">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 font-medium">{item.title || "-"}</td>
                  <td className="p-2">
                    {item.publishDate
                      ? new Date(item.publishDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-2 max-w-md truncate">
                    {stripHtml(item.description) || "-"}
                  </td>
                  <td className="p-2">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        type="button"
                        className="p-2 border rounded-full bg-black text-white"
                        onClick={() => setEditItem(item)}
                        title="Edit news"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-2 border rounded-full bg-red-600 text-white"
                        onClick={() => setDeleteItem(item)}
                        title="Delete news"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="border p-4 text-center">
                  {loading ? "Loading news..." : "No news found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit News</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
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

            <div className="space-y-2">
              <Label>Publish Date</Label>
              <Input
                type="date"
                value={editItem?.publishDate?.slice?.(0, 10) || editItem?.publishDate || ""}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    publishDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                value={editItem?.description || ""}
                onChange={(value) =>
                  setEditItem({
                    ...editItem,
                    description: value,
                  })
                }
              />
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
        title="Delete news?"
        description="This news item will be removed permanently."
      />
    </div>
  );
}
