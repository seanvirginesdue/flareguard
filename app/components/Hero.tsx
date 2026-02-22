export default function Hero() {
  return (
    <section
      className="relative bg-gray-900 min-h-[60vh] md:min-h-[80vh] flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/hero.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative text-center text-white px-4 sm:px-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
          Integrity. Honor. Courage.
        </h1>
        <p className="text-base sm:text-lg md:text-xl max-w-xl mx-auto mb-6">
          Dedicated to serving and protecting with honor and integrity.
        </p>
      </div>
    </section>
  );
}
