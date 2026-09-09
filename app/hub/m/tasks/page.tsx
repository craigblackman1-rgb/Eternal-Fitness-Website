import { createClient } from "@/lib/supabase-server";
import { TasksScreen } from "./TasksScreen";

export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assignee: string | null;
  due_date: string | null;
  client_id: string | null;
  client_name: string | null;
  created_at: string;
  updated_at: string;
}

export default async function MobileTasksPage() {
  const supabase = createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  const list: TaskListItem[] = (tasks ?? []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    title: t.title as string,
    description: (t.description as string) ?? null,
    status: t.status as string,
    assignee: (t.assignee as string) ?? null,
    due_date: (t.due_date as string) ?? null,
    client_id: (t.client_id as string) ?? null,
    client_name: ((t.clients as { name?: string } | null)?.name) ?? null,
    created_at: t.created_at as string,
    updated_at: t.updated_at as string,
  }));

  return <TasksScreen tasks={list} />;
}
