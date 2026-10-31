import type { DeputyAttendance } from "@polar/db";
import { CircleCheck, TriangleAlert } from "lucide-react";
import styles from "./AttendanceSummary.module.scss";

interface AttendanceItemProps {
    title: string;
    attendance: DeputyAttendance;
    unit: { singular: string; plural: string };
    unjustifiedPlace: string;
}

function countText(count: number, unit: { singular: string; plural: string }): string {
    return `${count} ${count === 1 ? unit.singular : unit.plural}`;
}

function AttendanceItem({ title, attendance, unit, unjustifiedPlace }: Readonly<AttendanceItemProps>) {
    const total = attendance.present + attendance.justifiedAbsences + attendance.unjustifiedAbsences;
    const share = (count: number) => (total === 0 ? 0 : (count / total) * 100);
    const rows = [
        { key: "present", label: "Presente", count: attendance.present, className: styles.present },
        { key: "justified", label: "Falta justificada", count: attendance.justifiedAbsences, className: styles.justified },
        { key: "unjustified", label: "Falta sem justificativa", count: attendance.unjustifiedAbsences, className: styles.unjustified },
    ];

    return (
        <div className={styles.item}>
            <h3 className={styles.title}>{title}</h3>
            {total === 0 ? (
                <p className={styles.empty}>Nenhum registro neste ano.</p>
            ) : (
                <>
                    <p className={styles.figure}>
                        <span>{Math.round(share(attendance.present))}%</span> de presença
                    </p>
                    <div
                        className={styles.bar}
                        role="img"
                        aria-label={rows.map((row) => `${row.label}: ${countText(row.count, unit)}`).join(", ")}
                    >
                        {rows.map((row) => (
                            <i key={row.key} className={row.className} style={{ width: `${share(row.count)}%` }} />
                        ))}
                    </div>
                    <dl className={styles.rows}>
                        {rows.map((row) => (
                            <div key={row.key}>
                                <dt>
                                    <span className={`${styles.key} ${row.className}`} aria-hidden="true" />
                                    {row.label}
                                </dt>
                                <dd>{countText(row.count, unit)}</dd>
                            </div>
                        ))}
                    </dl>
                    {attendance.unjustifiedAbsences === 0 ? (
                        <p className={`${styles.unjustifiedNote} ${styles.none}`}>
                            <CircleCheck aria-hidden="true" />
                            Nenhuma falta sem justificativa.
                        </p>
                    ) : (
                        <p className={styles.unjustifiedNote}>
                            <TriangleAlert aria-hidden="true" />
                            <span>
                                <strong>{attendance.unjustifiedAbsences}</strong>{" "}
                                {attendance.unjustifiedAbsences === 1 ? "falta sem justificativa" : "faltas sem justificativa"}{" "}
                                {unjustifiedPlace}.
                            </span>
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

interface AttendanceSummaryProps {
    plenary: DeputyAttendance;
    committees: DeputyAttendance;
}

export function AttendanceSummary({ plenary, committees }: Readonly<AttendanceSummaryProps>) {
    return (
        <div className={styles.attendance}>
            <AttendanceItem
                title="Plenário"
                attendance={plenary}
                unit={{ singular: "dia", plural: "dias" }}
                unjustifiedPlace="em dias de votação no plenário"
            />
            <AttendanceItem
                title="Comissões"
                attendance={committees}
                unit={{ singular: "reunião", plural: "reuniões" }}
                unjustifiedPlace="em reuniões de comissão"
            />
        </div>
    );
}