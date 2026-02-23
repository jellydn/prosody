import type { SvgProps } from "react-native-svg";
import LogoAsset from "../assets/logo.svg";

const FULL_LOGO_ASPECT_RATIO = 400 / 80;
const ICON_ONLY_ASPECT_RATIO = 88 / 80;
const ICON_ONLY_VIEWBOX = "0 0 88 80";

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
  void color;

  if (!showText) {
    return (
      <LogoAsset
        width={size * ICON_ONLY_ASPECT_RATIO}
        height={size}
        viewBox={ICON_ONLY_VIEWBOX}
        {...props}
      />
    );
  }

  return <LogoAsset width={size * FULL_LOGO_ASPECT_RATIO} height={size} {...props} />;
}
