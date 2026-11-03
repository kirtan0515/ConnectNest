import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, CalendarDays } from "lucide-react";
import { getRecommendations } from "../../services/eventServices";
import "./Recommendations.css";

/**
 * "Recommended for you" — a short, explainable list of upcoming events the
 * backend scored for this user (organizer affinity + popularity + freshness).
 * Renders nothing until it has at least one suggestion, so it never leaves an
 * empty card on the dashboard.
 */
export default function Recommendations() {
  const [items, setItems] = useState([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getRecommendations();
        if (!alive) return;
        setItems(res.items);
        setPersonalized(res.personalized);
      } catch (err) {
        console.error("Recommendations error:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <section className="card rec" aria-labelledby="rec-title">
      <div className="rec__head">
        <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
        <h2 id="rec-title" className="rec__title">
          {personalized ? "Recommended for you" : "Popular on campus"}
        </h2>
      </div>
      <ul className="rec__list">
        {items.map((e) => (
          <li key={e.eventId}>
            <button
              type="button"
              className="rec__item"
              onClick={() => navigate(`/events/${e.eventId}`)}
            >
              <span className="rec__date" aria-hidden="true">
                {e.startsAt ? (
                  <>
                    <span className="rec__month">
                      {new Date(e.startsAt).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </span>
                    <span className="rec__day">
                      {new Date(e.startsAt).getDate()}
                    </span>
                  </>
                ) : (
                  <CalendarDays size={18} strokeWidth={1.75} />
                )}
              </span>
              <span className="rec__body">
                <span className="rec__name">{e.title}</span>
                {Array.isArray(e.reasons) && e.reasons.length > 0 && (
                  <span className="rec__reason">{e.reasons[0]}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
