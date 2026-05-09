export default function PromoSection() {
  return (
    <section className="ps5-divider">
      <div className="ps5-line top" />
      <div className="ps5-line bottom" />

      <div className="ps5-content">
        <div className="ps5-mini">SOLO LOS MÁS FUERTES</div>

        <div className="ps5-text">
          PARA LLEGAR A LA FINAL
        </div>

        <div
          className="ps5-highlight"
          style={{
            color: "#00C853",
            textShadow: "0 0 25px rgba(0,200,83,0.5)"
          }}
        >
          MANTENTE CON VIDA
        </div>
      </div>
    </section>
  );
}