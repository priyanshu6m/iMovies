import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "./SectionHeader.css";

export default function SectionHeader({ eyebrow, title, viewAllLink }) {
  return (
    <div className="section-header">
      <div className="section-header__left">
        {eyebrow && <span className="section-header__eyebrow">{eyebrow}</span>}
        <h2 className="section-header__title">{title}</h2>
      </div>
      {viewAllLink && (
        <Link to={viewAllLink} className="section-header__view-all">
          View All <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
