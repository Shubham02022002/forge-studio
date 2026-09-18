import {
  Boxes,
  Check,
  Layers,
  Loader2,
  Palette,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductBlueprint } from "@/lib/api";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Boxes;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">
        <Icon className="size-3" strokeWidth={2} />
        {title}
      </div>
      {children}
    </div>
  );
}

export function BlueprintCard({
  blueprint,
  generating,
  generated,
  onGenerate,
  onBrowseCode,
}: {
  blueprint: ProductBlueprint;
  generating: boolean;
  generated: boolean;
  onGenerate: (blueprint: ProductBlueprint) => void;
  onBrowseCode: () => void;
}) {
  return (
    <div className="animate-rise rounded-lg border border-line-strong bg-panel">
      <div className="border-b border-line px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-forge-line bg-forge-soft px-2 py-0.5 text-[11px] font-medium text-forge">
            <Check className="size-3" strokeWidth={3} />
            Spec complete
          </span>
        </div>
        <h3 className="mt-2.5 text-[15px] font-semibold tracking-[-0.02em] text-ink">
          {blueprint.title}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          {blueprint.description}
        </p>
      </div>

      <div className="flex flex-col gap-4 px-3.5 py-3.5">
        <Section icon={Users} title="Audience">
          <p className="text-[12px] leading-relaxed text-muted">
            {blueprint.targetAudience}
          </p>
        </Section>

        <Section icon={Layers} title="Features">
          <ul className="flex flex-col gap-1.5">
            {blueprint.features.map((feature, index) => (
              <li
                key={index}
                className="flex gap-2 text-[12px] leading-relaxed text-muted"
              >
                <Check
                  className="mt-[3px] size-3 shrink-0 text-forge"
                  strokeWidth={3}
                />
                {feature}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Boxes} title="Data model">
          <div className="flex flex-col gap-1.5">
            {blueprint.entityModels.map((entity, index) => (
              <div
                key={index}
                className="rounded-md border border-line bg-canvas px-2.5 py-2"
              >
                <div className="font-mono text-[11px] font-medium text-ink">
                  {entity.name}
                </div>
                <div className="mt-1 font-mono text-[10px] leading-relaxed text-faint">
                  {entity.fields.join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Palette} title="Design system">
          <div className="flex flex-wrap gap-1.5">
            {[
              blueprint.designSystem.neutralBase,
              blueprint.designSystem.primaryColor,
              blueprint.designSystem.layoutPattern,
              blueprint.designSystem.typography.headingFont,
              blueprint.designSystem.typography.bodyFont,
            ]
              .filter(Boolean)
              .map((value, index) => (
                <span
                  key={index}
                  className="rounded-full border border-line-strong px-2 py-0.5 font-mono text-[10px] text-muted"
                >
                  {value}
                </span>
              ))}
          </div>
        </Section>

        {blueprint.suggestedPackages.length > 0 && (
          <Section icon={Boxes} title="Packages">
            <div className="flex flex-wrap gap-1.5">
              {blueprint.suggestedPackages.map((pkg, index) => (
                <span
                  key={index}
                  className="rounded-sm bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-faint"
                >
                  {pkg}
                </span>
              ))}
            </div>
          </Section>
        )}
      </div>

      <div className="border-t border-line px-3.5 py-2.5">
        {generated ? (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={onBrowseCode}
          >
            <Terminal className="size-3.5" strokeWidth={1.9} />
            Browse the code
          </Button>
        ) : (
          <>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              disabled={generating}
              onClick={() => onGenerate(blueprint)}
            >
              {generating ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={2.2} />
              ) : (
                <Sparkles className="size-3.5" strokeWidth={1.9} />
              )}
              {generating ? "Generating…" : "Generate codebase"}
            </Button>
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              {generating
                ? "Files land in the Code tab as each one finishes."
                : "Writes every file for this spec into the workspace."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
