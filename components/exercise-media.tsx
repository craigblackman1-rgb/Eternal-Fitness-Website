import { Film } from "lucide-react";

interface ExerciseMediaPlaceholderProps {
  exerciseName: string;
}

export function ExerciseMediaPlaceholder({ exerciseName }: ExerciseMediaPlaceholderProps) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <Film className="h-3 w-3" />
      <span>No video available for {exerciseName}</span>
    </div>
  );
}
