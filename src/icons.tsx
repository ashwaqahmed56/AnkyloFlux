import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function Icon({ size = 20, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.5 6.2c0-.8.9-1.3 1.6-.9l8.8 5.8c.7.4.7 1.4 0 1.8l-8.8 5.8c-.7.4-1.6-.1-1.6-.9V6.2z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="5.5" width="3.4" height="13" rx="1.1" fill="currentColor" stroke="none" />
      <rect x="13.6" y="5.5" width="3.4" height="13" rx="1.1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="7" width="10" height="10" rx="1.4" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function Back10Icon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 8.5A8.5 8.5 0 1 1 3.5 12" />
      <path d="M4.5 3.5v5h5" />
      <text x="12.5" y="16" textAnchor="middle" fontSize="7" fontWeight="600" fill="currentColor" stroke="none" fontFamily="inherit">10</text>
    </Icon>
  );
}

export function Forward10Icon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.5 8.5A8.5 8.5 0 1 0 20.5 12" />
      <path d="M19.5 3.5v5h-5" />
      <text x="11.5" y="16" textAnchor="middle" fontSize="7" fontWeight="600" fill="currentColor" stroke="none" fontFamily="inherit">10</text>
    </Icon>
  );
}

export function PrevTrackIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18.5 5.5v13" />
      <path d="M9.5 5.8c.8 0 1.4.7 1.4 1.5v9.4c0 .8-.6 1.5-1.4 1.5-.7 0-1.3-.4-1.6-1L5 13.1a1.1 1.1 0 0 1 0-1.7l2.9-4.5c.3-.5.9-.9 1.6-.9z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function NextTrackIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 5.5v13" />
      <path d="M14.5 5.8c-.8 0-1.4.7-1.4 1.5v9.4c0 .8.6 1.5 1.4 1.5.7 0 1.3-.4 1.6-1l2.9-4.6a1.1 1.1 0 0 0 0-1.7l-2.9-4.5c-.3-.5-.9-.9-1.6-.9z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function VolumeHighIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.4v5.2c0 .5.4.9.9.9h2.6l4 3.6c.7.6 1.8.1 1.8-.9V5.8c0-1-1.1-1.5-1.8-.9l-4 3.6H4.9c-.5 0-.9.4-.9.9z" fill="currentColor" stroke="none" />
      <path d="M15.8 9.2a4.2 4.2 0 0 1 0 5.6" />
      <path d="M18.3 6.7a7.8 7.8 0 0 1 0 10.6" />
    </Icon>
  );
}

export function VolumeLowIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.4v5.2c0 .5.4.9.9.9h2.6l4 3.6c.7.6 1.8.1 1.8-.9V5.8c0-1-1.1-1.5-1.8-.9l-4 3.6H4.9c-.5 0-.9.4-.9.9z" fill="currentColor" stroke="none" />
      <path d="M15.8 9.2a4.2 4.2 0 0 1 0 5.6" />
    </Icon>
  );
}

export function VolumeMuteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.4v5.2c0 .5.4.9.9.9h2.6l4 3.6c.7.6 1.8.1 1.8-.9V5.8c0-1-1.1-1.5-1.8-.9l-4 3.6H4.9c-.5 0-.9.4-.9.9z" fill="currentColor" stroke="none" />
      <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" />
    </Icon>
  );
}

export function FullscreenIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9" />
      <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9" />
      <path d="M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15" />
      <path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />
    </Icon>
  );
}

export function FullscreenExitIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 4v3.5A1.5 1.5 0 0 1 7.5 9H4" />
      <path d="M20 9h-3.5A1.5 1.5 0 0 1 15 7.5V4" />
      <path d="M15 20v-3.5a1.5 1.5 0 0 1 1.5-1.5H20" />
      <path d="M4 15h3.5A1.5 1.5 0 0 1 9 16.5V20" />
    </Icon>
  );
}

export function GearIcon(props: IconProps) {
  const spokes = [
    [17.2, 12, 19.5, 12], [15.7, 15.7, 17.3, 17.3], [12, 17.2, 12, 19.5],
    [8.3, 15.7, 6.7, 17.3], [6.8, 12, 4.5, 12], [8.3, 8.3, 6.7, 6.7],
    [12, 6.8, 12, 4.5], [15.7, 8.3, 17.3, 6.7],
  ] as const;
  return (
    <Icon {...props}>
      {spokes.map(([x1, y1, x2, y2], i) => (
        <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} />
      ))}
      <circle cx="12" cy="12" r="3.1" />
    </Icon>
  );
}

export function PlaylistIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h9M4 10h9M4 14h5" />
      <path d="M15.5 14.4v9.2c0 .8.9 1.3 1.6.9l5.2-3.6c.6-.4.6-1.4 0-1.8l-5.2-3.6c-.7-.4-1.6.1-1.6.9z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11.2v5" />
      <circle cx="12" cy="7.9" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function SpeedIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.8 18.5a8.7 8.7 0 1 1 14.4 0" />
      <path d="M12 14.5l3.4-4.6" />
      <circle cx="12" cy="14.6" r="1.3" />
    </Icon>
  );
}

export function SubtitleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 11.5h5M7 15h9" />
    </Icon>
  );
}

export function AudioTrackIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />
    </Icon>
  );
}

export function AspectIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="6.5" width="18" height="11" rx="1.5" />
      <rect x="8.5" y="9" width="7" height="6" rx="1" />
    </Icon>
  );
}

export function AdjustIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="7.5" cy="17" r="2" />
    </Icon>
  );
}

export function BrightnessIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
    </Icon>
  );
}

export function ContrastIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17V3.5z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function SaturationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.2s5.6 6.2 5.6 10.3a5.6 5.6 0 0 1-11.2 0C6.4 9.4 12 3.2 12 3.2z" />
      <path d="M9.5 13.5a2.6 2.6 0 0 0 2.5 2.7" />
    </Icon>
  );
}

export function GammaIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12h3l2-6.5 4 13 2-6.5h7" />
    </Icon>
  );
}

export function HueIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5A8.5 8.5 0 0 1 20.5 12H12V3.5z" fill="currentColor" stroke="none" />
      <path d="M12 12l6.2-6.2" />
    </Icon>
  );
}

export function SharpnessIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.8l7.2 9.2L12 21.2 4.8 12z" />
      <path d="M12 8.2l3.6 4.6-3.6 4.6-3.6-4.6z" />
    </Icon>
  );
}

export function ScreenshotIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8h3l1.6-2.6h6.8L17 8h3a1.5 1.5 0 0 1 1.5 1.5V18A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9.5A1.5 1.5 0 0 1 4 8z" />
      <circle cx="12" cy="13.6" r="3.4" />
    </Icon>
  );
}

export function PipIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <rect x="13" y="12" width="7" height="5" rx="1" />
    </Icon>
  );
}

export function MiniIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M9.5 10.5l2.5 2.5 2.5-2.5" />
    </Icon>
  );
}

export function LoopIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17 2.8l2.8 2.8-2.8 2.8" />
      <path d="M4.5 11V9a3 3 0 0 1 3-3h12.2" />
      <path d="M7 21.2L4.2 18.4 7 15.6" />
      <path d="M19.5 13v2a3 3 0 0 1-3 3H4.3" />
    </Icon>
  );
}

export function LoopABIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17 2.8l2.8 2.8-2.8 2.8" />
      <path d="M4.5 11V9a3 3 0 0 1 3-3h12.2" />
      <path d="M7 21.2L4.2 18.4 7 15.6" />
      <path d="M19.5 13v2a3 3 0 0 1-3 3H4.3" />
      <circle cx="7.2" cy="5.4" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16.8" cy="18.6" r="1.1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function KeyboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h.01M10.5 10h.01M14 10h.01M17.5 10h.01M7 14h.01M17.5 14h.01M10.5 14h3" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h3.4l2 2.5h7.1a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
    </Icon>
  );
}

export function FileIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3.5h7L18 8.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M13 3.5V8.5H18" />
    </Icon>
  );
}

export function FileVideoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3.5h7L18 8.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M13 3.5V8.5H18" />
      <path d="M10.3 12.3v4.4l3.8-2.2z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.4V12l3.1 2" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9.5l6 6 6-6" />
    </Icon>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 14.5l6-6 6 6" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 6l-6 6 6 6" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 6l6 6-6 6" />
    </Icon>
  );
}

export function DotsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function GripIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </Icon>
  );
}

export function ChipIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3" />
    </Icon>
  );
}

export function RotateIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <path d="M20.5 3.5V8h-4.5" />
    </Icon>
  );
}

export function MirrorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M12 5v14" />
      <path d="M8.5 9L6 12l2.5 3M15.5 9L18 12l-2.5 3" />
    </Icon>
  );
}

export function DeinterlaceIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 15h16M4 19h16" />
      <path d="M4 11h9" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5S9.5 5.8 12 3.5z" />
    </Icon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 6.5h15" />
      <path d="M9 6V4.8A1 1 0 0 1 10 3.8h4a1 1 0 0 1 1 1V6" />
      <path d="M6.5 6.5l.9 12.1a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.1" />
      <path d="M10 10.5v5.5M14 10.5v5.5" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 4.5h11V20l-5.5-3.8L6.5 20z" />
    </Icon>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5.5V9h3.5" />
      <path d="M4.6 9.5a8 8 0 1 1 1 6.9" />
      <path d="M12 8v4.2l2.9 1.6" />
    </Icon>
  );
}

export function ChapterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 20.5V4" />
      <path d="M5.5 5h10.5l-2.5 3.5 2.5 3.5H5.5" />
    </Icon>
  );
}

export function EqualizerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 19v-9M9.5 19V5M14 19v-7M18.5 19v-5" />
    </Icon>
  );
}

export function HdrIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M7 10.2h10M7 13.8h10" />
    </Icon>
  );
}

export function OpenIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 8A1.5 1.5 0 0 1 5 6.5h3.4l2 2.5h7.1a1.5 1.5 0 0 1 1.5 1.5v.7" />
      <path d="M4.6 10.4h12.7a1.5 1.5 0 0 1 1.4 1.9l-1.3 5.6a1.5 1.5 0 0 1-1.4 1.1H5.9a1.5 1.5 0 0 1-1.4-1.3z" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v9.5M7.8 10.2L12 14.5l4.2-4.3" />
      <path d="M4.5 19.5h15" />
    </Icon>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5.5M6 11.5l6-6 6 6" />
    </Icon>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v13.5M6 12.5l6 6 6-6" />
    </Icon>
  );
}

export function ShuffleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 6.5H8l9.5 9.5h4" />
      <path d="M21.5 16l-2.4 2.4M21.5 16l-2.4-2.4" />
      <path d="M3.5 17.5H8l2.3-2.3M13.7 9.8l2.3-2.3h4" />
      <path d="M21.5 7.5l-2.4 2.4M21.5 7.5l-2.4-2.4" />
    </Icon>
  );
}

export function TonemapIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 13.6A8 8 0 1 1 10.4 4 6.6 6.6 0 0 0 20 13.6z" />
    </Icon>
  );
}

export function BrandIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.8l7.2 3v5.1c0 4.6-3 8.1-7.2 10.3-4.2-2.2-7.2-5.7-7.2-10.3V5.8z" />
      <path d="M12 8.2v6.4M9.4 10.6l5.2 0-5.2 2.8" />
    </Icon>
  );
}

export function GithubIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
        fill="currentColor"
        stroke="none"
      />
    </Icon>
  );
}

export function LinkedinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.62 1.62 0 1 0 0-3.24 1.62 1.62 0 0 0 0 3.24m1.39 9.74v-8.37H5.07v8.37h2.78z"
        fill="currentColor"
        stroke="none"
      />
    </Icon>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </Icon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  );
}


export const ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  play: PlayIcon,
  pause: PauseIcon,
  stop: StopIcon,
  back10: Back10Icon,
  forward10: Forward10Icon,
  prev: PrevTrackIcon,
  next: NextTrackIcon,
  volumeHigh: VolumeHighIcon,
  volumeLow: VolumeLowIcon,
  volumeMute: VolumeMuteIcon,
  fullscreen: FullscreenIcon,
  fullscreenExit: FullscreenExitIcon,
  gear: GearIcon,
  playlist: PlaylistIcon,
  info: InfoIcon,
  speed: SpeedIcon,
  subtitle: SubtitleIcon,
  audioTrack: AudioTrackIcon,
  aspect: AspectIcon,
  adjust: AdjustIcon,
  brightness: BrightnessIcon,
  contrast: ContrastIcon,
  saturation: SaturationIcon,
  gamma: GammaIcon,
  hue: HueIcon,
  sharpness: SharpnessIcon,
  screenshot: ScreenshotIcon,
  pip: PipIcon,
  mini: MiniIcon,
  loop: LoopIcon,
  loopAB: LoopABIcon,
  keyboard: KeyboardIcon,
  close: CloseIcon,
  folder: FolderIcon,
  file: FileIcon,
  fileVideo: FileVideoIcon,
  clock: ClockIcon,
  check: CheckIcon,
  chevronDown: ChevronDownIcon,
  chevronUp: ChevronUpIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  dots: DotsIcon,
  grip: GripIcon,
  search: SearchIcon,
  chip: ChipIcon,
  rotate: RotateIcon,
  mirror: MirrorIcon,
  deinterlace: DeinterlaceIcon,
  globe: GlobeIcon,
  trash: TrashIcon,
  plus: PlusIcon,
  bookmark: BookmarkIcon,
  history: HistoryIcon,
  chapter: ChapterIcon,
  equalizer: EqualizerIcon,
  hdr: HdrIcon,
  open: OpenIcon,
  download: DownloadIcon,
  arrowUp: ArrowUpIcon,
  arrowDown: ArrowDownIcon,
  shuffle: ShuffleIcon,
  tonemap: TonemapIcon,
  brand: BrandIcon,
  github: GithubIcon,
  linkedin: LinkedinIcon,
  externalLink: ExternalLinkIcon,
  copy: CopyIcon,
  user: UserIcon,
};

export function NamedIcon({ name, ...props }: IconProps & { name: string }) {
  const Cmp = ICONS[name] ?? DotsIcon;
  return <Cmp {...props} />;
}
