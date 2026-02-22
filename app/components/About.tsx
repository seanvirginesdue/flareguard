export default function About() {
  return (
    <section id="about" className="py-8 md:py-12 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <img
          src="/about.jpg"
          alt="About us"
          className="w-full max-w-md mx-auto rounded-lg shadow-lg object-cover"
        />
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-red-600 text-center md:text-left">
            Welcome to the BFP ARAYAT
          </h2>
          <p className="text-gray-700 mb-4 text-center md:text-left">
            We are committed to protecting the community through emergency
            response, education, and prevention.
          </p>
          <p className="text-gray-700 text-center md:text-left">
            Our team is trained, equipped, and ready to respond to any emergency
            24/7.
          </p>
        </div>
      </div>
    </section>
  );
}
