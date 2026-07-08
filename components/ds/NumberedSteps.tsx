import Image from "next/image";
import { Reveal } from "./Reveal";

export interface Step {
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
}

/** Watermark-numbered steps with paired imagery — mirrors the homepage .step rows. */
export function NumberedSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="ds-steps">
      {steps.map((step, i) => (
        <Reveal as="div" key={step.title} className="ds-step" y={48} delay={i * 0.06}>
          <div className="ds-step-n">{String(i + 1).padStart(2, "0")}</div>
          <div className="ds-step-c">
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
          {step.image && (
            <div className="ds-step-img">
              <Image src={step.image} alt={step.imageAlt ?? step.title} fill sizes="(max-width: 1000px) 100vw, 360px" style={{ objectFit: "cover" }} />
            </div>
          )}
        </Reveal>
      ))}
    </div>
  );
}

export default NumberedSteps;
