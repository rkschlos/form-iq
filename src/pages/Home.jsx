import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="bg-white">
      <section className="container py-5 py-md-6">
        <div className="row align-items-center g-5">
          <div className="col-12 col-md-6">
            <div className="ratio ratio-4x3">
              <img
                src="/test.png"
                alt="Person practicing form with resistance band"
                className="rounded-4 shadow-lg object-fit-cover"
                style={{ objectPosition: '50% 85%' }}
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <h1 className="display-5 fw-semibold text-dark mb-3">FormIQ</h1>
            <p className="lead text-body-secondary">
              Have you ever struggled to understand how your body moves through space? Whether
              you're trying to improve your form during exercise, refine a skill like playing an
              instrument, or simply sit with better posture at your desk — poor body awareness can
              hold you back.
            </p>

            <p className="lead text-body-secondary">
              FormIQ helps bridge that gap by providing visual, geometric feedback on your movement.
            </p>

            <Link
              to="/live"
              className="btn btn-primary btn-lg rounded-pill mt-4 px-4"
              aria-label="Open the FormIQ demo"
            >
              Give FormIQ A Try
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
