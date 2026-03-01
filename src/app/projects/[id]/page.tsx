"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import * as signalR from "@microsoft/signalr";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

const statusMap: Record<string, { label: string; cls: string }> = {
  Planning: { label: "Planung", cls: "bg-gray-100 text-gray-700" },
  InProgress: { label: "In Arbeit", cls: "bg-blue-50 text-blue-700" },
  Completed: { label: "Abgeschlossen", cls: "bg-green-50 text-success" },
  OnHold: { label: "Pausiert", cls: "bg-yellow-50 text-warning" },
};

const boardColumns: Array<{ key: "Todo" | "InProgress" | "Done"; label: string }> = [
  { key: "Todo", label: "Todo" },
  { key: "InProgress", label: "In Progress" },
  { key: "Done", label: "Done" },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [success, setSuccess] = useState("");
  const [newMilestone, setNewMilestone] = useState({ title: "", dueDate: "" });
  const [editMilestoneId, setEditMilestoneId] = useState<string | null>(null);
  const [editMilestoneForm, setEditMilestoneForm] = useState({ title: "", dueDate: "", isCompleted: false });
  const [boardTasks, setBoardTasks] = useState<any[]>([]);
  const [boardBusy, setBoardBusy] = useState(false);
  const [newBoardTask, setNewBoardTask] = useState({ title: "", description: "", assigneeName: "", dueDate: "", status: "Todo" as "Todo" | "InProgress" | "Done" });
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [allTeamMembers, setAllTeamMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [liveConnected, setLiveConnected] = useState(false);

  const load = () => { if (id) api.project(id).then(setProject).catch(() => setError("Projekt konnte nicht geladen werden")); };
  const loadOnboarding = () => { if (id) api.onboardingByProject(id).then(setWorkflows).catch(() => {}); };
  const loadBoard = () => { if (id) api.boardTasks(id).then(setBoardTasks).catch(() => setError("Board konnte nicht geladen werden")); };
  const loadMembers = () => { if (id) api.projectMembers(id).then(setProjectMembers).catch(() => {}); };
  const loadTeamMembers = () => api.teamMembers().then((list: any[]) => setAllTeamMembers(list || [])).catch(() => {});

  useEffect(() => {
    load();
    loadOnboarding();
    loadBoard();
    loadMembers();
    loadTeamMembers();
    api.onboardingTemplates().then((list: any[]) => {
      setTemplates(list || []);
      const defaultTemplate = (list || []).find((t: any) => t.isDefault);
      if (defaultTemplate?.id) setSelectedTemplateId((prev) => prev || defaultTemplate.id);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/project-board`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    connection.on("BoardUpdated", () => { loadBoard(); loadMembers(); });

    connection.onreconnecting(() => setLiveConnected(false));
    connection.onreconnected(() => {
      setLiveConnected(true);
      connection.invoke("JoinProjectBoard", id).catch(() => {});
    });
    connection.onclose(() => setLiveConnected(false));

    connection.start()
      .then(async () => {
        setLiveConnected(true);
        await connection.invoke("JoinProjectBoard", id);
      })
      .catch(() => setLiveConnected(false));

    const fallbackInterval = setInterval(() => { loadBoard(); loadMembers(); }, 20000);
    return () => {
      clearInterval(fallbackInterval);
      connection.invoke("LeaveProjectBoard", id).catch(() => {});
      connection.stop().catch(() => {});
    };
  }, [id]);

  const boardByStatus = useMemo(() => {
    const byStatus: Record<string, any[]> = { Todo: [], InProgress: [], Done: [] };
    for (const task of boardTasks || []) {
      if (!byStatus[task.status]) byStatus[task.status] = [];
      byStatus[task.status].push(task);
    }
    for (const key of Object.keys(byStatus)) {
      byStatus[key] = byStatus[key].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return byStatus;
  }, [boardTasks]);

  const startEdit = () => { setForm({ name: project.name, description: project.description || "", status: project.status, startDate: project.startDate?.split("T")[0] || "", dueDate: project.dueDate?.split("T")[0] || "" }); setEditing(true); };
  const saveEdit = async () => { try { await api.updateProject(id, form); setEditing(false); setSuccess("Gespeichert"); setTimeout(() => setSuccess(""), 3000); load(); } catch (e: any) { setError(e.message); } };
  const handleDelete = async () => { if (!confirm("Projekt wirklich loeschen?")) return; try { await api.deleteProject(id); window.location.href = "/projects"; } catch (e: any) { setError(e.message); } };
  const toggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Done" ? "Open" : "Done";
    try { await api.updateTask(taskId, { status: nextStatus }); loadOnboarding(); } catch { setError("Task konnte nicht aktualisiert werden"); }
  };
  const toggleStep = async (stepId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Completed" ? "Pending" : "Completed";
    try { await api.updateStepStatus(stepId, { status: nextStatus }); loadOnboarding(); } catch { setError("Schritt konnte nicht aktualisiert werden"); }
  };
  const startOnboarding = async () => {
    if (!selectedTemplateId) {
      setError("Bitte ein Onboarding-Template auswaehlen.");
      return;
    }
    try {
      await api.startProjectOnboarding(id, selectedTemplateId);
      setSuccess("Projekt-Onboarding gestartet");
      setTimeout(() => setSuccess(""), 3000);
      loadOnboarding();
    } catch {
      setError("Projekt-Onboarding konnte nicht gestartet werden");
    }
  };

  const addBoardTask = async () => {
    if (!newBoardTask.title.trim() || !id) return;
    try {
      setBoardBusy(true);
      await api.createBoardTask(id, {
        title: newBoardTask.title,
        description: newBoardTask.description || null,
        assigneeName: newBoardTask.assigneeName || null,
        dueDate: newBoardTask.dueDate ? new Date(newBoardTask.dueDate).toISOString() : null,
        status: newBoardTask.status,
      });
      setNewBoardTask({ title: "", description: "", assigneeName: "", dueDate: "", status: "Todo" });
      await loadBoard();
    } catch (e: any) {
      setError(e.message || "Board-Task konnte nicht erstellt werden");
    } finally {
      setBoardBusy(false);
    }
  };

  const moveBoardTask = async (taskId: string, targetStatus: "Todo" | "InProgress" | "Done") => {
    if (!id) return;
    try {
      setBoardBusy(true);
      const targetSortOrder = (boardByStatus[targetStatus] || []).length;
      await api.moveBoardTask(id, taskId, { status: targetStatus, sortOrder: targetSortOrder });
      await loadBoard();
    } catch (e: any) {
      setError(e.message || "Task konnte nicht verschoben werden");
    } finally {
      setBoardBusy(false);
    }
  };

  const deleteBoardTask = async (taskId: string) => {
    if (!id) return;
    try {
      setBoardBusy(true);
      await api.deleteBoardTask(id, taskId);
      await loadBoard();
    } catch (e: any) {
      setError(e.message || "Task konnte nicht geloescht werden");
    } finally {
      setBoardBusy(false);
    }
  };
  const addProjectMember = async () => {
    if (!id || !selectedMemberId) return;
    try {
      await api.addProjectMember(id, selectedMemberId);
      setSelectedMemberId("");
      await loadMembers();
    } catch (e: any) {
      setError(e.message || "Mitglied konnte nicht hinzugefuegt werden");
    }
  };
  const removeProjectMember = async (memberId: string) => {
    if (!id) return;
    try {
      await api.removeProjectMember(id, memberId);
      await loadMembers();
    } catch (e: any) {
      setError(e.message || "Mitglied konnte nicht entfernt werden");
    }
  };

  const addMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    try {
      await api.addMilestone(id, { title: newMilestone.title, dueDate: newMilestone.dueDate ? new Date(newMilestone.dueDate).toISOString() : null, sortOrder: (project.milestones?.length || 0) });
      setNewMilestone({ title: "", dueDate: "" }); load();
    } catch { setError("Meilenstein konnte nicht erstellt werden"); }
  };
  const updateMilestone = async (mid: string) => {
    try {
      await api.updateMilestone(mid, { title: editMilestoneForm.title, dueDate: editMilestoneForm.dueDate ? new Date(editMilestoneForm.dueDate).toISOString() : null, isCompleted: editMilestoneForm.isCompleted, sortOrder: 0 });
      setEditMilestoneId(null); load();
    } catch { setError("Meilenstein konnte nicht aktualisiert werden"); }
  };
  const toggleMilestone = async (m: any) => {
    try {
      await api.updateMilestone(m.id, { title: m.title, dueDate: m.dueDate, isCompleted: !m.isCompleted, sortOrder: m.sortOrder });
      load();
    } catch { setError("Meilenstein konnte nicht aktualisiert werden"); }
  };
  const deleteMilestone = async (mid: string) => {
    try { await api.deleteMilestone(mid); load(); } catch { setError("Meilenstein konnte nicht geloescht werden"); }
  };
  const addComment = async () => {
    if (!comment.trim()) return;
    try { await api.addComment(id, { content: comment }); setComment(""); load(); } catch { setError("Kommentar konnte nicht erstellt werden"); }
  };

  const s = (status: string) => statusMap[status] || { label: status, cls: "bg-gray-100 text-gray-700" };

  if (error) return <div className="p-8"><div className="bg-red-50 text-danger px-4 py-2 rounded-lg text-sm">{error}</div></div>;
  if (!project) return <div className="p-8 text-muted">Laden...</div>;

  return (
    <div className="p-8 max-w-6xl">
      <button onClick={() => (window.location.href = "/projects")} className="text-sm text-primary hover:underline mb-4 inline-block">&larr; Alle Projekte</button>

      {success && <div className="bg-green-50 text-success px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${s(project.status).cls}`}>{s(project.status).label}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={startEdit} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background">Bearbeiten</button>
          <button onClick={handleDelete} className="px-3 py-1.5 text-sm text-danger border border-danger/30 rounded-lg hover:bg-red-50">Loeschen</button>
        </div>
      </div>

      {editing && <div className="bg-surface rounded-xl border border-border p-6 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs text-muted block mb-1">Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
          <div><label className="text-xs text-muted block mb-1">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"><option value="Planning">Planung</option><option value="InProgress">In Arbeit</option><option value="Completed">Abgeschlossen</option><option value="OnHold">Pausiert</option></select></div>
          <div><label className="text-xs text-muted block mb-1">Start</label><input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
          <div><label className="text-xs text-muted block mb-1">Faellig</label><input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" /></div>
        </div>
        <div><label className="text-xs text-muted block mb-1">Beschreibung</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" rows={2} /></div>
        <div className="flex gap-2"><button onClick={saveEdit} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Speichern</button><button onClick={() => setEditing(false)} className="px-4 py-2 border border-border rounded-lg text-sm">Abbrechen</button></div>
      </div>}

      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted">Kunde:</span> <span className="font-medium ml-1">{project.customerName || "–"}</span></div>
          <div><span className="text-muted">Status:</span> <span className="font-medium ml-1">{s(project.status).label}</span></div>
          <div><span className="text-muted">Start:</span> <span className="font-medium ml-1">{project.startDate ? new Date(project.startDate).toLocaleDateString("de") : "–"}</span></div>
          <div><span className="text-muted">Faellig:</span> <span className="font-medium ml-1">{project.dueDate ? new Date(project.dueDate).toLocaleDateString("de") : "–"}</span></div>
        </div>
        {project.description && <p className="text-sm mt-4 text-muted">{project.description}</p>}
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Projekt-Board</h2>
          <span className={`text-xs px-2 py-1 rounded-full ${liveConnected ? "bg-green-50 text-success" : "bg-yellow-50 text-warning"}`}>
            {liveConnected ? "Live verbunden" : "Fallback aktiv"}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4">
          <input
            value={newBoardTask.title}
            onChange={(e) => setNewBoardTask({ ...newBoardTask, title: e.target.value })}
            className="md:col-span-2 px-3 py-2 border border-border rounded-lg text-sm"
            placeholder="Neue Aufgabe"
          />
          <input
            value={newBoardTask.assigneeName}
            onChange={(e) => setNewBoardTask({ ...newBoardTask, assigneeName: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg text-sm"
            placeholder="Zustaendig"
          />
          <input
            type="date"
            value={newBoardTask.dueDate}
            onChange={(e) => setNewBoardTask({ ...newBoardTask, dueDate: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          />
          <select
            value={newBoardTask.status}
            onChange={(e) => setNewBoardTask({ ...newBoardTask, status: e.target.value as "Todo" | "InProgress" | "Done" })}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-background"
          >
            <option value="Todo">Todo</option>
            <option value="InProgress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          <button disabled={boardBusy} onClick={addBoardTask} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-60">
            Task erstellen
          </button>
        </div>
        <textarea
          value={newBoardTask.description}
          onChange={(e) => setNewBoardTask({ ...newBoardTask, description: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-4"
          rows={2}
          placeholder="Beschreibung (optional)"
        />
        <div className="border border-border rounded-lg p-3 mb-4">
          <p className="text-xs text-muted mb-2">Board-Zugriff (Projektmitglieder)</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {projectMembers.length === 0 && <span className="text-xs text-muted">Kein Mitglied gesetzt. Dann haben alle angemeldeten Nutzer Zugriff.</span>}
            {projectMembers.map((m: any) => (
              <span key={m.id} className="inline-flex items-center gap-2 px-2 py-1 text-xs bg-background border border-border rounded-full">
                {m.fullName}
                <button onClick={() => removeProjectMember(m.id)} className="text-danger hover:underline">x</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background">
              <option value="">Teammitglied waehlen...</option>
              {allTeamMembers.filter((m: any) => !projectMembers.some((pm: any) => pm.id === m.id)).map((m: any) => (
                <option key={m.id} value={m.id}>{m.fullName}</option>
              ))}
            </select>
            <button onClick={addProjectMember} className="px-3 py-2 bg-primary text-white rounded-lg text-sm">Hinzufuegen</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {boardColumns.map((column) => (
            <div
              key={column.key}
              className="bg-background rounded-lg border border-border p-3 min-h-48"
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData("text/task-id");
                if (taskId) await moveBoardTask(taskId, column.key);
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{column.label}</h3>
                <span className="text-xs text-muted">{(boardByStatus[column.key] || []).length}</span>
              </div>
              <div className="space-y-2">
                {(boardByStatus[column.key] || []).map((task: any) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/task-id", task.id)}
                    className="bg-surface border border-border rounded-lg p-3 cursor-move"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{task.title}</p>
                      <button onClick={() => deleteBoardTask(task.id)} className="text-xs text-danger hover:underline">Loeschen</button>
                    </div>
                    {task.description && <p className="text-xs text-muted mt-1">{task.description}</p>}
                    <div className="flex items-center justify-between mt-2 text-xs text-muted">
                      <span>{task.assigneeName || "Unzugewiesen"}</span>
                      <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString("de") : "Kein Datum"}</span>
                    </div>
                  </div>
                ))}
                {(boardByStatus[column.key] || []).length === 0 && <p className="text-xs text-muted">Keine Tasks</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Projekt-Onboarding</h2>
          {workflows.length === 0 && (
            <div className="flex items-center gap-2">
              <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm bg-background">
                <option value="" disabled>Template waehlen...</option>
                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}{t.isDefault ? " (Default)" : ""}</option>)}
              </select>
              <button onClick={startOnboarding} className="px-3 py-2 bg-primary text-white rounded-lg text-sm">Starten</button>
            </div>
          )}
        </div>
        {workflows.length === 0 ? (
          <p className="text-sm text-muted">Noch kein Onboarding gestartet.</p>
        ) : (
          <div className="space-y-4">
            {workflows.map((wf: any) => {
              const totalSteps = wf.steps?.length || 0;
              const doneSteps = wf.steps?.filter((st: any) => st.status === "Completed").length || 0;
              const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
              return (
              <div key={wf.id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{wf.templateName || "Workflow"}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${wf.status === "Completed" ? "bg-green-50 text-success" : wf.status === "InProgress" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-muted"}`}>{wf.status === "Completed" ? "Abgeschlossen" : wf.status === "InProgress" ? "In Arbeit" : wf.status}</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted whitespace-nowrap">{doneSteps}/{totalSteps} Schritte ({pct}%)</span>
                </div>
                <div className="space-y-3">
                  {wf.steps?.map((step: any, index: number) => (
                    <div key={step.id} className={`pl-4 border-l-2 ${step.status === "Completed" ? "border-success" : "border-border"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <input type="checkbox" checked={step.status === "Completed"} onChange={() => toggleStep(step.id, step.status)} className="w-4 h-4 accent-primary cursor-pointer" />
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step.status === "Completed" ? "bg-success text-white" : step.status === "InProgress" ? "bg-primary text-white" : "bg-gray-200 text-muted"}`}>{index + 1}</span>
                        <span className={`text-sm font-medium ${step.status === "Completed" ? "line-through text-muted" : ""}`}>{step.title}</span>
                      </div>
                      <div className="ml-8 space-y-1">
                        {step.tasks?.map((task: any) => (
                          <label key={task.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={task.status === "Done"} onChange={() => toggleTask(task.id, task.status)} className="rounded border-border" />
                            <span className={task.status === "Done" ? "line-through text-muted" : ""}>{task.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <h2 className="font-semibold mb-4">Meilensteine</h2>
        {project.milestones?.length > 0 && (
          <div className="space-y-3 mb-4">
            {project.milestones.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3">
                {editMilestoneId === m.id ? (
                  <>
                    <input value={editMilestoneForm.title} onChange={e => setEditMilestoneForm({ ...editMilestoneForm, title: e.target.value })} className="flex-1 px-2 py-1 border border-border rounded text-sm" />
                    <input type="date" value={editMilestoneForm.dueDate} onChange={e => setEditMilestoneForm({ ...editMilestoneForm, dueDate: e.target.value })} className="px-2 py-1 border border-border rounded text-sm" />
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={editMilestoneForm.isCompleted} onChange={e => setEditMilestoneForm({ ...editMilestoneForm, isCompleted: e.target.checked })} />Fertig</label>
                    <button onClick={() => updateMilestone(m.id)} className="text-xs text-primary hover:underline">Speichern</button>
                    <button onClick={() => setEditMilestoneId(null)} className="text-xs text-muted hover:underline">Abbrechen</button>
                  </>
                ) : (
                  <>
                    <input type="checkbox" checked={m.isCompleted} onChange={() => toggleMilestone(m)} className="w-4 h-4 accent-primary cursor-pointer" />
                    <span className={`text-sm flex-1 ${m.isCompleted ? "line-through text-muted" : ""}`}>{m.title}</span>
                    {m.dueDate && <span className="text-xs text-muted">{new Date(m.dueDate).toLocaleDateString("de")}</span>}
                    <button onClick={() => { setEditMilestoneId(m.id); setEditMilestoneForm({ title: m.title, dueDate: m.dueDate?.split("T")[0] || "", isCompleted: m.isCompleted }); }} className="text-xs text-primary hover:underline">Bearbeiten</button>
                    <button onClick={() => deleteMilestone(m.id)} className="text-xs text-danger hover:underline">Loeschen</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {(!project.milestones || project.milestones.length === 0) && <p className="text-sm text-muted mb-4">Keine Meilensteine vorhanden.</p>}
        <div className="flex gap-2 items-center">
          <input value={newMilestone.title} onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })} placeholder="Neuer Meilenstein..." className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" />
          <input type="date" value={newMilestone.dueDate} onChange={e => setNewMilestone({ ...newMilestone, dueDate: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm" />
          <button onClick={addMilestone} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Hinzufuegen</button>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="font-semibold mb-4">Kommentare</h2>
        {project.comments?.length > 0 ? (
          <div className="space-y-4 mb-4">
            {project.comments.map((c: any) => (
              <div key={c.id} className="border-b border-border pb-3 last:border-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{c.authorName || "System"}</span>
                  <span className="text-xs text-muted">{new Date(c.createdAt).toLocaleDateString("de")}</span>
                </div>
                <p className="text-sm text-muted">{c.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted mb-4">Keine Kommentare vorhanden.</p>
        )}
        <div className="flex gap-2">
          <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Kommentar schreiben..." className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" onKeyDown={e => { if (e.key === "Enter") addComment(); }} />
          <button onClick={addComment} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Senden</button>
        </div>
      </div>
    </div>
  );
}
