"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor, { isRichTextEmpty } from "@/components/ui/rich-text-editor";
import { fetcher } from "@/lib/fetcher";
import { toast } from "react-toastify";

const TERMS_ENDPOINT = "/cms/terms";

const getValue = (obj, keys, fallback = "") => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && `${value}` !== "") return value;
  }
  return fallback;
};

export default function TermsPage() {
  const [title, setTitle] = useState("Terms & Conditions");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTerms = async () => {
    setLoading(true);
    try {
      const res = await fetcher(TERMS_ENDPOINT);
      const data = res?.data || res || {};
      setTitle(getValue(data, ["title", "name"], "Terms & Conditions"));
      setContent(getValue(data, ["content", "description", "text"]));
    } catch (error) {
      toast.error(error.message || "Failed to load Terms content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isRichTextEmpty(content)) {
      toast.error("Terms content is required");
      return;
    }

    setSaving(true);
    try {
      await fetcher(TERMS_ENDPOINT, "PUT", { title, content });
      toast.success("Terms content updated");
    } catch (error) {
      toast.error(error.message || "Failed to update Terms content");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Terms Page Content</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Terms & Conditions"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Enter terms content..."
              className={loading ? "pointer-events-none opacity-70" : ""}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving || loading}>
              {saving ? "Saving..." : "Save Terms"}
            </Button>
            <Button type="button" variant="outline" onClick={loadTerms} disabled={loading}>
              Refresh
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
