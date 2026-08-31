export interface Summary {
	n: number;
	min: number;
	p50: number;
	p90: number;
	p99: number;
	mean: number;
	max: number;
}

export function summarize(samples: number[]): Summary {
	const s = [...samples].sort((a, b) => a - b);
	const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
	return {
		n: s.length,
		min: s[0],
		p50: at(0.5),
		p90: at(0.9),
		p99: at(0.99),
		mean: s.reduce((a, b) => a + b, 0) / s.length,
		max: s[s.length - 1],
	};
}

export const median = (xs: number[]): number => {
	const s = [...xs].sort((a, b) => a - b);
	return s[Math.floor(s.length / 2)];
};

export const ms = (n: number) => `${n.toFixed(1)}`;
export const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)}`;
