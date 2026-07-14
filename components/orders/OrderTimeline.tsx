import { ORDER_STATUS_LABELS, type Order } from "@/lib/orders";
import { cx } from "@/lib/utils";

interface Props {
  order: Order;
  compact?: boolean;
}

export default function OrderTimeline({ order, compact }: Props) {
  const events = [...order.statusHistory].reverse();
  return (
    <ol className={cx("mc-timeline", compact && "mc-timeline--compact")}>
      {events.map((e, i) => {
        const label = ORDER_STATUS_LABELS[e.to] ?? e.to;
        const isLatest = i === 0;
        return (
          <li
            key={i}
            className={cx(
              "mc-timeline__row",
              isLatest && "is-current",
              `is-status-${e.to}`,
            )}
          >
            <span className="mc-timeline__dot" aria-hidden />
            <div className="mc-timeline__body">
              <p className="mc-timeline__title">
                {label}
                <span className="mc-timeline__by">
                  {" "}· by {e.by}
                </span>
              </p>
              <p className="mc-timeline__date">
                {new Date(e.at).toLocaleString()}
              </p>
              {e.note && <p className="mc-timeline__note">{e.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
