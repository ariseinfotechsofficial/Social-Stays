"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@admin/components/ui/button";
import { Card } from "@admin/components/ui/feedback";
import { Field, Input } from "@admin/components/ui/form";
import { FormSection, PageHeader } from "@admin/components/ui/layout";
import { ApiError, api, fieldErrors } from "@admin/lib/api";
import { ROLE_LABELS, useMe } from "@admin/lib/session";

export default function ProfilePage() {
  const me = useMe();
  const qc = useQueryClient();
  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone ?? "");
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async (body: Record<string, string>) => {
    setBusy(true);
    setErrors({});
    try {
      await api("/auth/me", { method: "PATCH", json: body });
      toast.success("Saved");
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e) {
      setErrors(fieldErrors(e));
      toast.error(e instanceof ApiError ? e.message : "Couldn't save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="My profile" description={`${me.email} · ${ROLE_LABELS[me.role]}`} />
      <Card className="max-w-3xl">
        <FormSection title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <Button size="sm" onClick={() => save({ name, phone })} loading={busy}>
            Save details
          </Button>
        </FormSection>
        <FormSection title="Password" description="Changing it signs you out on other devices.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Current password" error={errors.currentPassword}>
              <Input type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            </Field>
            <Field label="New password" error={errors.newPassword}>
              <Input type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            </Field>
            <Field label="Repeat new password" error={pw.confirm && pw.confirm !== pw.newPassword ? "Doesn't match" : undefined}>
              <Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </Field>
          </div>
          <Button size="sm" onClick={() => save({ currentPassword: pw.currentPassword, newPassword: pw.newPassword })} loading={busy} disabled={!pw.newPassword || pw.newPassword !== pw.confirm}>
            Change password
          </Button>
        </FormSection>
      </Card>
    </>
  );
}
