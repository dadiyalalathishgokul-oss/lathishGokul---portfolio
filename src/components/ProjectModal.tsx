import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ProjectSpec } from '../types/portfolio';
import { ResilientImage } from './ResilientImage';

interface ProjectModalProps {
  project: ProjectSpec | null;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    if (!project) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-[var(--surface)] border border-[var(--line)] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[var(--line)]">
          <div>
            <p className="text-xs text-[var(--muted)]">{project.category}</p>
            <h3
              id="project-modal-title"
              className="font-display text-xl font-bold text-[var(--ink)]"
            >
              {project.index_label}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project details"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-alt)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="aspect-[16/9] w-full bg-[var(--surface-alt)] overflow-hidden">
          <ResilientImage
            src={project.image_path}
            alt={project.title}
            fallbackTitle={project.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 space-y-5">
          <p className="text-[15px] leading-relaxed text-[var(--ink)]">{project.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[var(--line)]">
            <div>
              <h4 className="text-sm font-semibold text-[var(--ink)] mb-2">Role &amp; Python Layer</h4>
              <p className="text-sm text-[var(--muted)] mb-2">{project.role}</p>
              <p className="text-sm text-[var(--accent)] font-medium">
                {project.python_component}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--ink)] mb-2">Engineering Highlights</h4>
              <ul className="space-y-1.5 text-sm text-[var(--muted)] list-disc pl-4">
                {project.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--line)] text-xs text-[var(--muted)]">
            {project.stack.join(' · ')}
          </div>
        </div>
      </div>
    </div>
  );
}
