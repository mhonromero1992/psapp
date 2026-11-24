import { useMemo } from "react";
import { memberName } from "@/data/generate";
import type { Member } from "@/data/types";

/** Saves a real file in the browser (no server involved). */
export function downloadFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV with a UTF-8 BOM so spreadsheet apps read the peso sign and ñ correctly. */
export function toCsv(rows: (string | number)[][]) {
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

/** Audit actor for actions the member takes in the app. */
export function useMemberActor(member: Member) {
  return useMemo(() => ({ name: memberName(member), role: "Member", officeId: member.officeId }), [member]);
}
