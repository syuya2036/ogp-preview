import type { ReactElement } from "react";
import { styles } from "./design.js";
import type { CardProps } from "./types.js";

/** The JSX template shared by satori, @vercel/og and takumi. */
export function Card(props: CardProps): ReactElement {
	const s = styles(props);
	return (
		<div style={s.root}>
			<div style={s.header}>
				<div style={s.logo} />
				<div style={s.site}>{props.site}</div>
			</div>

			<div style={s.body}>
				<div style={s.rule} />
				<div style={s.title}>{props.title}</div>
			</div>

			<div style={s.footer}>
				<div style={s.avatar}>{props.author.slice(0, 1)}</div>
				<div style={s.meta}>
					<div style={s.author}>{props.author}</div>
					<div style={s.date}>{props.date}</div>
				</div>
				<div style={s.tags}>
					{props.tags.map((t) => (
						<div key={t} style={s.tag}>
							{t}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
