"use client";

import { PlusIcon, UserCircleIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Fields } from "@admin/components/fields/Fields";
import type { FieldDef, FormValue } from "@admin/components/fields/types";
import { NoAccess } from "@admin/components/NoAccess";
import { Button } from "@admin/components/ui/button";
import { Badge, Card, Empty, Loading } from "@admin/components/ui/feedback";
import { PageHeader, Table, Tabs, tdClass } from "@admin/components/ui/layout";
import { Dialog, useConfirm } from "@admin/components/ui/overlay";
import { ApiError, api, fieldErrors } from "@admin/lib/api";
import { ROLE_HELP, ROLE_LABELS, useCan, useMe, type Role } from "@admin/lib/session";
import { ago } from "@admin/lib/utils";

type User = { _id: string; name: string; email: string; phone?: string; role: Role; villas: { _id: string; name: string }[]; active: boolean; lastLoginAt?: string; payout?: Record<string, string> };

export default function UsersPage() {
  const can = useCan();
  const me = useMe();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const manager = can("users");
  const [role, setRole] = useState(manager ? "" : "owner");
  const { data, isLoading } = useQuery({ queryKey: ["users", role], queryFn: () => api<{ items: User[] }>("/admin/users", { query: { role } }), enabled: can("users", "owners") });
  const [editing, setEditing] = useState<{ id?: string; value: FormValue } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (!can("users", "owners")) return <NoAccess />;

  const roles = (manager ? (["superadmin", "editor", "sales", "owner"] as Role[]) : (["owner"] as Role[])).map((r) => ({ value: r, label: `${ROLE_LABELS[r]}: ${ROLE_HELP[r]}` }));

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setErrors({});
    try {
      const v = editing.value;
      const body = { ...v, villas: v.role === "owner" ? v.villas : [], password: v.password || undefined };
      await api(editing.id ? `/admin/users/${editing.id}` : "/admin/users", { method: editing.id ? "PATCH" : "POST", json: body });
      toast.success(editing.id ? "User updated" : "User added. Share the email and password with them.");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["ref"] });
    } catch (e) {
      setErrors(fieldErrors(e));
      toast.error(e instanceof ApiError ? e.message : "Couldn't save");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u: User) => {
    if (!(await confirm({ title: `Delete ${u.name}?`, body: "They lose access straight away. To keep their history, switch the account off instead.", confirmLabel: "Delete", danger: true }))) return;
    try {
      await api(`/admin/users/${u._id}`, { method: "DELETE" });
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't delete");
    }
  };

  const open = (u?: User) => {
    setErrors({});
    setEditing(
      u
        ? { id: u._id, value: { ...u, villas: u.villas.map((v) => v._id), password: "", payout: u.payout ?? {} } }
        : { value: { name: "", email: "", phone: "", role: manager ? "editor" : "owner", villas: [], active: true, password: "", payout: { method: "" } } },
    );
  };

  const isOwner = editing?.value.role === "owner";

  return (
    <>
      <PageHeader
        title="Users & owners"
        description="Team members sign in to this admin. Villa owners sign in here too, and only see their own villas."
        actions={
          <Button icon={<PlusIcon className="size-4" />} onClick={() => open()}>
            Add {manager ? "user" : "owner"}
          </Button>
        }
      />
      {manager && (
        <Tabs
          value={role || "all"}
          onChange={(v) => setRole(v === "all" ? "" : v)}
          className="mb-4"
          tabs={[{ value: "all", label: "Everyone" }, ...(["superadmin", "editor", "sales", "owner"] as Role[]).map((r) => ({ value: r, label: r === "owner" ? "Owners" : ROLE_LABELS[r] }))]}
        />
      )}
      <Card padded={false}>
        {isLoading ? (
          <Loading />
        ) : !data?.items.length ? (
          <Empty icon={UserCircleIcon} title="No users here" />
        ) : (
          <Table head={["Name", "Role", "Villas", "Last sign-in", "Status"]}>
            {data.items.map((u) => (
              <tr key={u._id} onClick={() => open(u)} className="cursor-pointer hover:bg-canvas">
                <td className={tdClass}>
                  <span className="font-semibold">
                    {u.name} {u._id === me._id && <span className="text-ink-soft">(you)</span>}
                  </span>
                  <span className="block text-[0.8125rem] text-ink-soft">{u.email}</span>
                </td>
                <td className={tdClass}>
                  <Badge tone={u.role === "superadmin" ? "gold" : u.role === "owner" ? "info" : "neutral"}>{ROLE_LABELS[u.role]}</Badge>
                </td>
                <td className={`${tdClass} text-ink-soft`}>{u.role === "owner" ? u.villas.map((v) => v.name).join(", ") || "None yet" : "—"}</td>
                <td className={`${tdClass} text-ink-soft`}>{u.lastLoginAt ? ago(u.lastLoginAt) : "Never"}</td>
                <td className={tdClass}>{u.active ? <Badge tone="success">Active</Badge> : <Badge>Off</Badge>}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing?.id ? `Edit ${String(editing.value.name)}` : "Add a user"}
        size="lg"
        footer={
          <>
            {editing?.id && editing.id !== me._id && manager && (
              <Button variant="danger" className="mr-auto" onClick={() => remove(editing.value as unknown as User)}>
                Delete
              </Button>
            )}
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={save}>
              {editing?.id ? "Save" : "Add user"}
            </Button>
          </>
        }
      >
        {editing && (
          <Fields
            value={editing.value}
            onChange={(value) => setEditing({ ...editing, value })}
            errors={errors}
            fields={[
              { name: "name", label: "Name", type: "text", width: "half" },
              { name: "phone", label: "Phone", type: "text", width: "half" },
              { name: "email", label: "Email (used to sign in)", type: "email", width: "half" },
              { name: "password", label: editing.id ? "New password (leave empty to keep)" : "Password", type: "text", width: "half", help: "At least 8 characters. Resetting signs them out everywhere." },
              { name: "role", label: "Role", type: "select", options: roles },
              { name: "villas", label: "Their villas", type: "ref", endpoint: "/admin/villas", labelKey: "name", multiple: true, showIf: (v) => v.role === "owner", help: "Each villa has one owner account" },
              { name: "active", label: "Account active", type: "boolean" },
              ...(isOwner
                ? ([
                    { name: "payout-heading", label: "Payout details", type: "heading" },
                    {
                      name: "payout.method",
                      label: "Paid by",
                      type: "select",
                      width: "third",
                      options: [
                        { value: "", label: "Not set" },
                        { value: "bank", label: "Bank transfer" },
                        { value: "upi", label: "UPI" },
                      ],
                    },
                    { name: "payout.upiId", label: "UPI ID", type: "text", width: "two-thirds", showIf: (v: FormValue) => (v.payout as { method?: string })?.method === "upi" },
                    { name: "payout.accountName", label: "Account name", type: "text", width: "half", showIf: (v: FormValue) => (v.payout as { method?: string })?.method === "bank" },
                    { name: "payout.accountNumber", label: "Account number", type: "text", width: "half", showIf: (v: FormValue) => (v.payout as { method?: string })?.method === "bank" },
                    { name: "payout.ifsc", label: "IFSC", type: "text", width: "third", showIf: (v: FormValue) => (v.payout as { method?: string })?.method === "bank" },
                  ] satisfies FieldDef[])
                : []),
            ]}
          />
        )}
      </Dialog>
    </>
  );
}
