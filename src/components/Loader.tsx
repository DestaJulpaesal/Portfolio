interface LoaderProps {
  exiting: boolean;
}

export function Loader({ exiting }: LoaderProps) {
  return (
    <div
      className={`wireframe ${exiting ? "wireframeExiting" : ""}`}
      role="status"
      aria-label="Memuat halaman"
      aria-busy={!exiting}
      aria-hidden={exiting}
    >
      <header className="wireframeHeader" aria-hidden="true">
        <div className="wireframeBrand">
          <span className="wireframeMark">
            <img src="/logo.png" alt="" />
          </span>
          <span className="wireframeSkeleton wireframeBrandName" />
        </div>
        <div className="wireframeNav">
          <span className="wireframeSkeleton" />
          <span className="wireframeSkeleton" />
          <span className="wireframeSkeleton" />
          <span className="wireframeSkeleton" />
          <span className="wireframeSkeleton" />
        </div>
        <span className="wireframeSkeleton wireframeHeaderButton" />
      </header>

      <main className="wireframeHero" aria-hidden="true">
        <div className="wireframeCopy">
          <span className="wireframeSkeleton wireframeEyebrow" />
          <div className="wireframeTitle">
            <span className="wireframeSkeleton wireframeTitleLine" />
            <span className="wireframeSkeleton wireframeTitleLine wireframeTitleAccent" />
          </div>
          <div className="wireframeParagraph">
            <span className="wireframeSkeleton" />
            <span className="wireframeSkeleton" />
            <span className="wireframeSkeleton" />
          </div>
          <div className="wireframeActions">
            <span className="wireframeSkeleton wireframePrimaryButton" />
            <span className="wireframeSkeleton wireframeSecondaryButton" />
          </div>
          <div className="wireframeSocials">
            <span className="wireframeSkeleton" />
            <span className="wireframeSkeleton" />
            <span className="wireframeSkeleton" />
            <span className="wireframeSkeleton" />
          </div>
        </div>

        <div className="wireframeVisual">
          <span className="wireframeOrbit" />
          <span className="wireframePortrait" />
        </div>
      </main>
    </div>
  );
}
