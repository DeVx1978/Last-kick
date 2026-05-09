export default function BackgroundFX() {
  return (
    <>
      <div
        className="dynamic-bg"
        style={{ backgroundImage: "url('/img/cambio.jpg')" }}
      />

      <div className="vignette" />
      <div className="scanlines" />
      <div className="noise-overlay" />
    </>
  );
}