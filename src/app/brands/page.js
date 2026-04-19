"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export default function Brands() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [brandName, setBrandName] = useState("");
  const [image, setImage] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchBrands = async () => {
    try {
      const res = await fetcher("/brands");
      setItems(res.data || res || []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const filteredItems = items.filter((item) =>
    (item.name || item.brand_name || "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    try {
      const payload = {
        name: brandName.trim(),
        ...(image ? { image } : {}),
      };
      const res = await fetcher("/brands", "POST", payload);

      setItems((prev) => [res.data || res, ...prev]);
      setBrandName("");
      setImage("");
      toast.success("Brand added");
      fetchBrands();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetcher(`/brands/${editItem._id}`, "PUT", {
        name: (editItem.name || editItem.brand_name || "").trim(),
        ...(editItem.image ? { image: editItem.image } : {}),
      });

      setItems((prev) =>
        prev.map((item) =>
          item._id === editItem._id ? res.data || res : item,
        ),
      );

      setEditItem(null);
      toast.success("Brand updated");
      fetchBrands();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await fetcher(`/brands/${deleteItem._id}`, "DELETE", {});

      setItems((prev) => prev.filter((item) => item._id !== deleteItem._id));

      setDeleteItem(null);
      toast.success("Brand deleted");
      fetchBrands();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="bg-card border rounded-2xl p-2 md:p-6 shadow-sm"
      >
        <h3 className="font-semibold mb-4">Add Brand</h3>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="space-y-2 md:w-80 w-60">
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Brand name"
            />
          </div>

          <ImageUploader value={image} onChange={setImage} />
          <div className="flex gap-3 items-center justify-end">
            <Button type="submit">Submit</Button>
            <Button
              variant="destructive"
              type="button"
              onClick={() => {
                setBrandName("");
                setImage("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>

      <div className="bg-card border rounded-2xl p-2 shadow-sm">
        <h3 className="font-semibold mb-4 px-2">Brand List</h3>

        {/* Search */}
        <div className="mb-4 flex justify-end">
          <Input
            className="w-full max-w-80"
            placeholder="Search by brand name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-left">SL</th>
              <th className="border p-2 text-left">Brand Name</th>
              <th className="border p-2 text-left">Image</th>
              <th className="border p-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <tr key={item._id} className="border-b">
                  <td className=" p-2">{index + 1}</td>

                  <td className=" p-2 font-semibold">
                    {item.name || item.brand_name}
                  </td>

                  <td className=" p-2">
                    {item?.image ? (
                      <Image
                        src={item.image}
                        alt={item.name || item.brand_name}
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="flex justify-end items-center p-2 text-end space-x-2">
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
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="border p-4 text-center">
                  No matching brands found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={editItem?.name || editItem?.brand_name || ""}
              onChange={(e) =>
                setEditItem({
                  ...editItem,
                  name: e.target.value,
                })
              }
            />

            <ImageUploader
              value={editItem?.image}
              onChange={(img) => setEditItem({ ...editItem, image: img })}
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
