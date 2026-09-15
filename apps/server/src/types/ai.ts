export interface ClarificationQuestion {
  id: string;
  category: "features" | "auth" | "database" | "design";
  question: string;
  options: string[]; // Selectable chips for the user
  allowCustomInput?: boolean;
}

export interface ClarificationResponse {
  isAmbiguous: boolean;
  completenessScore: number; // 0 to 100
  summary: string;
  questions?: ClarificationQuestion[];
}

export interface ProductBlueprint {
  title: string;
  description: string;
  targetAudience: string;
  designSystem: {
    primaryColor: string; // e.g. "zinc-900" / "indigo-600"
    neutralBase: string; // e.g. "zinc" | "slate"
    typography: {
      headingFont: string;
      bodyFont: string;
    };
    layoutPattern: "sidebar-layout" | "navbar-layout" | "canvas-layout";
  };
  features: string[];
  entityModels: Array<{
    name: string;
    fields: string[];
  }>;
  suggestedPackages: string[]; // e.g. ["lucide-react", "recharts", "date-fns"]
}
