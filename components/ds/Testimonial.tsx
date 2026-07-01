interface TestimonialProps {
  quote: string;
  author: string;
  location?: string;
  /** initial shown in the avatar circle; defaults to first letter of author */
  initial?: string;
  secondary?: { quote: string; attribution: string };
}

/** Centred testimonial "theatre" on a dark section — mirrors the homepage .twrap. */
export function Testimonial({ quote, author, location, initial, secondary }: TestimonialProps) {
  return (
    <div className="ds-tw">
      <div className="ds-tmark">&ldquo;</div>
      <p className="ds-tquote">{quote}</p>
      <div className="ds-tauth">
        <div className="ds-tav">{initial ?? author.charAt(0)}</div>
        <div>
          <div className="ds-tnm">{author}</div>
          {location && <div className="ds-tlo">{location}</div>}
        </div>
      </div>
      {secondary && (
        <>
          <div className="ds-tdiv" />
          <div className="ds-tsec">
            <p>&ldquo;{secondary.quote}&rdquo;</p>
            <div className="ds-tsec-a">{secondary.attribution}</div>
          </div>
        </>
      )}
    </div>
  );
}

export default Testimonial;
