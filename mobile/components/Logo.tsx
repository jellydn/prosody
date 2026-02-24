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
	 * Show/hide the text portion of the logo.
	 * @default true
	 */
	showText?: boolean;
}

export function Logo({ size = 40, showText = true, ...props }: LogoProps) {
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

	return (
		<LogoAsset width={size * FULL_LOGO_ASPECT_RATIO} height={size} {...props} />
	);
}
