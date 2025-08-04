export const darkenColor = (cardColorHex: string, darkenFactor = 0.2) => {
	const hex = cardColorHex.replace('#', '');
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	const newR = Math.max(0, Math.floor(r * (1 - darkenFactor)));
	const newG = Math.max(0, Math.floor(g * (1 - darkenFactor)));
	const newB = Math.max(0, Math.floor(b * (1 - darkenFactor)));

	const toHex = (n: number) => n.toString(16).padStart(2, '0');
	return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

export const lightenColor = (hexColor: string, lightenFactor = 0.15) => {
	const hex = hexColor.replace('#', '');

	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	const newR = Math.min(255, Math.floor(r + (255 - r) * lightenFactor));
	const newG = Math.min(255, Math.floor(g + (255 - g) * lightenFactor));
	const newB = Math.min(255, Math.floor(b + (255 - b) * lightenFactor));

	const toHex = (n) => n.toString(16).padStart(2, '0');
	return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};
