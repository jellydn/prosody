import type { SvgProps } from "react-native-svg";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

export interface LogoProps extends Omit<SvgProps, "width" | "height"> {
  /**
   * Height of the logo. Width is calculated based on aspect ratio.
   * @default 40
   */
  size?: number;
  /**
   * Primary color for the icon and colored text elements.
   * @default "#007AFF"
   */
  color?: string;
  /**
   * Show/hide the text portion of the logo.
   * @default true
   */
  showText?: boolean;
}

export function Logo({ size = 40, color = "#007AFF", showText = true, ...props }: LogoProps) {
  // Calculate width based on icon size + text width
  // Icon is 40x40, text adds approximately 160px
  const width = showText ? size * 5 : size;

  return (
    <Svg width={width} height={size} viewBox="0 0 200 40" fill="none" {...props}>
      {/* Icon: Sound wave + rhythm dots */}
      <G id="logo-icon">
        {/* Sound wave lines */}
        <Path
          d="M4 20C4 14.48 8.48 10 14 10"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Path
          d="M0 20C0 12.27 6.27 6 14 6"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <Path
          d="M40 20C40 25.52 35.52 30 30 30"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Path
          d="M44 20C44 27.73 37.73 34 30 34"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Rhythm dots - representing the beat/coaching aspect */}
        <Circle cx="22" cy="12" r="2.5" fill={color} opacity="0.6" />
        <Circle cx="22" cy="20" r="3" fill={color} />
        <Circle cx="22" cy="28" r="2.5" fill={color} opacity="0.6" />
      </G>

      {/* Text portion */}
      {showText && (
        <G id="logo-text">
          {/* "English" in gray, "Rhythm" in primary color, "Coach" in gray */}
          <SvgText x="50" y="25" fontSize="14" fontWeight="600" fill="#1a1a1a" fontFamily="System">
            English{" "}
          </SvgText>
          <SvgText x="108" y="25" fontSize="14" fontWeight="600" fill={color} fontFamily="System">
            Rhythm{" "}
          </SvgText>
          <SvgText x="165" y="25" fontSize="14" fontWeight="600" fill="#1a1a1a" fontFamily="System">
            Coach
          </SvgText>
        </G>
      )}
    </Svg>
  );
}
