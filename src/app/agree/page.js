"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor, {
  isRichTextEmpty,
  stripHtml,
} from "@/components/ui/rich-text-editor";
import { fetcher } from "@/lib/fetcher";
import { toast } from "react-toastify";
import { Edit, Plus } from "lucide-react";

const AGREE_GET_ENDPOINTS = ["/cms/agree", "/cms/agreement"];
const AGREE_UPDATE_ENDPOINT = "/cms/agree";
const AGREE_CREATE_ENDPOINTS = ["/cms/agree", "/cms/agreement"];

const getValue = (obj, keys, fallback = "") => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && `${value}` !== "") return value;
  }
  return fallback;
};

const normalizeItem = (item = {}) => ({
  _id: getValue(item, ["_id", "id"]),
  title: getValue(item, ["title", "name"], "Agree"),
  content: getValue(item, ["content", "description", "text"]),
  updatedAt: getValue(item, ["updatedAt", "updated_at", "createdAt", "created_at"]),
});

export default function AgreePage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    title: "",
    content: "",
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const loadAgree = async () => {
    setLoading(true);
    let lastError = null;

    for (const endpoint of AGREE_GET_ENDPOINTS) {
      try {
        const res = await fetcher(endpoint);
        const data = res?.data || res || {};
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [data];

        setRows(list.map(normalizeItem).filter((item) => item.title || item.content));
        setLoading(false);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    setRows([]);
    setLoading(false);
    toast.error(lastError?.message || "Failed to load Agree content");
  };

  useEffect(() => {
    loadAgree();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Agree title is required");
      return;
    }

    if (isRichTextEmpty(form.content)) {
      toast.error("Agree content is required");
      return;
    }

    setCreating(true);
    const payload = {
      title: form.title.trim(),
      content: form.content,
    };

    let lastError = null;

    for (const endpoint of AGREE_CREATE_ENDPOINTS) {
      try {
        const res = await fetcher(endpoint, "POST", payload);
        const created = normalizeItem(res?.data || res || payload);
        setRows((prev) => [created, ...prev]);
        setForm({ title: "", content: "" });
        toast.success("Agree section added");
        setCreating(false);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    toast.error(lastError?.message || "Failed to add Agree section");
    setCreating(false);
  };

  const handleSave = async () => {
    if (!editItem) return;
    if (isRichTextEmpty(editItem.content)) {
      toast.error("Agree content is required");
      return;
    }

    setSaving(true);
    try {
      if (editItem._id) {
        try {
          await fetcher(`${AGREE_UPDATE_ENDPOINT}/${editItem._id}`, "PUT", {
            title: editItem.title,
            content: editItem.content,
          });
        } catch {
          await fetcher(AGREE_UPDATE_ENDPOINT, "PUT", {
            title: editItem.title,
            content: editItem.content,
          });
        }
      } else {
        await fetcher(AGREE_UPDATE_ENDPOINT, "PUT", {
          title: editItem.title,
          content: editItem.content,
        });
      }

      toast.success("Agree section updated");
      setEditItem(null);
      loadAgree();
    } catch (error) {
      toast.error(error.message || "Failed to update Agree content");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="bg-card border rounded-2xl p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold mb-4">Add Agree Section</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="I Agree title"
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              value={form.content}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, content: value }))
              }
              placeholder="Write the agree section content..."
            />
          </div>
        </div>

        <Button type="submit" className="mt-4" disabled={creating}>
          <Plus className="h-4 w-4 mr-2" />
          {creating ? "Adding..." : "Add Agree Section"}
        </Button>
      </form>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Agree Sections</h2>
          <Button variant="outline" onClick={loadAgree} disabled={loading}>
            Refresh
          </Button>
        </div>

        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-left">SL</th>
              <th className="border p-2 text-left">Title</th>
              <th className="border p-2 text-left">Content</th>
              <th className="border p-2 text-left">Updated</th>
              <th className="border p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((item, index) => (
                <tr key={item._id || index} className="border-b">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 font-medium">{item.title || "-"}</td>
                  <td className="p-2 max-w-xl truncate">{stripHtml(item.content) || "-"}</td>
                  <td className="p-2">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-"}
                  </td>
                  <td className="p-2 text-right">
                    <button
                      type="button"
                      className="p-2 border rounded-full bg-black text-white"
                      onClick={() => setEditItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="border p-4 text-center">
                  {loading ? "Loading agree sections..." : "No agree section found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Agree Section</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editItem?.title || ""}
                onChange={(e) =>
                  setEditItem((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor
                value={editItem?.content || ""}
                onChange={(value) =>
                  setEditItem((prev) => ({ ...prev, content: value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
