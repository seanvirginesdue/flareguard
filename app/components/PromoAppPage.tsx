export default function PromoAppPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 md:px-10">
      <section className="py-10 md:py-20 max-w-6xl w-full bg-white rounded-3xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0">
        
        <div className="p-6 sm:p-10 lg:p-16 flex flex-col justify-center gap-6 order-2 md:order-1">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">F</div>
            <div>
              <h6 className="text-sm text-gray-500">Introducing</h6>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-700">FlareGuard</h3>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-gray-700">
            Your mobile fire alert and reporting app
          </h1>

          <p className="text-gray-600 max-w-xl text-sm sm:text-base">
            Stay alert and report fire incidents easily. Track real-time activity, receive alerts, and keep your
            community safe — all in one reliable app.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <a
              href="https://www.mediafire.com/file/90l1ciyl85cu26w/app-release.apk/file"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold shadow-md hover:shadow-lg transition"
            >
              Get the App
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Feature number={1} title="Reports" subtitle="Submit alerts fast" />
            <Feature number={2} title="Live Feed" subtitle="Monitor updates" />
            <Feature number={3} title="Safety Tips" subtitle="Stay informed" />
          </div>

          <p className="text-xs text-gray-400 mt-6">Available on Android • Free to use</p>
        </div>

       
        <div className="relative bg-gradient-to-br from-white to-gray-50 flex items-center justify-center p-4 sm:p-8 order-1 md:order-2">
          <div className="relative w-full max-w-[320px] sm:max-w-md h-[400px] sm:h-[500px] mx-auto">
            
            <div className="absolute hidden sm:block -left-6 -top-8 transform rotate-3 opacity-90 shadow-2xl rounded-3xl bg-white w-[180px] sm:w-[220px] h-[340px] sm:h-[420px] overflow-hidden border border-gray-100">
              <img src="/app-screens.jpg" alt="app screens" className="object-cover w-full h-full" />
            </div>

            
            <div className="absolute left-1/2 top-0 transform -translate-x-1/2 rotate-0 opacity-100 shadow-2xl rounded-3xl bg-white w-[220px] sm:w-[260px] h-[420px] sm:h-[500px] overflow-hidden border border-gray-100">
              <img src="/app-screens.jpg" alt="app screens" className="object-cover w-full h-full" />
            </div>

            
            <div className="absolute hidden sm:block right-0 bottom-0 transform -rotate-2 opacity-80 shadow-2xl rounded-3xl bg-white w-[160px] sm:w-[200px] h-[300px] sm:h-[380px] overflow-hidden border border-gray-100">
              <img src="/app-screens.jpg" alt="app screens" className="object-cover w-full h-full" />
            </div>

            
            <div className="absolute left-4 sm:left-6 bottom-6 bg-white rounded-xl shadow p-4 w-48 sm:w-56 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Fire Activity</p>
                  <p className="text-lg font-semibold text-gray-500">Confidence</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold text-sm sm:text-base">
                  75%
                </div>
              </div>
            </div>
          </div>

          
          <div className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
            <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-60" />
            <div className="absolute -left-40 -top-40 w-72 h-72 bg-yellow-50 rounded-full blur-3xl opacity-40" />
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-100 text-red-600 font-semibold flex items-center justify-center">
        {number}
      </div>
      <div>
        <div className="text-sm font-medium text-gray-700">{title}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>
    </div>
  );
}
