"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { RefreshCw, Trash2, UserCheck, UserX } from "lucide-react";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { fetcher } from "@/lib/fetcher";

const getFirst = (obj, keys, fallback = "") => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && `${value}` !== "") return value;
  }
  return fallback;
};

const normalizeUser = (item = {}) => {
  const id = getFirst(item, ["_id", "id"]);
  const statusValue = getFirst(item, ["status", "isActive", "active"], "");
  const isActive =
    typeof statusValue === "boolean"
      ? statusValue
      : ["active", "enabled", "true", "1"].includes(
          String(statusValue).toLowerCase(),
        );

  return {
    ...item,
    _id: id,
    name: getFirst(item, ["name", "fullName", "username"], "Unknown"),
    email: getFirst(item, ["email"], "-"),
    mobileNumber: getFirst(item, ["mobileNumber", "mobile", "phoneNumber"], "-"),
    isActive,
    createdAt: getFirst(item, ["createdAt", "created_at"]),
  };
};

export default function UsersPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [deleteItem, setDeleteItem] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetcher("/auth");
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setItems(list.map(normalizeUser));
    } catch (error) {
      toast.error(error.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.mobileNumber.toLowerCase().includes(q),
    );
  }, [items, search]);

  const handleToggleStatus = async (user) => {
    if (!user?._id) return;
    setActionLoading(`status-${user._id}`);
    try {
      const res = await fetcher(`/auth/status/${user._id}`, "PATCH");
      const updated = normalizeUser(res?.data || res || user);
      setItems((prev) =>
        prev.map((item) => (item._id === user._id ? updated : item)),
      );
      toast.success("User status updated");
    } catch (error) {
      toast.error(error.message || "Failed to update user status");
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?._id) return;
    setActionLoading(`delete-${deleteItem._id}`);
    try {
      await fetcher(`/auth/${deleteItem._id}`, "DELETE");
      setItems((prev) => prev.filter((item) => item._id !== deleteItem._id));
      setDeleteItem(null);
      toast.success("User deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Application Users</h2>
          <Button variant="outline" onClick={loadUsers} disabled={loading} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="mb-4 flex justify-end">
          <Input
            className="w-full max-w-80"
            placeholder="Search by name, email, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-left">SL</th>
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Mobile</th>
              <th className="border p-2 text-left">Joined</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <tr key={user._id || index} className="border-b">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 font-medium">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.mobileNumber}</td>
                  <td className="p-2">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        type="button"
                        className={`p-2 border rounded-full text-white ${user.isActive ? "bg-amber-500" : "bg-green-600"} disabled:opacity-60`}
                        onClick={() => handleToggleStatus(user)}
                        disabled={actionLoading === `status-${user._id}`}
                        title={user.isActive ? "Deactivate user" : "Activate user"}
                      >
                        {user.isActive ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="p-2 border rounded-full bg-red-600 text-white disabled:opacity-60"
                        onClick={() => setDeleteItem(user)}
                        disabled={actionLoading === `delete-${user._id}`}
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="border p-4 text-center">
                  {loading ? "Loading users..." : "No users found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete user?"
        description="This user account will be removed permanently."
      />
    </div>
  );
}
