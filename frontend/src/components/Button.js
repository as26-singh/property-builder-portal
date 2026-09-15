import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Button({ children, to, onClick, secondary = false, type = "button", testid }) {
  const className = secondary ? "button button-secondary" : "button";
  if (to) {
    return (
      <Link className={className} to={to} data-testid={testid}>
        {children}
        <ArrowRight size={16} />
      </Link>
    );
  }
  return (
    <button className={className} onClick={onClick} type={type} data-testid={testid}>
      {children}
      {!secondary && <ArrowRight size={16} />}
    </button>
  );
}
