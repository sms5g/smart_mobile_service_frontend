"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "color",
  "background",
  "align",
  "link",
];

export const isRichTextEmpty = (value) =>
  !value || value.replace(/<(.|\n)*?>/g, "").replace(/&nbsp;/g, " ").trim() === "";

export const stripHtml = (value = "") =>
  value.replace(/<(.|\n)*?>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here...",
  className = "",
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={className} suppressHydrationWarning>
        <div className="min-h-[180px] rounded-md border bg-background" />
      </div>
    );
  }

  return (
    <div className={className} suppressHydrationWarning>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
