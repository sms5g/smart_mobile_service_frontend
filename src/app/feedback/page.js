"use client";

import { useEffect, useMemo, useState } from "react";
import { fetcher } from "@/lib/fetcher";
import { toast } from "react-toastify";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import {
  CheckCheck,
  Eye,
  Loader2,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";

const FEEDBACK_LIST_ENDPOINTS = [
  "/feedback",
  "/reviews",
];

const FEEDBACK_UPDATE_ENDPOINTS = [
  "/feedback",
  "/reviews",
];

const FEEDBACK_DELETE_ENDPOINTS = [
  "/feedback",
  "/reviews",
];

const STATUS_OPTIONS = ["all", "pending", "reviewed", "resolved", "rejected"];

const toTitle = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "-";

const getFirstValue = (obj, keys, fallback = "") => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      return value;
    }
  }
  return fallback;
};

const extractList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;

  const nested = response?.data || response;
  const arrayKeys = [
    "feedbacks",
    "feedback",
    "items",
    "results",
    "rows",
    "list",
  ];

  for (const key of arrayKeys) {
    if (Array.isArray(nested?.[key])) {
      return nested[key];
    }
  }

  return [];
};

const normalizeFeedback = (entry = {}) => {
  const user = entry.user || entry.user_id || {};
  const id = getFirstValue(entry, ["_id", "id"]);
  const message = getFirstValue(entry, [
    "message",
    "feedback_message",
    "feedback",
    "comment",
    "description",
  ]);
  const status = getFirstValue(entry, ["status"], "pending")
    .toString()
    .toLowerCase();
  const ratingRaw = getFirstValue(entry, ["rating", "stars", "score"], "");
  const rating = Number(ratingRaw);

  return {
    id,
    userName: getFirstValue(
      entry,
      ["name", "user_name", "username"],
      getFirstValue(user, ["name", "user_name", "username"], "Unknown"),
    ),
    email: getFirstValue(
      entry,
      ["email", "user_email"],
      getFirstValue(user, ["email", "user_email"], "-"),
    ),
    phone: getFirstValue(
      entry,
      ["phone", "mobile", "phone_number", "mobile_number"],
      getFirstValue(user, ["phone", "mobile", "phone_number"], "-"),
    ),
    appVersion: getFirstValue(entry, [
      "app_version",
      "appVersion",
      "version",
      "mobile_app_version",
    ]),
    device: getFirstValue(entry, [
      "device",
      "device_name",
      "model",
      "mobile_model",
    ]),
    message: message || "-",
    rating: Number.isFinite(rating) ? rating : null,
    status: STATUS_OPTIONS.includes(status) ? status : "pending",
    createdAt: getFirstValue(entry, [
      "createdAt",
      "created_at",
      "date",
      "timestamp",
    ]),
    source: entry,
  };
};

const getStatusClasses = (status) => {
  if (status === "resolved") return "bg-green-100 text-green-700";
  if (status === "reviewed") return "bg-blue-100 text-blue-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
};

export default function FeedbackPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeItem, setActiveItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [busyAction, setBusyAction] = useState("");

  const loadFeedbacks = async () => {
    setLoading(true);
    let lastError = null;

    for (const endpoint of FEEDBACK_LIST_ENDPOINTS) {
      try {
        const response = await fetcher(endpoint);
        const list = extractList(response).map(normalizeFeedback);
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setItems(list);
        setLoading(false);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    setLoading(false);
    setItems([]);
    toast.error(lastError?.message || "Failed to fetch feedback list");
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.userName.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.phone.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const statusCounts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { total: 0, pending: 0, reviewed: 0, resolved: 0, rejected: 0 },
    );
  }, [items]);

  const updateStatus = async (item, nextStatus) => {
    if (!item?.id) return;

    setBusyAction(`${item.id}:${nextStatus}`);
    let lastError = null;

    try {
      for (const endpoint of FEEDBACK_UPDATE_ENDPOINTS) {
        try {
          await fetcher(`${endpoint}/${item.id}`, "PUT", { status: nextStatus });
          setItems((prev) =>
            prev.map((row) =>
              row.id === item.id ? { ...row, status: nextStatus } : row,
            ),
          );
          toast.success(`Feedback marked as ${nextStatus}`);
          return;
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error("Failed to update feedback status");
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setBusyAction("");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;
    setBusyAction(`${deleteItem.id}:delete`);
    let lastError = null;

    try {
      for (const endpoint of FEEDBACK_DELETE_ENDPOINTS) {
        try {
          await fetcher(`${endpoint}/${deleteItem.id}`, "DELETE");
          setItems((prev) => prev.filter((item) => item.id !== deleteItem.id));
          toast.success("Feedback deleted");
          setDeleteItem(null);
          return;
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error("Failed to delete feedback");
    } catch (error) {
      toast.error(error.message || "Delete failed");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-semibold">{statusCounts.total}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-xl font-semibold">{statusCounts.pending}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Reviewed</p>
          <p className="text-xl font-semibold">{statusCounts.reviewed}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Resolved</p>
          <p className="text-xl font-semibold">{statusCounts.resolved}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Rejected</p>
          <p className="text-xl font-semibold">{statusCounts.rejected}</p>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
          <h2 className="text-lg font-semibold">User Feedback</h2>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:justify-end">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, message, email or phone"
              className="w-full sm:w-80"
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {toTitle(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              onClick={loadFeedbacks}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        <div className="border rounded-xl overflow-x-auto">
          <table className="min-w-[960px] w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-3 text-left">SL</th>
                <th className="px-3 py-3 text-left">User</th>
                <th className="px-3 py-3 text-left">Rating</th>
                <th className="px-3 py-3 text-left">Feedback</th>
                <th className="px-3 py-3 text-left">Date</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading feedback...
                    </span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center text-muted-foreground">
                    No feedback found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={item.id || index} className="border-t hover:bg-muted/40">
                    <td className="px-3 py-3">{index + 1}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{item.userName}</p>
                      <p className="text-xs text-muted-foreground">{item.phone}</p>
                    </td>
                    <td className="px-3 py-3">
                      {item.rating ? `${item.rating}/5` : "-"}
                    </td>
                    <td className="px-3 py-3 max-w-xs">
                      <p className="line-clamp-2">{item.message}</p>
                    </td>
                    <td className="px-3 py-3">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(item.status)}`}
                      >
                        {toTitle(item.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="p-2 rounded-full border bg-white"
                          onClick={() => setActiveItem(item)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          className="p-2 rounded-full border bg-blue-600 text-white disabled:opacity-60"
                          onClick={() => updateStatus(item, "reviewed")}
                          disabled={
                            busyAction === `${item.id}:reviewed` ||
                            item.status === "reviewed"
                          }
                          title="Mark reviewed"
                        >
                          {busyAction === `${item.id}:reviewed` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCheck className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          className="p-2 rounded-full border bg-green-600 text-white disabled:opacity-60"
                          onClick={() => updateStatus(item, "resolved")}
                          disabled={
                            busyAction === `${item.id}:resolved` ||
                            item.status === "resolved"
                          }
                          title="Mark resolved"
                        >
                          {busyAction === `${item.id}:resolved` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCheck className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          className="p-2 rounded-full border bg-amber-500 text-white disabled:opacity-60"
                          onClick={() => updateStatus(item, "rejected")}
                          disabled={
                            busyAction === `${item.id}:rejected` ||
                            item.status === "rejected"
                          }
                          title="Reject feedback"
                        >
                          {busyAction === `${item.id}:rejected` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          className="p-2 rounded-full border bg-red-600 text-white disabled:opacity-60"
                          onClick={() => setDeleteItem(item)}
                          disabled={busyAction === `${item.id}:delete`}
                          title="Delete feedback"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!activeItem} onOpenChange={() => setActiveItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Submitted from the mobile app by the user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium">User:</span> {activeItem?.userName || "-"}
            </p>
            <p>
              <span className="font-medium">Email:</span> {activeItem?.email || "-"}
            </p>
            <p>
              <span className="font-medium">Phone:</span> {activeItem?.phone || "-"}
            </p>
            <p>
              <span className="font-medium">Rating:</span>{" "}
              {activeItem?.rating ? `${activeItem.rating}/5` : "-"}
            </p>
            <p>
              <span className="font-medium">App Version:</span>{" "}
              {activeItem?.appVersion || "-"}
            </p>
            <p>
              <span className="font-medium">Device:</span> {activeItem?.device || "-"}
            </p>
            <p>
              <span className="font-medium">Date:</span>{" "}
              {activeItem?.createdAt ? new Date(activeItem.createdAt).toLocaleString() : "-"}
            </p>
            <div>
              <p className="font-medium mb-1">Message</p>
              <p className="rounded-md border p-3 bg-muted/30 whitespace-pre-wrap">
                {activeItem?.message || "-"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveItem(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete feedback?"
        description="This feedback entry will be permanently removed."
      />
    </div>
  );
}
