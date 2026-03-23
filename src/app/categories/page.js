"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Edit, Plus, Trash } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import ImageUploader from "@/components/layout/ImageUploader";
import { fetcher } from "@/lib/fetcher";

export default function Categories() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const refresh = async () => {
    try {
      const res = await fetcher("/categories");
      setItems(res.data || res || []);
    } catch (error) {
      toast.error("Failed to fetch categories");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const payload = {
        name: name.trim(),
        ...(image ? { image } : {}),
      };
      await fetcher("/categories", "post", payload);

      setName("");
      setImage("");
      refresh();
      toast.success("Category added");
    } catch (error) {
      toast.error("Failed to add category");
    }
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    const payload = {
      name: (editItem.name || editItem.category_name || "").trim(),
      ...(editItem.image ? { image: editItem.image } : {}),
    };

    try {
      await fetcher(
        `/categories/${editItem._id}`,
        "put",
        payload,
      );

      setEditItem(null);
      refresh();
      toast.success("Category updated");
    } catch (error) {
      toast.error("Failed to update category");
    }
  };

  // ✅ Delete Category
  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      await fetcher(
        `/categories/${deleteItem._id}`,
        "delete",
      );

      setDeleteItem(null);
      refresh();
      toast.success("Category deleted");
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div>
      {/* Add Category Form */}
      <form
        onSubmit={handleAdd}
        className="bg-card border rounded-2xl p-6 mb-6 shadow-sm"
      >
        <h3 className="font-semibold mb-4 text-foreground">Add Category</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
            />
          </div>

          <ImageUploader value={image} onChange={setImage} />
        </div>

        <Button type="submit" className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </form>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left">
              <th className="px-4 py-3 w-40">SL No.</th>
              <th className="px-4 py-3">Category Name</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items?.map((item, index) => (
              <tr
                key={item._id}
                className="border-t hover:bg-muted/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium w-40">{index + 1}</td>

                <td className="px-4 py-3">{item.name || item.category_name}</td>

                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      className="p-2 text-sm border flex gap-2 items-center justify-end rounded-full bg-black text-white"
                      onClick={() => setEditItem(item)}
                    >
                      <Edit className="h-4 w-4" />  
                    </button>

                    <button
                      className="p-2 text-sm border flex gap-2 items-center justify-end rounded-full bg-red-500 text-white"
                      onClick={() => setDeleteItem(item)}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editItem?.name || editItem?.category_name || ""}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <ImageUploader
              value={editItem?.image}
              onChange={(img) =>
                setEditItem({
                  ...editItem,
                  image: img,
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
