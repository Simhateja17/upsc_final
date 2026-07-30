'use client';

import Image from 'next/image';
import DemoStage from './DemoStage';

/**
 * Mains Answer Evaluator demo - client asset
 * `mains-evaluator-app-website.html`.
 *
 * Pure CSS on an 8s loop (upload → scan → red-pen markup); no JS
 * timers. The parent hides inactive slides with `display: none`, which
 * stops the animations outright, so nothing runs off-screen.
 *
 * The answer-script image was extracted from the asset's inline base64
 * (the asset embedded the same 37KB JPEG twice) to /public so Next can
 * serve and cache it instead of inlining it into the JS bundle.
 */
export default function MainsEvaluatorDemo() {
  return (
    <DemoStage variant="jd-mains">
      <div className="content">
        {/* Phase 1: upload */}
        <div className="upload-zone">
          <div className="daily-challenge-row">
            <span className="daily-challenge-label">Daily Mains Challenge</span>
            <span className="live-btn"><span className="live-dot" />Live</span>
          </div>
          <div className="upload-box">
            <div className="upload-icon">
              <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" /></svg>
            </div>
            <div className="upload-text">Upload Answer Script</div>
            <div className="upload-sub">PNG, JPG or PDF - OCR enabled</div>
            <div className="upload-btn">Choose File</div>
          </div>
        </div>

        {/* Phase 2: scanning */}
        <div className="scan-phase">
          <div className="img-container">
            <Image src="/landing-demo-answer-script.jpg" alt="" width={380} height={620} priority={false} />
            <div className="scan-beam" />
          </div>
          <div className="scan-bar">
            <div className="scan-spinner" />
            <div className="scan-label">Jeet AI Analyzing Answer…</div>
            <div className="scan-progress"><div className="scan-fill" /></div>
          </div>
        </div>

        {/* Phase 3: red-pen markup */}
        <div className="eval-phase">
          <div className="eval-img-wrap">
            <Image src="/landing-demo-answer-script.jpg" alt="" width={380} height={660} priority={false} />

            {/* Introduction */}
            <div className="rp tick t1 a1" style={{ top: '12%', left: '4%' }}>✓</div>
            <div className="rp note a1" style={{ top: '10%', right: '10%' }}>Well defined</div>
            <div className="rp-under a2" style={{ top: '14%', left: '10%', width: '40%' }} />

            {/* Point 1 */}
            <div className="rp tick t3 a3" style={{ top: '21%', left: '4%' }}>✓</div>
            <div className="rp note a3" style={{ top: '20%', right: '12%' }}>Key point</div>
            <div className="rp-under a3" style={{ top: '22%', left: '15%', width: '35%' }} />

            {/* Point 2 */}
            <div className="rp tick t5 a4" style={{ top: '26%', left: '4%' }}>✓</div>
            <div className="rp note a4" style={{ top: '25%', right: '8%' }}>Important</div>

            {/* Point 3 */}
            <div className="rp tick t2 a5" style={{ top: '31%', left: '4%' }}>✓</div>
            <div className="rp note a5" style={{ top: '30%', right: '15%' }}>Good example</div>
            <div className="rp-under a5" style={{ top: '32%', left: '12%', width: '50%' }} />

            {/* Point 4 - weak */}
            <div className="rp cross c2 a6" style={{ top: '36%', left: '4%' }}>✗</div>
            <div className="rp-wavy a6" style={{ top: '37%', left: '14%', width: '48%' }} />
            <div className="rp note a7" style={{ top: '35%', right: '10%' }}>Need examples</div>
            <div className="rp note a7" style={{ top: '38%', left: '20%' }}>? Explain</div>

            {/* Point 5 */}
            <div className="rp tick t4 a8" style={{ top: '41%', left: '4%' }}>✓</div>
            <div className="rp note a8" style={{ top: '40%', right: '14%' }}>Relevant</div>

            {/* Point 6 */}
            <div className="rp tick t1 a9" style={{ top: '46%', left: '4%' }}>✓</div>
            <div className="rp note a9" style={{ top: '45%', right: '10%' }}>Good coverage</div>
            <div className="rp-under a9" style={{ top: '47%', left: '10%', width: '55%' }} />

            {/* Table */}
            <div className="rp-circle a10" style={{ top: '50%', left: '6%', width: '54%', height: '11%' }} />
            <div className="rp note a11" style={{ top: '51%', left: '18%' }}>Effective comparison</div>
            <div className="rp tick t3 a11" style={{ top: '55%', left: '30%' }}>✓</div>
            <div className="rp tick t5 a11" style={{ top: '58%', left: '30%' }}>✓</div>
            <div className="rp-under a11" style={{ top: '60%', left: '10%', width: '45%' }} />

            {/* Flowchart diagram */}
            <div className="rp-circle a12" style={{ top: '48%', left: '60%', width: '36%', height: '17%', borderRadius: 10 }} />
            <div className="rp note a12" style={{ top: '50%', right: '5%' }}>Good visualization</div>
            <div className="rp note a12" style={{ top: '62%', right: '8%' }}>Clear flow</div>

            {/* Conclusion */}
            <div className="rp tick t2 a13" style={{ top: '68%', left: '4%' }}>✓</div>
            <div className="rp note a13" style={{ top: '67%', right: '12%' }}>Balanced conclusion</div>
            <div className="rp-under a14" style={{ top: '70%', left: '14%', width: '52%' }} />
            <div className="rp note a14" style={{ top: '72%', left: '20%' }}>Way forward needed</div>
            <div className="rp tick t4 a15" style={{ top: '74%', left: '4%' }}>✓</div>
            <div className="rp note a15" style={{ top: '76%', right: '15%' }}>Well written</div>

            <div className="rp-score">7.5/15</div>
          </div>
        </div>
      </div>
    </DemoStage>
  );
}
