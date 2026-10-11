import { useState } from 'react';
import { usePlayerStore } from '../state/playerStore';
import { isDesktop } from '../engine';
import { NamedIcon } from '../icons';
import { openExternal } from '../utils/openExternal';
import { useToastStore } from '../state/toastStore';

export const APP_INFO = {
  name: 'Ankylo',
  version: '0.1.0',
  description: 'Universal, ultra-fast interactive media player powered by libmpv and Tauri.',
  developer: {
    name: 'Ashwaq Ahmed',
    role: 'Lead Developer & Creator',
    github: 'https://github.com/ashwaqahmed56',
    githubHandle: 'ashwaqahmed56',
    linkedin: 'https://in.linkedin.com/in/ashwaq-ahmed-a371b236b',
    linkedinHandle: 'ashwaq-ahmed-a371b236b',
  },
};

export function AboutDialog() {
  const open = usePlayerStore((s) => s.aboutOpen);
  const close = () => usePlayerStore.getState().setAboutOpen(false);
  const toast = useToastStore((s) => s.push);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!open) return null;

  const handleCopy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedLink(label);
    toast(`Copied ${label} to clipboard`, 'check');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
      onPointerDown={close}
    >
      <div
        className="anim-pop-in relative max-h-[90vh] w-full max-w-[500px] overflow-hidden rounded-md2 border border-line bg-surface shadow-2xl"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            <NamedIcon name="brand" size={16} className="text-accent" />
            <span>About Ankylo</span>
          </div>
          <button
            onClick={close}
            aria-label="Close About Dialog"
            className="flex h-7 w-7 items-center justify-center rounded-sm2 text-faint transition-colors duration-fast hover:bg-white/12 hover:text-ink"
          >
            <NamedIcon name="close" size={14} />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="max-h-[76vh] overflow-y-auto px-5 py-5">
          {/* App Hero */}
          <div className="relative mb-5 overflow-hidden rounded-md2 border border-line bg-gradient-to-b from-white/[0.04] to-transparent p-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent-dim text-accent shadow-lg shadow-accent/10">
              <NamedIcon name="brand" size={28} />
            </div>
            <h2 className="text-lg font-bold tracking-wider text-ink">{APP_INFO.name}</h2>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="mono-time inline-flex items-center rounded-full border border-accent/40 bg-accent-dim px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                v{APP_INFO.version}
              </span>
              <span className="mono-time inline-flex items-center rounded-full border border-line bg-base px-2.5 py-0.5 text-[10px] text-faint">
                {isDesktop ? 'libmpv · FFmpeg' : 'Browser Engine'}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              {APP_INFO.description}
            </p>
          </div>

          {/* Developer Card */}
          <div className="mb-5 rounded-md2 border border-line bg-elevated/60 p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
              Developer & Creator
            </div>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-accent/40 bg-accent-dim font-bold text-accent shadow-md">
                <span className="mono-time text-sm font-semibold tracking-wider">AA</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-ink">{APP_INFO.developer.name}</h3>
                  <span className="rounded border border-accent/30 bg-accent-dim px-1.5 py-0.2 text-[9px] font-medium text-accent">
                    Author
                  </span>
                </div>
                <p className="text-[11px] text-muted">{APP_INFO.developer.role}</p>
              </div>
            </div>

            {/* Social / Profiles Links */}
            <div className="space-y-2">
              {/* GitHub */}
              <div className="flex items-center justify-between rounded-sm2 border border-line bg-base/80 px-3 py-2 transition-colors duration-fast hover:border-line hover:bg-base">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-sm2 bg-white/5 text-ink">
                    <NamedIcon name="github" size={15} />
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-faint">GitHub</div>
                    <div className="truncate text-xs font-medium text-ink">{APP_INFO.developer.githubHandle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(APP_INFO.developer.github, 'GitHub URL')}
                    title="Copy GitHub URL"
                    className="flex h-7 w-7 items-center justify-center rounded-sm2 text-muted transition-colors duration-fast hover:bg-white/12 hover:text-ink"
                  >
                    <NamedIcon name={copiedLink === 'GitHub URL' ? 'check' : 'copy'} size={13} className={copiedLink === 'GitHub URL' ? 'text-accent' : ''} />
                  </button>
                  <button
                    onClick={() => void openExternal(APP_INFO.developer.github)}
                    title="Open GitHub Profile"
                    className="flex h-7 items-center gap-1.5 rounded-sm2 border border-line bg-white/5 px-2.5 text-[11px] font-medium text-muted transition-colors duration-fast hover:border-accent hover:bg-accent-dim hover:text-accent"
                  >
                    <span>Visit</span>
                    <NamedIcon name="externalLink" size={11} />
                  </button>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="flex items-center justify-between rounded-sm2 border border-line bg-base/80 px-3 py-2 transition-colors duration-fast hover:border-line hover:bg-base">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-sm2 bg-[#0077b5]/15 text-[#0a84e3]">
                    <NamedIcon name="linkedin" size={15} />
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-faint">LinkedIn</div>
                    <div className="truncate text-xs font-medium text-ink">{APP_INFO.developer.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(APP_INFO.developer.linkedin, 'LinkedIn URL')}
                    title="Copy LinkedIn URL"
                    className="flex h-7 w-7 items-center justify-center rounded-sm2 text-muted transition-colors duration-fast hover:bg-white/12 hover:text-ink"
                  >
                    <NamedIcon name={copiedLink === 'LinkedIn URL' ? 'check' : 'copy'} size={13} className={copiedLink === 'LinkedIn URL' ? 'text-accent' : ''} />
                  </button>
                  <button
                    onClick={() => void openExternal(APP_INFO.developer.linkedin)}
                    title="Open LinkedIn Profile"
                    className="flex h-7 items-center gap-1.5 rounded-sm2 border border-line bg-white/5 px-2.5 text-[11px] font-medium text-muted transition-colors duration-fast hover:border-accent hover:bg-accent-dim hover:text-accent"
                  >
                    <span>Connect</span>
                    <NamedIcon name="externalLink" size={11} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture & Stack Details */}
          <div className="rounded-md2 border border-line p-3.5 bg-base/40">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
              Technology Stack
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Tauri 2', 'Rust', 'libmpv', 'FFmpeg', 'React 18', 'TypeScript', 'TailwindCSS'].map((tech) => (
                <span
                  key={tech}
                  className="mono-time rounded-sm2 border border-line bg-surface/80 px-2 py-0.5 text-[10px] text-muted"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-5 py-3 bg-base/50">
          <span className="mono-time text-[10px] text-faint">
            © {new Date().getFullYear()} {APP_INFO.developer.name} · All rights reserved
          </span>
          <button
            onClick={close}
            className="rounded-sm2 border border-line bg-surface px-3 py-1 text-[11px] text-muted transition-colors duration-fast hover:bg-white/12 hover:text-ink"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
