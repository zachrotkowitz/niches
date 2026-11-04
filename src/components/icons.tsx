// One stroke icon set, drawn to match the mockups (24px grid, round joins).

import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string; filled?: boolean; strokeWidth?: number };

const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24' });

export function HomeIcon({ size = 24, color = '#14161A', filled }: IconProps) {
  return filled ? (
    <Svg {...base(size)}>
      <Path d="M3 10.6 12 3.2l9 7.4V20a1 1 0 0 1-1 1h-5.2v-6.2H9.2V21H4a1 1 0 0 1-1-1z" fill={color} />
    </Svg>
  ) : (
    <Svg {...base(size)}>
      <Path d="M3.5 10.8 12 3.8l8.5 7V20a.5.5 0 0 1-.5.5h-5v-6h-6v6H4a.5.5 0 0 1-.5-.5z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function SearchIcon({ size = 24, color = '#14161A', filled }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx={11} cy={11} r={6.5} fill="none" stroke={color} strokeWidth={filled ? 2.4 : 1.8} />
      <Path d="m20 20-4.2-4.2" stroke={color} strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 20, color = '#FFFFFF', strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function BookmarkIcon({ size = 24, color = '#14161A', filled }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-3.8-6.5 3.8v-16a1 1 0 0 1 1-1z" fill={filled ? color : 'none'} stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function PersonIcon({ size = 24, color = '#14161A', filled }: IconProps) {
  return filled ? (
    <Svg {...base(size)}>
      <Circle cx={12} cy={8.5} r={4.2} fill={color} />
      <Path d="M4 21c1.4-3.9 4.4-6 8-6s6.6 2.1 8 6z" fill={color} />
    </Svg>
  ) : (
    <Svg {...base(size)}>
      <Circle cx={12} cy={8.5} r={4} fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M4.5 20.5c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function HeartIcon({ size = 21, color = '#3E444B', filled }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M12 20.3s-7.5-4.4-8.9-9.2C2.2 7.9 4.1 4.6 7.4 4.6c2 0 3.5 1.1 4.6 2.7 1.1-1.6 2.6-2.7 4.6-2.7 3.3 0 5.2 3.3 4.3 6.5-1.4 4.8-8.9 9.2-8.9 9.2z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** @deprecated Likes use HeartIcon. */
export function CheerIcon({ size = 21, color = '#3E444B' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

export function CommentIcon({ size = 21, color = '#3E444B' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function BellIcon({ size = 22, color = '#14161A' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 22, color = '#14161A' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Rect x={3.5} y={5} width={17} height={15.5} rx={2.5} fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M3.5 10h17M8 3v4M16 3v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function MoreIcon({ size = 20, color = '#5B6168' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx={5} cy={12} r={1.6} fill={color} />
      <Circle cx={12} cy={12} r={1.6} fill={color} />
      <Circle cx={19} cy={12} r={1.6} fill={color} />
    </Svg>
  );
}

export function CheckIcon({ size = 22, color = '#FFFFFF', strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 24, color = '#14161A' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="m14.5 5-7 7 7 7" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlayIcon({ size = 22, color = '#14161A' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M8 5.5v13l10.5-6.5z" fill={color} />
    </Svg>
  );
}

export function PauseIcon({ size = 22, color = '#14161A' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Rect x={6} y={5} width={4} height={14} rx={1} fill={color} />
      <Rect x={14} y={5} width={4} height={14} rx={1} fill={color} />
    </Svg>
  );
}

export function TrendIcon({ size = 13, color = '#123F2A' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M4 18 10 12l4 4 6-8" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LockIcon({ size = 15, color = '#3E444B' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Rect x={5} y={10.5} width={14} height={10} rx={2} fill="none" stroke={color} strokeWidth={2} />
      <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function CameraIcon({ size = 30, color = 'rgba(255,255,255,0.75)' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx={12} cy={13.5} r={3.5} fill="none" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function PostsLayoutIcon({ size = 15, color = '#123F2A' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Rect x={4} y={3.5} width={16} height={11} rx={2} fill="none" stroke={color} strokeWidth={2} />
      <Path d="M4 19h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function GridLayoutIcon({ size = 15, color = '#123F2A' }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Rect x={4} y={3.5} width={7} height={10} rx={1.5} fill="none" stroke={color} strokeWidth={2} />
      <Rect x={13} y={3.5} width={7} height={6} rx={1.5} fill="none" stroke={color} strokeWidth={2} />
      <Rect x={4} y={15.5} width={7} height={5} rx={1.5} fill="none" stroke={color} strokeWidth={2} />
      <Rect x={13} y={11.5} width={7} height={9} rx={1.5} fill="none" stroke={color} strokeWidth={2} />
    </Svg>
  );
}
