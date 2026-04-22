"use client";

import { useState } from "react";
import { Modal, ModalHeader } from "@/components/ui/Modal";
import { useAppStore } from "@/stores/appStore";

interface Props {
  onClose: () => void;
}

export function SaveTeamModal({ onClose }: Props) {
  const saveTeam = useAppStore((s) => s.saveTeam);
  const myPool = useAppStore((s) => s.myPool);
  const filled = myPool.filter((p) => p).length;
  const [name, setName] = useState("");

  const canSave = filled > 0;

  function handleSave() {
    if (!canSave) return;
    saveTeam(name);
    setName("");
    onClose();
  }

  return (
    <Modal onClose={onClose} width={420} labelledBy="save-title">
      <ModalHeader
        title="Save team"
        titleId="save-title"
        subtitle={
          filled === 0
            ? "My Pool is empty — add creatures first."
            : `${filled} creature${filled === 1 ? "" : "s"} in My Pool`
        }
        onClose={onClose}
      />
      <div className="flex flex-col gap-[10px] p-[14px]">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSave) {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder={`Team ${new Date().toLocaleDateString()}`}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-[10px] text-sm text-text outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className="self-end rounded-lg bg-primary px-4 py-[10px] text-xs font-semibold text-white disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
