"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor, { isRichTextEmpty } from "@/components/ui/rich-text-editor";
import { fetcher } from "@/lib/fetcher";
import { toast } from "react-toastify";

const ABOUT_GET_ENDPOINTS = ["/cms/about", "/cms/terms"];
const ABOUT_UPDATE_ENDPOINT = "/cms/about";

const getValue = (obj, keys, fallback = "") => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && `${value}` !== "") return value;
  }
  return fallback;
};

export default function AboutPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAbout = async () => {
    setLoading(true);
    let lastError = null;

    for (const endpoint of ABOUT_GET_ENDPOINTS) {
      try {
        const res = await fetcher(endpoint);
        const data = res?.data || res || {};
        setTitle(getValue(data, ["title", "name"], "About Us"));
        setContent(getValue(data, ["content", "description", "text"]));
        setLoading(false);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    setLoading(false);
    toast.error(lastError?.message || "Failed to load About content");
  };

  useEffect(() => {
    loadAbout();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isRichTextEmpty(content)) {
      toast.error("About content is required");
      return;
    }

    setSaving(true);
    try {
      await fetcher(ABOUT_UPDATE_ENDPOINT, "PUT", { title, content });
      toast.success("About content updated");
    } catch (error) {
      toast.error(error.message || "Failed to update About content");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">About Page Content</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="About Us"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Enter about content..."
              className={loading ? "pointer-events-none opacity-70" : ""}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving || loading}>
              {saving ? "Saving..." : "Save About"}
            </Button>
            <Button type="button" variant="outline" onClick={loadAbout} disabled={loading}>
              Refresh
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
